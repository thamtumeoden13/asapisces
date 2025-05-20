"use client";

import { useEffect, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PlusCircleIcon, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DenyAccountDialog } from "@/components/ui/confirmation-dialogs";
import { clientNoCache } from "@/sanity/lib/client";
import {
  CONSTRUCTION_BY_SLUG_QUERY,
  PROJECTS_BY_CONSTRUCTION_ID_QUERY,
  ROUTE_BY_SLUG_QUERY,
} from "@/sanity/lib/queries";
import { updateRoute } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import { Combobox, ComboboxDataType } from "@/components/shared/ComboBox";
import TableComponent, { DataProps } from "@/components/admin/table/TableComponent";
import { ProjectProps, columns } from "@/components/admin/projects/column";

export default function UsersTable() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  const [projects, setProjects] = useState<ComboboxDataType[] | null>(null);
  const [data, setData] = useState<DataProps[] | []>([]);
  const [routeId, setRouteId] = useState<string>("");
  const [selected, setSelected] = useState<ComboboxDataType | null>(null);

  const openDeleteDialog = (request: DataProps) => {
    setSelectedRequestId(request._id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRequest = async () => {
    setDeleteDialogOpen(false);
    setSelectedRequestId(null);
    if (selectedRequestId) {
      const { error, status } = await updateRoute(
        "",
        routeId,
        selectedRequestId,
        true
      );

      if (status === "ERROR") {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Your Home Hero has been deleted successfully",
        // variant: "destructive",
      });

      getProjects();
      getRouteSelect();
    }
  };

  const handleAddRouteSelect = async () => {
    if (!selected) return;

    const { error, status } = await updateRoute("", routeId, selected._id);
    if (status === "ERROR") {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Success",
      description: "Your Home Hero has been updated successfully",
      // variant: "destructive",
    });
    getProjects();
    getRouteSelect();
  };

  const getProjects = async () => {
    const post = await clientNoCache.fetch(CONSTRUCTION_BY_SLUG_QUERY, {
      slug: "thiet-ke",
    });

    console.log("getRouteSelect -> post", post);

    if (!post) return;

    const projects = await clientNoCache.fetch(
      PROJECTS_BY_CONSTRUCTION_ID_QUERY,
      { id: post._id }
    );

    console.log("getRouteSelect -> projects", projects);
    setProjects(projects);
    return;
  };

  const getRouteSelect = async () => {
    const data = await clientNoCache.fetch(ROUTE_BY_SLUG_QUERY, {
      slug: "danh-muc-thiet-ke",
    });

    if (!data) return;
    setData(data.select);
    setRouteId(data._id);
  };

  useEffect(() => {
    getProjects();
    getRouteSelect();
  }, []);

  const _columns: ColumnDef<ProjectProps>[] = [
    ...columns,
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const request = row.original;

        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-red-500 border border-red-100 rounded-full"
              onClick={() => openDeleteDialog(request)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <section className="w-full bg-white rounded-2xl p-4 relative">
        <div className="flex items-center justify-end mb-6 gap-3 absolute top-4 right-4">
          <Combobox
            data={(projects as ComboboxDataType[]) || []}
            className={
              "startup-form_input !mt-0 !w-[24rem] !h-[2.5rem] !border-black-100 !text-black-100 !text-[18px]"
            }
            onChange={(value: ComboboxDataType | null) => {
              setSelected(value);
            }}
          />
          <PlusCircleIcon
            className={"size-8 text-black-100 hover:cursor-pointer"}
            onClick={handleAddRouteSelect}
          />
        </div>
        <TableComponent
          data={data}
          columns={_columns as ColumnDef<DataProps>[]}
          title="Danh sách danh mục thiết kế"
          // addButton="Tạo bài viết mới"
          // openApproveDialog={openApproveDialog}
          // openDenyDialog={openDenyDialog}
          openDeleteDialog={openDeleteDialog}
        />
      </section>

      {/* Dialogs */}

      <DenyAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteRequest}
        title="Delete Request"
        description="Are you sure you want to delete this request? This action cannot be undone."
        buttonTitle="Delete Request"
      />
    </>
  );
}
