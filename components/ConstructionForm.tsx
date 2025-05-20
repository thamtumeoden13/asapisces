"use client"

import React, { useState, useActionState, useEffect } from 'react'
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { formConstructionSchema } from "@/lib/validation";
import z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createConstruction, updateConstruction } from "@/lib/actions";
import { Construction } from '@/sanity/types';
import MDEditorComponent from './shared/MDEditor';
import { CloudinaryImage } from './shared/CloudinaryImage';

type FormDataType = Omit<Construction, "author">;

const ConstructionForm = ({ post }: { post?: Construction }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pitch, setPitch] = useState("");
  const [formData, setFormData] = useState<FormDataType>();
  const { toast } = useToast()
  const router = useRouter();

  const handleFormSubmit = async (prevState: any, formDataSubmit: FormData) => {
    try {
      const formValues = {
        title: formDataSubmit.get("title") as string,
        subtitle: formDataSubmit.get("subtitle") as string,
        description: formDataSubmit.get("description") as string,
        thumbnail: formDataSubmit.get("thumbnail") as string,
        image: formDataSubmit.get("image") as string,
        orderIndex: formDataSubmit.get("orderIndex") as string,
        pitch,
      }

      await formConstructionSchema.parseAsync(formValues);

      console.log(formValues);

      const response = post
        ? await updateConstruction(prevState, formDataSubmit, pitch, formData?._id!)
        : await createConstruction(prevState, formDataSubmit, pitch);

      if (response.status === "SUCCESS") {
        toast({
          title: "Success",
          description: "Your construction pitch has been created successfully",
        })
      }

      router.push(`/auth`)
      return response;
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

  const handleChangeForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

    setFormData({
      ...formData!,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    if (post) {
      const { _id, title, subtitle, description, thumbnail, image, orderIndex } = post;
      console.log(post)

      setFormData({ ...formData!, _id, title, subtitle, description, thumbnail, image, orderIndex });

      if (post.pitch) {
        setPitch(post.pitch)
      }
    }
  }, [post])

  return (
    <form
      action={formAction}
      className={"startup-form"}
    >
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div>
          <label htmlFor="title" className={"startup-form_label"}>
            {"Tiêu Đề"}
          </label>
          <Input
            id={"title"}
            name={"title"}
            className={"startup-form_input"}
            placeholder={"Construction Title"}
            required
            value={formData?.title}
            onChange={handleChangeForm}
          />
          {errors.title && (
            <p className={"startup-form_error"}>{errors.title}</p>
          )}
        </div>
        <div>
          <label htmlFor="subtitle" className={"startup-form_label"}>
            {"Phụ Đề"}
          </label>
          <Input
            id={"subtitle"}
            name={"subtitle"}
            className={"startup-form_input"}
            placeholder={"Construction Subtitle"}
            required
            value={formData?.subtitle}
            onChange={handleChangeForm}
          />
          {errors.subtitle && (
            <p className={"startup-form_error"}>{errors.subtitle}</p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div>
          <label htmlFor="thumbnail" className={"startup-form_label"}>
            {"Ảnh Đại Diện(tỉ lệ 3:4)"}
          </label>
          <div>

            <Input
              id={"thumbnail"}
              name={"thumbnail"}
              className={"startup-form_input"}
              required
              placeholder={"Constructions Thumbnail URL"}
              value={formData?.thumbnail}
              onChange={handleChangeForm}
            />
            {formData?.thumbnail && (
              <div className='w-[280px] h-[200px] overflow-hidden mt-2 p-2 border border-black-100'>
                <CloudinaryImage
                  src={formData.thumbnail}
                  alt={"Project Thumbnail URL"}
                  width={280}
                  height={200}
                  className="object-cover w-full rounded-lg"
                />
              </div>
            )}
          </div>
          {errors.thumbnail && (
            <p className={"startup-form_error"}>{errors.thumbnail}</p>
          )}
        </div>

        <div>
          <label htmlFor="image" className={"startup-form_label"}>
            {"Hình Ảnh(tỉ lệ 6:9)"}
          </label>
          <div>

            <Input
              id={"image"}
              name={"image"}
              className={"startup-form_input"}
              required
              placeholder={"Project Image URL"}
              value={formData?.image}
              onChange={handleChangeForm}
            />

            {formData?.image && (
              <div className='w-[116px] h-[200px] overflow-hidden mt-2 p-2 border border-black-100'>
                <CloudinaryImage
                  src={formData.image}
                  alt={"Project Image URL"}
                  width={200}
                  height={200}
                  className="object-cover w-full rounded-lg"
                />
              </div>
            )}

          </div>
          {errors.image && (
            <p className={"startup-form_error"}>{errors.image}</p>
          )}
        </div>

      </div>
      <div className='grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4'>
        <div>
          <label htmlFor="description" className={"startup-form_label"}>
            {"Mô Tả"}
          </label>
          <Textarea
            id={"description"}
            name={"description"}
            className={"startup-form_textarea"}
            placeholder={"Construction Description"}
            required
            value={formData?.description}
            onChange={handleChangeForm}
          />
          {errors.description && (
            <p className={"startup-form_error"}>{errors.description}</p>
          )}
        </div>
        <div>
          <label htmlFor="orderIndex" className={"startup-form_label "}>
            {"Thứ Tự Hiển Thị"}
          </label>
          <Input
            id={"orderIndex"}
            name={"orderIndex"}
            className={"startup-form_input"}
            placeholder={"Order Index"}
            required
            type='number'
            min={0}
            value={formData?.orderIndex}
            onChange={handleChangeForm}
          />
          {errors.orderIndex && (
            <p className={"startup-form_error"}>{errors.orderIndex}</p>
          )}
        </div>
      </div>
      <div data-color-mode={"light"}>
        <label htmlFor="pitch" className={"startup-form_label"}>
          {"Bài viết"}
        </label>
        <MDEditorComponent
          value={pitch}
          onChange={(value) => setPitch(value as string)}
        />
      </div>
      <Button
        type={"submit"}
        className={"startup-form_btn text-white"}
        disabled={isPending}
      >
        {isPending ? "Đang lưu..." : "Lưu"}
        <Send className={"size-6 ml-2"} />
      </Button>
    </form>
  )
}
export default ConstructionForm