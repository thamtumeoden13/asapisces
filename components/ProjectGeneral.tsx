// "use client";

import React, { } from 'react'

import Image from "next/image"
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger
} from "./ui/animated-modal"
import { imageSliders } from "@/constants";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { StartupCardType } from './StartupCard';
import markdownit from "markdown-it";
import { notFound } from 'next/navigation';
import ImageModal from './shared/ImageModal';

const md = markdownit();

const ProjectGeneral = ({ post }: { post: StartupCardType }) => {

  // const [imageSelected, setImageSelected] = useState<string>(imageSliders[0]?.img || '');

  // const handleImageSelected = (image: string) => {
  //   setImageSelected(image)
  // }

  console.log(post)

  if (!post) return notFound();

  const parsedContent = md.render(post?.pitch || '');

  return (
    <TracingBeam className="px-6 max-w-7xl">
      <div className="mx-auto antialiased pt-4 relative">
        <div className={"space-y-5 px-4 max-w-5xl mx-auto"}>
          <ImageModal item={post} />

          <h3 className={"text-30-bold"}>Bài Viết Chi Tiết</h3>
          {parsedContent ? (
            <article
              className={"prose max-w-7xl font-ibm-plex text-justify"}
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          ) : (
            <p className={"no-result"}>Không tìm thấy thông tin phù hợp</p>
          )}
        </div>
      </div>
    </TracingBeam>
  )
}

export default ProjectGeneral
