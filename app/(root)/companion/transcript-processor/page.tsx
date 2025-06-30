"use client"

/**
 * Route : /transcript-processor
 * Renders the transcript-processing playground
 */

import dynamic from "next/dynamic"

//  ⬇ import the component you already have.
//  If you kept the original name use “TranscriptProcessorComponent”.
//  If you switched to the enhanced one, change the import below.
const TranscriptProcessorComponent = dynamic(
  () => import("@/components/companion/transcript-processor"), // 👈 update if you renamed the file
  { ssr: false }, // run only on the client
)

export default function TranscriptProcessorPage() {
  return (
    <main className="min-h-screen bg-white py-10">
      <TranscriptProcessorComponent />
    </main>
  )
}
