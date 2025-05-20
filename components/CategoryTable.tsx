"use client"

import React, { useEffect, useState } from 'react'
import { CATEGORY_BY_SLUG_QUERY, PROJECT_DETAILS_BY_QUERY, PROJECTS_BY_QUERY } from '@/sanity/lib/queries';
import { TableComponent } from './shared/Table';
import { Combobox, ComboboxDataType } from './shared/ComboBox';
import { client, clientNoCache } from '@/sanity/lib/client';
import { PlusCircleIcon } from 'lucide-react';
import { Author, Project } from '@/sanity/types';
import { updateCategory } from '@/lib/actions';
import { toast } from '@/hooks/use-toast';

const CategoryTable = ({ slug, title, author }: { slug: string, title: string, author: Author }) => {
  const params = { slug }

  const [projects, setProjects] = useState<ComboboxDataType[] | null>(null)
  const [homeHeroPost, setHomeHeroPost] = useState<Project[] | null>([])
  const [categoryId, setCategoryId] = useState<string>('')
  const [selected, setSelected] = useState<ComboboxDataType | null>(null);

  const getProjects = async () => {
    const projects = await clientNoCache.fetch(PROJECT_DETAILS_BY_QUERY, { search: null });
    setProjects(projects);
  }

  const getCategorySelect = async () => {
    const { _id, select: homeHeroPost } = await clientNoCache.fetch(CATEGORY_BY_SLUG_QUERY, params)

    setHomeHeroPost(homeHeroPost);
    setCategoryId(_id);
  }

  const handleAddCategorySelect = async () => {
    if (!selected) return;

    const { error, status } = await updateCategory('', categoryId, selected._id)
    if (status === 'ERROR') {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
      return;
    }
    toast({
      title: "Success",
      description: "Your Home Hero has been updated successfully",
      // variant: "destructive",
    });
    getProjects();
    getCategorySelect();
  }

  const handleDelete = async (post: Project) => {
    const { error, status } = await updateCategory('', categoryId, post._id, true)

    if (status === 'ERROR') {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
      return;
    }

    toast({
      title: "Success",
      description: "Your Home Hero has been deleted successfully",
      // variant: "destructive",
    });

    getProjects();
    getCategorySelect();
  }

  useEffect(() => {
    getProjects();
    getCategorySelect();
  }, [])

  if (!projects || !homeHeroPost) return <div>Loading...</div>;

  return (
    <section className={"section_container !justify-items-center !mt-0 overflow-auto h-full"}>

      <div className='absolute top-0 left-0 right-0 flex items-center justify-between w-full h-24 px-10 py-4 '>
        <p className='w-96'>{title}</p>
        {(author.role == 'admin' || author.role == 'editor') && <div className='flex items-center justify-end flex-1 gap-10 py-10'>
          <Combobox
            data={projects}
            className={"startup-form_input !mt-0 !max-w-[48rem] !h-[2.5rem] !border-white-100 !text-white-100 !text-[18px]"}
            onChange={(value: ComboboxDataType | null) => { setSelected(value) }}
          />
          <PlusCircleIcon className={"size-12 text-white hover:cursor-pointer"} onClick={handleAddCategorySelect} />
        </div>}
      </div>
      <div className='flex justify-end w-full h-full' >
        <TableComponent
          data={homeHeroPost}
          title={title}
          actions={author.role == 'admin' ? ['Delete'] : []}
          author={author}
          onDelete={handleDelete}
        />
      </div>
    </section>
  )
}
export default CategoryTable
