"use client";

import { Button } from "@/components/ui/button";
import { Author } from "@/sanity/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import Image from "next/image";

export type AuthorProps = Author & { slug?: { current?: string } };

export const columns: ColumnDef<AuthorProps>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <div className="flex items-center space-x-2">
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
        <div className="flex items-center gap-3 ">
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1">{request.name}</span>
            <span className="text-sm text-muted-foreground line-clamp-1">
              {request.email}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Loại tài khoản",
    cell: ({ row }) => {
      const request = row.original;
      return (
        <div className="flex items-center justify-center">
          <span className="line-clamp-2">{request.type}</span>
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
        <div className="flex items-center justify-center gap-2">
          <Image
            src={request.image || "/gsap.svg"}
            alt={request.name!}
            width={100}
            height={100}
            className="object-cover rounded-sm"
          />
        </div>
      );
    },
  },
];
