"use client"

import React, { useEffect, useState } from 'react'
import { PROJECT_DETAILS_BY_PROJECT_QUERY, PROJECT_DETAILS_BY_QUERY, PROJECTS_BY_QUERY } from '@/sanity/lib/queries';
import { TableComponent } from './shared/Table';
import { client, clientNoCache } from '@/sanity/lib/client';
import { useRouter } from 'next/navigation';
import { Project, ProjectDetail, Author } from '@/sanity/types';
import { toast } from '@/hooks/use-toast';
import { deleteById } from '@/lib/actions';
import { PlusCircleIcon } from 'lucide-react';
import { Combobox, ComboboxDataType } from './shared/ComboBox';

type ProjectDetailTableProps = Omit<ProjectDetail, 'author' | 'project'> & { project: Project } & { author: Author }

const ProjectDetailTable = ({ title, author }: { title: string, author: Author }) => {
  const router = useRouter();
  const [selected, setSelected] = useState<ComboboxDataType | null>(null);
  const [actions, setActions] = useState<string[]>([]);

  const [projects, setProjects] = useState<ComboboxDataType[] | []>([])
  const [projectDetails, setProjectDetails] = useState<ProjectDetailTableProps[] | []>([])

  const getProjects = async () => {
    const params = { search: null }
    const searchForProjects = await clientNoCache.fetch(PROJECTS_BY_QUERY, params);

    setProjects(searchForProjects);
  }

  const getProjectDetails = async () => {
    const params = selected ? { id: selected._id } : { search: null }
    const query = selected ? PROJECT_DETAILS_BY_PROJECT_QUERY : PROJECT_DETAILS_BY_QUERY
    const searchForProjectDetails = await clientNoCache.fetch(query, params);

    const _searchForProjectDetails = searchForProjectDetails
      .filter((projectDetail: ProjectDetailTableProps) => !!projectDetail.project)
      .map((projectDetail: ProjectDetailTableProps) => { return { ...projectDetail, parent: projectDetail.project.title } })

    setProjectDetails(_searchForProjectDetails);
  }


  const handleDelete = async (post: ProjectDetail) => {
    console.log('ProjectTable -> handleDelete', post._id)
    if (confirm('Are you sure you want to delete this item?')) {
      const { error, status } = await deleteById(post._id)
      if (status === 'ERROR') {
        console.error('ProjectTable -> handleDelete', error)
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
        return;
      }

      toast({ title: "Success", description: "Your item has been deleted successfully" });

      getProjectDetails();
    }
  }

  const handleEdit = async (post: ProjectDetail) => {
    console.log('TableComponent -> path', post)
    router.push(`/auth/bai-viet/${post.slug?.current}`)
  }

  const handleAddProjectDetail = async () => {
    router.push(`/auth/bai-viet/create`)
  }

  useEffect(() => {
    getProjects();
    getProjectDetails();
  }, [])

  useEffect(() => {
    getProjectDetails();
  }, [selected])

  useEffect(() => {
    let actions: string[] = [];
    if (author.role == 'admin') {
      actions = ['Edit', 'Delete'];
    } else if (author.role == 'editor') {
      actions = ['Edit'];
    }
    setActions(actions)
  }, [author])

  if (!projectDetails) return <div>Loading...</div>;

  return (
    <section className={"section_container !justify-items-center !mt-0 overflow-auto h-full"}>
      <div className='absolute top-0 left-0 flex items-center justify-between w-full h-24 gap-10 px-16 py-4 '>
        <Combobox
          data={projects}
          className={"startup-form_input !mt-0 !max-w-[32rem] !h-[2.5rem] !border-white-100 !text-white-100 !text-[18px]"}
          onChange={(value: ComboboxDataType | null) => { setSelected(value) }}
        />
        <div className='flex items-center justify-end gap-10 py-4'>
          <p>{title}</p>
          {(author.role == 'admin' || author.role == 'editor') && <PlusCircleIcon className={"size-12 text-white hover:cursor-pointer"} onClick={handleAddProjectDetail} />}
        </div>
      </div>
      <div className='flex justify-end w-full h-full mt-10'>
        <TableComponent
          data={projectDetails}
          headers={['Tiêu đề', 'Đường dẫn', 'Ảnh tiêu đề', 'Thứ tự', 'Dự Án']}
          title={title}
          path='bai-viet'
          actions={actions}
          author={author}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>
    </section>
  )
}
export default ProjectDetailTable
