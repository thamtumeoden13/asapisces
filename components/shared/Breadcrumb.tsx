"use client"

import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"


const BreadcrumbComponent = () => {

  const pathname = usePathname();
  console.log(pathname)

  const splitPathname = pathname.split('/');

  return (
    <div className="mb-8">
      <Breadcrumb>
        <BreadcrumbList>
          {splitPathname.map((name, index) => {
            if (index == 0) {
              return (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )
            }
            if (index == splitPathname.length - 1) {
              return (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbPage>{name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )
            }
            return (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${name}`}>{name}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

    </div>
  )
}

export default BreadcrumbComponent