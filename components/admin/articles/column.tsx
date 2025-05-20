"use client";

import { Author, Project, ProjectDetail } from "@/sanity/types";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type ArticleProps = Omit<ProjectDetail, "author" | "project"> & {
  author?: Author;
} & { project?: Project } & { published?: "pending" | "approved" | "rejected" };

export const columns: ColumnDef<ArticleProps>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <div className="flex items-center justify-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="p-0 hover:bg-transparent"
            >
              <span>Tiêu đề</span>
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
      );
    },
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div className="flex items-center gap-3 max-w-80">
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1">{request.title}</span>
            <span className="text-sm text-muted-foreground line-clamp-1">
              {request.subtitle}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "thumnail",
    header: "Ảnh đại diện",
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div className="flex items-center justify-center gap-3">
          <Image
            src={request.thumbnail || "/gsap.svg"}
            alt={request.title!}
            width={100}
            height={100}
            className="object-cover rounded-sm"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div className="flex flex-col max-w-80">
          <span className="line-clamp-2">{request.description}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "views",
    header: ({ column }) => {
      return (
        <div className="flex items-center justify-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="p-0 hover:bg-transparent"
            >
              <span>Lượt xem</span>
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
      );
    },
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div className="flex items-center justify-center gap-3">
          <span className="font-medium">{request.views}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "viewDetail",
    header: "Đường dẫn",
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div className="flex items-center justify-center gap-3">
          <Button variant="link" className="px-2 h-auto p-0 text-blue-500">
            <Link target="_blank" href={`/bai-viet/${request?.slug?.current}`}>
              Xem chi tiết
            </Link>
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>
      );
    },
  },
];
