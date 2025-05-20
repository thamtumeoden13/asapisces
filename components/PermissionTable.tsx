"use client"

import React, { useEffect, useState } from 'react'
import { AUTHORS_BY_QUERY } from '@/sanity/lib/queries';
import { clientNoCache } from '@/sanity/lib/client';
import { Author, ProjectDetail } from '@/sanity/types';
import { toast } from '@/hooks/use-toast';
import { deleteById, updateRoleByAdmin } from '@/lib/actions';
import { TableComponent } from './shared/Table';

const PermissionTable = ({ title, author }: { title: string, author: Author }) => {

  const [users, setUsers] = useState<Author[] | []>([])

  const getUsers = async () => {
    const params = { search: null }
    const searchUsers = await clientNoCache.fetch(AUTHORS_BY_QUERY, params);

    console.log('PermissionTable -> getUsers', searchUsers)
    setUsers(searchUsers);
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
      getUsers();
    }
  }

  const handleEdit = async (post: Author) => {
    console.log('handleEdit Author -> post', post)
    const { error, status } = await updateRoleByAdmin(post)

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
      description: "Your Role has been updated successfully",
      // variant: "destructive",
    });

    getUsers();

  }

  useEffect(() => {
    getUsers();
  }, [])

  if (!users) return null;

  return (
    <section className={"section_container !justify-items-center !mt-0 overflow-auto h-full"}>
      <div className='absolute top-0 flex items-center justify-end w-full h-24 gap-10 py-4 right-10 '>
        <p> {title}</p>
      </div>
      <div className='flex justify-end w-full h-full'>
        <TableComponent
          data={users}
          headers={['Tên', 'Email', 'Ảnh Đại Diện', 'Cấp/Quyền']}
          customType={'author'}
          title={title}
          actions={['Delete', 'Edit']}
          author={author}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>
    </section>
  )
}
export default PermissionTable
