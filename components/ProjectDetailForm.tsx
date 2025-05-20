"use client"

import React, { useState, useActionState, useEffect } from 'react'
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { formProjectDetailSchema } from "@/lib/validation";
import z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createProjectDetail, updateProjectDetail } from "@/lib/actions";
import { Combobox, ComboboxDataType } from "./shared/ComboBox";
import {  clientNoCache } from "@/sanity/lib/client";
import { PROJECTS_BY_QUERY } from "@/sanity/lib/queries";
import { Author, Project, ProjectDetail } from '@/sanity/types';
import MDEditorComponent from './shared/MDEditor';
import { CloudinaryImage } from './shared/CloudinaryImage';

type FormDataType = Omit<ProjectDetail, "author" | "project"> & { investor?: string, address?: string, scale?: string, _function?: string, expense?: string, designTeam?: string, designYear?: string, estimatedTime?: string }
type ProjectDetailFormType = Omit<ProjectDetail, "author" | "project"> & { author?: Author } & { project?: Project };

const ProjectDetailForm = ({ post }: { post?: ProjectDetailFormType }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pitch, setPitch] = useState<string>("");
  const [formData, setFormData] = useState<FormDataType | null>(null);

  const [selected, setSelected] = useState<ComboboxDataType | null>(null);
  const [initValue, setInitValue] = useState<string>('');
  const [projects, setProjects] = useState<ComboboxDataType[]>([])
  const { toast } = useToast()
  const router = useRouter();

  const handleFormSubmit = async (prevState: { error: string; status: string }, formData: FormData) => {
    try {

      const projectId = selected?._id ?? initValue;

      const formValues = {
        title: formData.get("title") as string,
        subtitle: formData.get("subtitle") as string,
        tags: formData.get("tags") as string,
        description: formData.get("description") as string,
        thumbnail: formData.get("thumbnail") as string,
        image: formData.get("image") as string,
        orderIndex: formData.get("orderIndex") as string,
        projectId,
        pitch,
      }

      console.log({ formValues });
      await formProjectDetailSchema.parseAsync(formValues);

      console.log('post', post?._id);

      const response = post
        ? await updateProjectDetail(prevState, formData, pitch, projectId, post._id)
        : await createProjectDetail(prevState, formData, pitch, projectId);

      if (response.status === "SUCCESS") {
        toast({
          title: "Success",
          description: "Your project pitch has been created successfully",
        })
      }

      // router.push(`/bai-viet/${selected?.slug?.current}`)
      router.push(`/admin/bai-viet`)
      return response;
    } catch (error) {

      console.error('ProjectDetailForm -> handleFormSubmit', error)
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

    if (!formData) {
      return;
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }


  useEffect(() => {
    const getConstructions = async () => {
      const result = await clientNoCache.fetch(PROJECTS_BY_QUERY, { search: null });

      setProjects(result || [])
    }

    getConstructions();

  }, [])

  useEffect(() => {
    if (post) {

      const { title, subtitle, tags, description, thumbnail, image, project, orderIndex, overview } = post;

      const _formData = {
        ...formData!,
        title,
        subtitle,
        tags,
        description,
        thumbnail,
        image,
        orderIndex,
        investor: overview?.investor,
        address: overview?.address,
        scale: overview?.scale,
        _function: overview?.function,
        expense: overview?.expense,
        designTeam: overview?.designTeam,
        designYear: overview?.designYear,
        estimatedTime: overview?.estimatedTime,
      }

      console.log('post -> _formData', _formData)

      setFormData({ ..._formData });

      if (post.pitch) {
        setPitch(post.pitch)
      }
      if (project) {
        setInitValue(project._id);
      }
    }
  }, [post])

  return (
    <form
      action={formAction}
      className={"startup-form"}
    >
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div>
          <label htmlFor="title" className={"startup-form_label"}>
            {"Tiêu Đề"}
          </label>
          <Input
            id={"title"}
            name={"title"}
            className={"startup-form_input"}
            required
            placeholder={"Vui lòng nhập tiêu đề"}
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
            required
            placeholder={"Vui lòng nhập phụ đề"}
            value={formData?.subtitle}
            onChange={handleChangeForm}
          />
          {errors.subtitle && (
            <p className={"startup-form_error"}>{errors.subtitle}</p>
          )}
        </div>
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
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
              placeholder={"Vui lòng nhập đường dẫn ảnh đại diện"}
              value={formData?.thumbnail}
              onChange={handleChangeForm}
            />
            {formData?.thumbnail && (
              <div className='w-[280px] h-[200px] overflow-hidden mt-2 p-2 border border-black-100'>
                <CloudinaryImage
                  src={formData.thumbnail}
                  alt={""}
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
              placeholder={"Vui lòng nhập đường dẫn hình ảnh"}
              value={formData?.image}
              onChange={handleChangeForm}
            />

            {formData?.image && (
              <div className='w-[116px] h-[200px] overflow-hidden mt-2 p-2 border border-black-100'>
                <CloudinaryImage
                  src={formData.image}
                  alt={""}
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

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div>
          <label htmlFor="tags" className={"startup-form_label"}>
            {"Dán Nhãn"}
          </label>
          <Input
            id={"tags"}
            name={"tags"}
            className={"startup-form_input"}
            required
            placeholder={"vui lòng nhập dán nhãn"}
            value={formData?.tags}
            onChange={handleChangeForm}
          />
          {errors.tags && (
            <p className={"startup-form_error"}>{errors.tags}</p>
          )}
        </div>
        <div>
          <label htmlFor="image" className={"startup-form_label"}>
            {"Dự Án"}
          </label>
          <Combobox
            data={projects}
            initValue={initValue}
            className={"startup-form_input justify-between"}
            onChange={(value: ComboboxDataType | null) => { setSelected(value) }}
          />
          {errors.projectId && (
            <p className={"startup-form_error"}>{errors.projectId}</p>
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
            required
            placeholder={"Vui lòng nhập mô tả"}
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
            placeholder={"Thứ tự"}
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

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div>
          <label htmlFor="investor" className={"startup-form_label"}>
            {"Chủ Đầu Tư"}
          </label>
          <Input
            id={"investor"}
            name={"investor"}
            className={"startup-form_input"}
            placeholder={"vui lòng nhập chủ đầu tư"}
            value={formData?.investor}
            onChange={handleChangeForm}
          />
          {errors.investor && (
            <p className={"startup-form_error"}>{errors.investor}</p>
          )}
        </div>
        <div>
          <label htmlFor="address" className={"startup-form_label"}>
            {"Địa Điểm"}
          </label>
          <Input
            id={"address"}
            name={"address"}
            className={"startup-form_input"}
            placeholder={"vui lòng nhập địa điểm"}
            value={formData?.address}
            onChange={handleChangeForm}
          />
          {errors.address && (
            <p className={"startup-form_error"}>{errors.address}</p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div>
          <label htmlFor="scale" className={"startup-form_label"}>
            {"Diện Tích"}
          </label>
          <Input
            id={"scale"}
            name={"scale"}
            className={"startup-form_input"}
            placeholder={"Vui lòng nhập diện tích"}
            value={formData?.scale}
            onChange={handleChangeForm}
          />
          {errors.scale && (
            <p className={"startup-form_error"}>{errors.scale}</p>
          )}
        </div>
        <div>
          <label htmlFor="_function" className={"startup-form_label"}>
            {"Quy Mô Dự Án"}
          </label>
          <Input
            id={"_function"}
            name={"_function"}
            className={"startup-form_input"}
            placeholder={"Vui lòng nhập quy mô dự án"}
            value={formData?._function}
            onChange={handleChangeForm}
          />
          {errors.function && (
            <p className={"startup-form_error"}>{errors.function}</p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div>
          <label htmlFor="expense" className={"startup-form_label"}>
            {"Kinh Phí"}
          </label>
          <Input
            id={"expense"}
            name={"expense"}
            className={"startup-form_input"}
            placeholder={"vui lòng nhập kinh phí"}
            value={formData?.expense}
            onChange={handleChangeForm}
          />
          {errors.expense && (
            <p className={"startup-form_error"}>{errors.expense}</p>
          )}
        </div>
        <div>
          <label htmlFor="designTeam" className={"startup-form_label"}>
            {"Nhóm Thiết Kế"}
          </label>
          <Input
            id={"designTeam"}
            name={"designTeam"}
            className={"startup-form_input"}
            placeholder={"vui lòng nhập nhóm thiết kế"}
            value={formData?.designTeam}
            onChange={handleChangeForm}
          />
          {errors.designTeam && (
            <p className={"startup-form_error"}>{errors.designTeam}</p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div>
          <label htmlFor="designYear" className={"startup-form_label"}>
            {"Năm Thiết Kế"}
          </label>
          <Input
            id={"designYear"}
            name={"designYear"}
            className={"startup-form_input"}
            placeholder={"vui lòng nhập năm thiết kế"}
            value={formData?.designYear}
            onChange={handleChangeForm}
          />
          {errors.designYear && (
            <p className={"startup-form_error"}>{errors.designYear}</p>
          )}
        </div>
        <div>
          <label htmlFor="estimatedTime" className={"startup-form_label"}>
            {"Thời Gian Hoàn Thiện"}
          </label>
          <Input
            id={"estimatedTime"}
            name={"estimatedTime"}
            className={"startup-form_input"}
            placeholder={"Vui lòng nhập thời gian hoàn thiện"}
            value={formData?.estimatedTime}
            onChange={handleChangeForm}
          />
          {errors.estimatedTime && (
            <p className={"startup-form_error"}>{errors.estimatedTime}</p>
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
export default ProjectDetailForm