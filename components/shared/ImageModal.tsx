"use client";

import React, { useState } from 'react'

import Image from "next/image"
import { motion } from "framer-motion";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalTrigger } from "../ui/animated-modal"
import { imageSliders } from "@/constants";
import { Lens } from '../ui/lens';

const ImageModal = ({ item }: { item: any }) => {

  const [imageSelected, setImageSelected] = useState<string>(imageSliders[0]?.img || '');

  const [hovering, setHovering] = useState(false);

  const handleImageSelected = (image: string) => {
    setImageSelected(image)
  }

  return (
    <Modal>
      <ModalTrigger className="flex justify-center group/modal-btn">
        <Image
          src={item.image}
          alt={item.subtitle || "blog thumnail"}
          width={760}
          height={540}
          className="object-cover mb-10 rounded-lg"
        />
      </ModalTrigger>
      <ModalBody className="md:max-w-[90%] max-w-[90%] rounded-2xl">
        <ModalContent>
          <h4 className="mb-8 text-lg font-bold text-center md:text-2xl text-neutral-600 dark:text-neutral-100">
            {item?.title}
          </h4>
          <div className='grid md:grid-cols-[330px_1fr] grid-cols-1 '>
            <div className="flex flex-col items-center justify-around max-md:flex-row">
              {imageSliders.map(({ id, title, desc, img, }, idx) => (
                <motion.div
                  key={"images" + idx}
                  style={{
                    rotate: Math.random() * 20 - 10,
                  }}
                  whileHover={{
                    scale: 1.1,
                    rotate: 0,
                    zIndex: 100,
                  }}
                  whileTap={{
                    scale: 1.1,
                    rotate: 0,
                    zIndex: 100,
                  }}
                  onClick={() => handleImageSelected(img)}
                  className="flex-shrink-0 p-1 mt-4 -mr-4 overflow-hidden bg-white border rounded-xl dark:bg-neutral-800 dark:border-neutral-700 border-neutral-100"
                >
                  <Image
                    src={img}
                    alt={title}
                    width={160}
                    height={114}
                    className="flex-shrink-0 object-cover rounded-lg"
                  />
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap items-start justify-start max-w-4xl py-10 mx-auto gap-x-4 gap-y-6">
              <Lens hovering={hovering} setHovering={setHovering}>
                <Image
                  src={imageSelected}
                  alt=""
                  role="presentation"
                  height="1000"
                  width="1000"
                  className="object-cover mb-4 rounded-lg"
                />
              </Lens>
            </div>
          </div>
        </ModalContent>
      </ModalBody>
    </Modal>
  )
}

export default ImageModal

