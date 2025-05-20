"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils";
import { EditIcon, TrashIcon } from "lucide-react";
import Image from "next/image";
import { Combobox, ComboboxDataType } from "./ComboBox";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Author } from "@/sanity/types";

type Session = {
  id: string;
  [key: string]: any;
}

export const TableComponent = ({
  headers = ['Tiêu đề', 'Đường dẫn', 'Ảnh tiêu đề', 'Thứ tự', 'Mô tả'],
  customType = '',
  data, title, className, path, overridePath = false,
  actions = [],
  author,
  onDelete, onEdit,
}: {
  headers?: string[];
  customType?: string;
  data: any[];
  title: string;
  className?: string;
  path?: string;
  overridePath?: boolean
  actions?: string[];
  author: Author;
  onDelete?: (post: any) => void;
  onEdit?: (post: any) => void;
}
) => {

  const [dataList, setDataList] = useState(data)

  const handleActionRow = (post: any, action: string) => {
    if (action === 'Edit') {
      if (onEdit) onEdit(post)
    } else if (action === 'Delete') {
      if (onDelete) onDelete(post)
    }
  }

  const handleEditRow = (item: ComboboxDataType) => {

    const newData = dataList.map((data) => {
      if (data._id === item._id) {
        return item
      }
      return data
    })
    setDataList(newData)
  }

  const renderCustomColumns = (item: any) => {
    if (customType === 'author') {
      return (
        <>
          <TableCell width={200}>{item.name}</TableCell>
          <TableCell >{item.email}</TableCell>
          <TableCell width={500} >
            <Image
              src={item.image}
              alt={'avatar'}
              width={500}
              height={200}
              className="object-cover w-full rounded-sm"
            />

          </TableCell>
          <TableCell>
            <Combobox
              data={[
                { _id: 'admin', title: 'Admin' },
                { _id: 'editor', title: 'Editor' },
                { _id: 'viewer', title: 'Viewer' },
              ]}
              initValue={item.role}
              className={"!mt-0 !w-[24rem] !h-[2.5rem] !border-white-100 !text-white-100 !text-[18px]"}
              onChange={(value: ComboboxDataType | null) => handleEditRow({ ...item, role: value!._id })}
            />
          </TableCell>
        </>
      )
    }

    return null
  }

  useEffect(() => {
    console.log('TableComponent -> data', data)
    setDataList(data)
  }, [data])

  return (
    <Table className={cn('w-full', className)}>
      <TableHeader>
        <TableRow className="min-w-20 w-full">
          {headers.map((header, index) => (
            <TableHead key={header} className="text-20-medium !text-white">{header}</TableHead>
          ))}
          {!!actions.length && <TableHead className="text-20-medium !text-white w-20">{"Thao tác"}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dataList.map((item, index) => (
          <TableRow key={`${item._id}-${index}`} className="hover:bg-slate-800">
            {!customType ? (
              <>
                <TableCell width={200} className="font-medium">{item.title}</TableCell>
                <TableCell width={200}>
                  <Link href={overridePath ? `/${item.slug?.current}` : `/${path}/${item.slug?.current}`} className="text-primary hover:underline" target="_blank">
                    {item.slug?.current}
                  </Link>
                </TableCell>
                <TableCell width={200} height={100}>
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    width={100}
                    height={100}
                    className="object-cover w-full rounded-sm"
                  />

                </TableCell>
                <TableCell className="font-normal" width={100}>{item.orderIndex || index}</TableCell>
                <TableCell className="font-normal" width={200}>{item.parent || item.description}</TableCell>
              </>
            ) : (
              renderCustomColumns(item)
            )
            }
            {[...actions]?.map((act) => (
              <TableCell key={act} className="justify-center" width={50}>
                {act === 'Edit' && author && (author.role === 'admin' || (author.role === 'editor' && item.author?._id === author?._id)) && <EditIcon className={"size-6 text-white hover:cursor-pointer"} onClick={() => handleActionRow(item, act)} />}
                {act === 'Delete' && <TrashIcon className={"size-6 text-red-500 hover:cursor-pointer"} onClick={() => handleActionRow(item, act)} />}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}