import React from 'react'

import Image from 'next/image';

export const ContactButton = async () => {

  return (
    <div className={"view-container left-3 relative z-20"}>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://zalo.me/0971196061"
        className={"flex items-center justify-center"}
      >
        <Image
          src="/icons8-zalo.svg"
          alt="contact"
          width={20}
          height={20}
          className={"size-20 object-contain z-10"}
        />
      </a>
      <div className={"absolute inset-0 flex items-center justify-center"}>
        <div className={"relative"}>
          <span className={"flex size-12"}>
            <span
              className={
                "absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
              }
            />
          </span>
        </div>
      </div>
    </div>

  )
}
