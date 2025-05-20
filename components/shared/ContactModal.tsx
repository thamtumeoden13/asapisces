"use client";

import React, { useState } from 'react'

import Image from "next/image"
import { motion } from "framer-motion";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalTrigger } from "../ui/animated-modal"
import { imageSliders } from "@/constants";
import { Lens } from '../ui/lens';
import Contact from "../Contact";

const ContactModal = () => {

  const [imageSelected, setImageSelected] = useState<string>(imageSliders[0]?.img || '');

  const [hovering, setHovering] = useState(false);

  const handleImageSelected = (image: string) => {
    setImageSelected(image)
  }

  return (
    <Modal>
      <ModalTrigger className="flex justify-center group/modal-btn">
        <div
          className="flex items-center w-full md:w-[240px] h-fit py-4 px-6 bg-primary rounded-[32px] gap-[12px]"
        >
          <img
            src="/headset.svg"
            alt="headset"
            className="w-[24px] h-[24px] object-contain"
          />
          <span className="font-normal text-[16px] text-white">Bạn Cần Hỗ Trợ</span>
        </div>
      </ModalTrigger>
      <ModalBody className="md:max-w-[720px] md:min-w-[720px] rounded-2xl">
        <ModalContent className="overflow-y-scroll">
          <div className="flex flex-col items-center justify-around max-md:flex-row">
            <Contact className="md:min-w-[640px] min-w-[430px]" />
          </div>
        </ModalContent>
      </ModalBody>
    </Modal>
  )
}

export default ContactModal

