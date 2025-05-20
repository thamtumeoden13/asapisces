"use client"

import { useEffect, useState } from "react"
import MarkdownIt from "markdown-it"
import MarkdownItVideo from "markdown-it-video";
import { useImageGallery } from "./ImageGalleryContext"

interface MarkdownRendererProps {
  markdown: string
}

export default function MarkdownRenderer({ markdown }: MarkdownRendererProps) {
  const [html, setHtml] = useState("")
  const { registerImage, openGallery } = useImageGallery()

  useEffect(() => {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    }).use(MarkdownItVideo, {
      youtube: { width: "100%", height: "640px" },
    })

    // Add YouTube plugin
    md.use(youtubePlugin)

    // Store the original image renderer
    const defaultRender =
      md.renderer.rules.image || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

    // Override the image renderer
    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const srcIndex = token.attrIndex("src")
      const src = token.attrs?.[srcIndex][1] || ""
      const altIndex = token.attrIndex("alt")
      const alt = token.attrs?.[altIndex]?.[1] || ""

      // Register this image with the gallery context
      registerImage({ src, alt })

      // Render the image with the default renderer
      const defaultHtml = defaultRender(tokens, idx, options, env, self)

      // Wrap the image in a div with a click handler
      return `<div class="inline-block cursor-pointer" data-gallery-image="${src}">${defaultHtml}</div>`
    }

    // Render the markdown to HTML
    setHtml(md.render(markdown))
  }, [markdown, registerImage])

  useEffect(() => {
    // Add click handlers to all gallery images
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const galleryImage = target.closest("[data-gallery-image]")

      if (galleryImage) {
        const src = galleryImage.getAttribute("data-gallery-image")
        if (src) {
          e.preventDefault()
          openGallery(src)
        }
      }
    }

    document.addEventListener("click", handleImageClick)

    return () => {
      document.removeEventListener("click", handleImageClick)
    }
  }, [openGallery])

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

// YouTube plugin for markdown-it
function youtubePlugin(md: any) {
  const youtubeRegex = /@\[youtube\]$$(.*?)$$/

  md.inline.ruler.after("emphasis", "youtube", (state: any) => {
    const match = youtubeRegex.exec(state.src.slice(state.pos))
    if (!match) return false

    const url = match[1]
    const videoId = extractVideoId(url)
    if (!videoId) return false

    // Update state
    const token = state.push("html_inline", "", 0)
    token.content = `<div class="aspect-w-16 aspect-h-9 my-4">
      <iframe 
        src="https://www.youtube.com/embed/${videoId}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        class="w-full h-full rounded-lg"
      ></iframe>
    </div>`

    state.pos += match[0].length
    return true
  })
}

function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}
