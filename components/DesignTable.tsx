"use client"

import React, { useEffect, useState } from 'react'
import { DESIGNS_BY_QUERY } from '@/sanity/lib/queries';
import { clientNoCache } from '@/sanity/lib/client';
import { Design } from '@/sanity/types';
import { useRouter } from 'next/navigation';
import { deleteById } from '@/lib/actions';
import { toast } from '@/hooks/use-toast';
import { PlusCircleIcon } from 'lucide-react';
import { TableComponent } from './shared/Table';

const DesignTable = ({ title, role }: { title: string, role?: string }) => {
  const router = useRouter();

  const [designs, setDesigns] = useState<Design[] | []>([])

  const getDesigns = async () => {
    const params = { search: null }
    const searchForProjects = await clientNoCache.fetch(DESIGNS_BY_QUERY, params);
    setDesigns(searchForProjects);
  }

  const handleDelete = async (post: Design) => {
    console.log('DesignTable -> handleDelete', post._id)
    if (confirm('Are you sure you want to delete this item?')) {
      const { error, status } = await deleteById(post._id)
      if (status === 'ERROR') {
        console.error('DesignTable -> handleDelete', error)
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
        return;
      }

      toast({ title: "Success", description: "Your item has been deleted successfully" });

      getDesigns();
    }
  }

  const handleEdit = async (post: Design) => {
    console.log('TableComponent -> path', post)
    router.push(`/auth/thiet-ke/${post.slug?.current}`)
  }

  const handleAddDesign = async () => {
    router.push(`/auth/thiet-ke/create`)
  }

  useEffect(() => {
    getDesigns();
  }, [])

  if (!designs) return <div>Loading...</div>;

  console.log('DesignTable -> role', role)
  return (
    <section className={"section_container !justify-items-center !mt-0 overflow-auto h-full"}>
      <div className='absolute top-0 flex items-center justify-end w-full h-24 gap-10 py-4 right-10 '>
        <p>{title}</p>
        {(role == 'admin' || role == 'editor') && <PlusCircleIcon className={"size-12 text-white hover:cursor-pointer"} onClick={handleAddDesign} />}
      </div>
      <div className='flex justify-end w-full h-full'  >
        <TableComponent
          data={designs}
          title={title}
          path='thiet-ke'
          actions={role == 'admin' || role == 'editor' ? ['Edit', 'Delete'] : []}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>
    </section>
  )
}
export default DesignTable
