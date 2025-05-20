"use client";

import React, { useEffect, useState } from "react";
import {
  CONSTRUCTIONS_BY_QUERY,
  PROJECTS_BY_CONSTRUCTION_ID_QUERY,
  PROJECTS_BY_QUERY,
} from "@/sanity/lib/queries";
import { clientNoCache } from "@/sanity/lib/client";
import { useRouter } from "next/navigation";
import { Author, Construction, Project } from "@/sanity/types";
import { deleteById } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import { PlusCircleIcon } from "lucide-react";
import { TableComponent } from "./shared/Table";
import { Combobox, ComboboxDataType } from "./shared/ComboBox";

type ProjectTableProps = Omit<Project, "construction"> & {
  construction: Construction[];
};

const ProjectTable = ({ title, author }: { title: string; author: Author }) => {
  const router = useRouter();
  const [selected, setSelected] = useState<ComboboxDataType | null>(null);

  const [constructions, setConstructions] = useState<Project[] | []>([]);
  const [projects, setProjects] = useState<ProjectTableProps[] | []>([]);
  const [actions, setActions] = useState<string[]>([]);

  const getConstructions = async () => {
    const params = { search: null };
    const searchForConstructions = await clientNoCache.fetch(
      CONSTRUCTIONS_BY_QUERY,
      params
    );
    setConstructions(searchForConstructions);
  };

  const getProjects = async () => {
    const params = selected ? { id: selected._id } : { search: null };
    const query = selected
      ? PROJECTS_BY_CONSTRUCTION_ID_QUERY
      : PROJECTS_BY_QUERY;
    const searchForProjects = await clientNoCache.fetch(query, params);

    const _searchForProjects = searchForProjects.map(
      (project: ProjectTableProps) => {
        return {
          ...project,
          parent: project.construction
            ?.map(({ title }) => {
              return title;
            })
            .join(","),
        };
      }
    );

    setProjects(_searchForProjects);
  };

  const handleDelete = async (post: Project) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const { error, status } = await deleteById(post._id);
      if (status === "ERROR") {
        console.error("ProjectTable -> handleDelete", error);
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Your item has been deleted successfully",
      });

      getProjects();
    }
  };

  const handleEdit = async (post: Project) => {
    console.log("TableComponent -> path", post);
    router.push(`/auth/du-an/${post.slug?.current}`);
  };

  const handleAddProject = async () => {
    router.push(`/auth/du-an/create`);
  };

  useEffect(() => {
    getConstructions();
    getProjects();
  }, []);

  useEffect(() => {
    getProjects();
  }, [selected]);

  useEffect(() => {
    let actions: string[] = [];
    if (author.role == "admin") {
      actions = ["Edit", "Delete"];
    } else if (author.role == "editor") {
      actions = ["Edit"];
    }
    setActions(actions);
  }, [author]);

  if (!projects) return <div>Loading...</div>;

  return (
    <section
      className={
        "section_container !justify-items-center !mt-0 overflow-auto h-full"
      }
    >
      <div className="absolute top-0 left-0 flex items-center justify-between w-full h-24 gap-10 px-16 py-4 ">
        <Combobox
          data={constructions}
          className={
            "startup-form_input !mt-0 !max-w-[32rem] !h-[2.5rem] !border-white-100 !text-white-100 !text-[18px]"
          }
          onChange={(value: ComboboxDataType | null) => {
            setSelected(value);
          }}
        />
        <div className="flex items-center justify-end gap-10 py-4">
          <p>{title}</p>
          {(author.role == "admin" || author.role == "editor") && (
            <PlusCircleIcon
              className={"size-12 text-white hover:cursor-pointer"}
              onClick={handleAddProject}
            />
          )}
        </div>
      </div>
      <div className="flex justify-end w-full h-full mt-10">
        <TableComponent
          data={projects}
          headers={[
            "Tiêu đề",
            "Đường dẫn",
            "Ảnh tiêu đề",
            "Thứ tự",
            "Hạng mục",
          ]}
          title={title}
          path="du-an"
          actions={actions}
          author={author}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>
    </section>
  );
};
export default ProjectTable;
