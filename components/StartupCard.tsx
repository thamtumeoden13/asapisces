import React from 'react'
import { formatDate } from "@/lib/utils";
import { EyeIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Author, Startup } from "@/sanity/types";

export type StartupCardType = Omit<Startup, "author"> & { author?: Author };

const StartupCard = ({ post, path }: { post: StartupCardType, path: string }) => {
  const {
    _createdAt,
    views,
    author,
    title,
    category,
    image,
    description,
    slug
  } = post;

  return (
    <li className={"startup-card group"}>
      <div className={"flex-between"}>
        <p className={"startup-card_date"}> {formatDate(_createdAt)} </p>

        <div className={"flex gap-1.5"}>
          <EyeIcon className={"size-6 text-primary"} />
          <span className={"text-16-medium"}>{views}</span>
        </div>
      </div>

      <div className={"flex-between mt-5 gap-5"}>
        <div className={"flex-1 h-20"}>
          <Link href={`/user/${author?._id}`}>
            <p className={"text-16-medium line-clamp-1"}>
              {author?.name}
            </p>
          </Link>
          <Link href={`/${path}/${slug?.current}`}>
            <h3 className={"text-26-semibold line-clamp-2"}>{title}</h3>
          </Link>
        </div>
        <Link href={`/user/${author?._id}`}>
          <Image
            src={author?.image || "https://placehold.co/48x48"}
            alt={"placeholder"}
            width={48} height={48} className={"rounded-full"}
          />
        </Link>
      </div>
      <Link href={`/${path}/${slug?.current}`}>
        <p className={"startup-card_desc"}>
          {description}
        </p>
        <Image
          src={image!}
          alt="placeholder"
          height={200}
          width={200}
          className={"startup-card_img"}
        />
      </Link>

      <div className={"flex-between gap-3 mt-5"}>
        <Link href={`/?query=${category?.toLowerCase()}`}>
          <p className={"text-16-medium"}>{category}</p>
        </Link>
        <Button className={"startup-card_btn"} asChild>
          <Link href={`/${path}/${slug?.current}`}>
            Details
          </Link>
        </Button>
      </div>
    </li>
  )
}
export default StartupCard
