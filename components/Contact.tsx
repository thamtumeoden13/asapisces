"use client"

import React, { useState, useRef, useActionState } from 'react'
import { motion } from 'framer-motion'
import emailjs from '@emailjs/browser'
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

// import { EarthCanvas } from './canvas'
// import { SectionWrapper } from '../hoc'
import styles from "@/styles"
import { cn, staggerContainer } from "@/lib/utils"
import { TypewriterEffectSmooth } from "./ui/typewriter-effect"
import { formContactSchema } from "@/lib/validation";
import z from "zod";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

const Contact = ({ className }: { className?: string }) => {

  const formRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast()

  const handleFormSubmit = async (prevState: any, formData: FormData) => {
    try {
      const formValues = {
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        message: formData.get("message") as string
      }

      await formContactSchema.parseAsync(formValues);

      console.log(formValues);

      const result = await emailjs.send('service_djy948a', 'template_jd2t2tf',
        {
          from_name: formValues.name,
          to_name: 'Art Sunday',
          from_email: formValues.email,
          to_email: 'artsunday.vn@gmail.com',
          message: `Số điện thoại: ${formValues.phone} \n Nội dung: ${formValues.message}`
        },
        'ugaUp8luB88w0ka3B'
      )

      if (result.status == 200) {
        toast({
          title: "Success",
          description: "Thank you, I will get back to you as soon as possible",
        })
      }


      return {
        // ...prevState,
        error: "",
        status: "SUCCESS",
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;

        setErrors(fieldErrors as unknown as Record<string, string>);

        toast({
          title: "Error",
          description: "Please check your inputs and try again",
          variant: "destructive",
        })

        return { ...prevState, error: "Validation failed", status: "ERROR" };
      }

      toast({
        title: "Error",
        description: "An unexpected error has occurred",
        variant: "destructive",
      })

      return {
        ...prevState,
        error: "An unexpected error has occurred",
        status: "ERROR",
      }
    }
  }

  const [state, formAction, isPending] = useActionState(
    handleFormSubmit,
    {
      error: "",
      status: "INITIAL",
    }
  );


  return (
    <motion.div
      variants={staggerContainer()}
      className={cn('flex-[0.75] bg-black p-8 rounded-2xl border-white border', className)}
    >
      <p className={styles.sectionSubText}>Liên Hệ</p>
      <TypewriterEffectSmooth words={words_1} cursorClassName="bg-primary" />

      <form
        ref={formRef}
        action={formAction}
        className='flex flex-col gap-8 mt-12'
      >
        <label className='flex flex-col'>
          <span className='mb-4 font-medium text-white'>
            Tên của bạn
          </span>
          <Input
            required
            id="name"
            name='name'
            placeholder="Tên của bạn?"
            className='h-12 px-6 py-4 font-medium text-black border-none rounded-lg outline-none bg-tertiary placeholder:text-primary'
          />
          {errors.name && (
            <p className={"startup-form_error"}>{errors.name}</p>
          )}
        </label>
        <label className='flex flex-col'>
          <span className='mb-4 font-medium text-white'>
            Số điện thoại
          </span>
          <Input
            required
            id="name"
            name='phone'
            type='tel'
            placeholder="Số điện thoại của bạn?"
            className='h-12 px-6 py-4 font-medium text-black border-none rounded-lg outline-none bg-tertiary placeholder:text-primary'
          />
          {errors.email && (
            <p className={"startup-form_error"}>{errors.email}</p>
          )}
        </label>
        <label className='flex flex-col'>
          <span className='mb-4 font-medium text-white'>
            Địa chỉ Email
          </span>
          <Input
            required
            id="name"
            name='email'
            placeholder="Địa chỉ Email của bạn?"
            className='h-12 px-6 py-4 font-medium text-black border-none rounded-lg outline-none bg-tertiary placeholder:text-primary'
          />
          {errors.email && (
            <p className={"startup-form_error"}>{errors.email}</p>
          )}
        </label>
        <label className='flex flex-col'>
          <span className='mb-4 font-medium text-white'>
            Nội dung
          </span>
          <Textarea
            required
            rows={7}
            id="message"
            name='message'
            placeholder="Vui lòng cho chúng tôi biết yêu cầu của bạn"
            className='px-6 py-4 font-medium text-black border-none rounded-lg outline-none bg-tertiary placeholder:text-primary'
          />
          {errors.message && (
            <p className={"startup-form_error"}>{errors.message}</p>
          )}
        </label>

        <Button
          type={"submit"}
          className={"startup-form_btn text-white"}
          disabled={isPending}
        >
          {isPending ? "Đang Gửi..." : "Gửi tin nhắn"}
          <Send className={"size-6 ml-2"} />
        </Button>
      </form>
    </motion.div>
  )
}

export default Contact; // SectionWrapper(Contact, 'contact')


const words_1 = [
  {
    text: "YÊU",
    className: "text-white",
  },
  {
    text: "CẦU",
    className: "text-white",
  },
  {
    text: "TƯ",
    className: "text-primary",
  },
  {
    text: "VẤN",
    className: "text-primary",
  },
  {
    text: "DỊCH VỤ",
    className: "text-white",
  },
];