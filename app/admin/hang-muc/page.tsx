"use client";

import { useEffect, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { EditIcon, LucideRecycle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Author, Construction } from "@/sanity/types";
import { DenyAccountDialog } from "@/components/ui/confirmation-dialogs";
import { clientNoCache } from "@/sanity/lib/client";
import { ALL_CONSTRUCTIONS_BY_QUERY } from "@/sanity/lib/queries";
import { updateIsDeleted } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import TableComponent, {
  DataProps,
} from "@/components/admin/table/TableComponent";
import { columns } from "@/components/admin/constructions/column";
import Link from "next/link";

type ConstructionProps = Omit<Construction, "author" | "construction"> & {
  author?: Author;
};

export default function UsersTable() {
  const router = useRouter();

  const [requests, setRequests] = useState<ConstructionProps[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const openDeleteDialog = (request: DataProps, isDeleted: boolean) => {
    setSelectedRequestId(request._id);
    setIsDeleted(isDeleted);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRequest = async () => {
    setDeleteDialogOpen(false);
    setSelectedRequestId(null);
    if (selectedRequestId) {
      const { error, status } = await updateIsDeleted(
        selectedRequestId,
        isDeleted
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
        description: "Your item has been deleted successfully",
      });

      getProducts();
    }
  };

  const handleEdit = async (request: DataProps) => {
    console.log("TableComponent -> path", request);
    router.push(`/admin/hang-muc/${request.slug?.current}`);
  };

  const getProducts = async () => {
    const params = { search: null };
    const searchForProducts = await clientNoCache.fetch(
      ALL_CONSTRUCTIONS_BY_QUERY,
      params
    );
    setRequests(searchForProducts);
  };

  useEffect(() => {
    getProducts();
  }, []);

  const _columns: ColumnDef<ConstructionProps>[] = [
    ...columns,
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const request = row.original;

        const disabled = request.author?.role !== "admin" ? true : false;
        const allowEdit =
          ["admin", "editor"].includes(request.author!.role!) || false;
        return (
          <div className="flex items-center justify-center gap-2">
            {request.isDeleted ? (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-500 border border-gray-100 rounded-full"
                disabled={disabled}
                onClick={() => openDeleteDialog(request, false)}
              >
                <LucideRecycle className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-red-500 border border-red-100 rounded-full"
                disabled={disabled}
                onClick={() => openDeleteDialog(request, true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-blue-500 border border-blue-100 rounded-full"
              disabled={!allowEdit}
              onClick={() => handleEdit(request)}
            >
              <EditIcon className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <section className="w-full bg-white rounded-2xl p-4 relative">
        <div className="flex items-center justify-end px-6 absolute right-0 top-4">
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            asChild
          >
            <Link href="/admin/hang-muc/new">
              <span className="flex items-center">
                <span className="mr-1">+</span> Tạo hang mục mới
              </span>
            </Link>
          </Button>
        </div>
        <TableComponent
          data={requests}
          columns={_columns as ColumnDef<DataProps>[]}
          title="Danh sách hạng mục"
          // openApproveDialog={openApproveDialog}
          // openDenyDialog={openDenyDialog}
          // openDeleteDialog={openDeleteDialog}
          onEdit={handleEdit}
        />
      </section>

      {/* Dialogs */}

      <DenyAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteRequest}
        title={!isDeleted ? "Khôi phục hạng mục" : "Xóa hạng mục"}
        description={
          !isDeleted
            ? "Bạn có chắc chắn muốn khôi phục hạng mục này không?"
            : "Bạn có chắc chắn muốn xóa hạng mục này không?"
        }
        buttonTitle={!isDeleted ? "Khôi phục hạng mục" : "Xóa hạng mục"}
      />
    </>
  );
}
