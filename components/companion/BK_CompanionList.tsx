import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, getSubjectColor } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Companion } from "@/types";
interface CompanionListProps {
  title?: string;
  companions?: Companion[];
  className?: string;
}

const CompanionList = ({
  title,
  companions,
  className,
}: CompanionListProps) => {
  return (
    <article className={cn("companion-list", className)}>
      <h2 className="text-3xl font-bold text-black">{title}</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/3 text-lg">Lessons</TableHead>
            <TableHead className="text-lg">Subject</TableHead>
            <TableHead className="text-lg">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companions?.map(({ id, subject, name, topic, duration }) => (
            <TableRow key={id}>
              <TableCell className="">
                <Link href={`/companion-library/companion/${id}`}>
                  <div className="flex items-center gap-2">
                    <div
                      className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden"
                      style={{ backgroundColor: getSubjectColor(subject) }}
                    >
                      <Image
                        src={`/icons/${subject}.svg`}
                        alt={subject}
                        width={35}
                        height={35}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-2xl font-bold text-black">{name}</p>
                      <p className="text-lg text-black">{topic}</p>
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="subject-badge w-fit max-md:hidden">
                  {subject}
                </div>
                <div
                  className="flex items-center justify-center p-2 rounded-lg w-fit md:hidden"
                  style={{ backgroundColor: getSubjectColor(subject) }}
                >
                  <Image
                    src={`/icons/${subject}.svg`}
                    alt={subject}
                    width={18}
                    height={18}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end w-full gap-2">
                  <p className="text-xl text-black-100">
                    {duration} <span className="max-md:hidden">mins</span>
                  </p>
                  <Image
                    src="/icons/clock.svg"
                    alt="duration"
                    width={14}
                    height={14}
                    className="md:hidden"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {/* <TableFooter>
          <TableRow>
            <TableCell className="text-lg text-black-100" colSpan={3}>Total</TableCell>
            <TableCell className="text-right text-black-200">2,500</TableCell>
          </TableRow>
        </TableFooter> */}
      </Table>
    </article>
  );
};

export default CompanionList;
