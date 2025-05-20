"use client";

import { useEffect, useState } from "react";
import { Author, Project, ProjectDetail } from "@/sanity/types";
import {
  ApproveAccountDialog,
  DenyAccountDialog,
} from "@/components/ui/confirmation-dialogs";
import { clientNoCache } from "@/sanity/lib/client";
import { ALL_ARTICLES_BY_QUERY } from "@/sanity/lib/queries";
import { publishedProjectDetail, updateIsDeleted } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import TableComponent, {
  DataProps,
} from "@/components/admin/table/TableComponent";
import { columns } from "@/components/admin/articles/column";

import { type ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  Check,
  EditIcon,
  Trash2,
  LucideRecycle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Article = Omit<ProjectDetail, "author" | "project"> & {
  author?: Author;
} & { project?: Project } & { published?: "pending" | "approved" | "rejected" };

const ArticlesTable = () => {
  const router = useRouter();

  const [requests, setRequests] = useState<Article[]>([]);

  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  const openDeleteDialog = (request: DataProps, isDeleted: boolean) => {
    setIsDeleted(isDeleted);
    setSelectedRequestId(request._id);
    setDeleteDialogOpen(true);
  };

  const openApproveDialog = (request: DataProps) => {
    setSelectedRequestId(request._id);
    setApproveDialogOpen(true);
  };

  const openDenyDialog = (request: DataProps) => {
    setSelectedRequestId(request._id);
    setDenyDialogOpen(true);
  };

  const handleApproveAccount = async () => {
    setApproveDialogOpen(false);
    setSelectedRequestId(null);
    if (selectedRequestId) {
      const { error, status } = await publishedProjectDetail(
        selectedRequestId,
        "approved"
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
        description: "Your article has been approved successfully",
        // variant: "destructive",
      });

      getArticles();
    }
  };

  const handleRejectAccount = async () => {
    setDenyDialogOpen(false);
    setSelectedRequestId(null);
    if (selectedRequestId) {
      const { error, status } = await publishedProjectDetail(
        selectedRequestId,
        "rejected"
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
        description: "Your article has been rejected successfully",
        // variant: "destructive",
      });

      getArticles();
    }
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

      getArticles();
    }
  };

  const handleEdit = async (request: DataProps) => {
    console.log("TableComponent -> path", request);
    router.push(`/admin/bai-viet/${request.slug?.current}`);
  };

  const getArticles = async () => {
    const params = { search: null };
    const searchForProjects = await clientNoCache.fetch(
      ALL_ARTICLES_BY_QUERY,
      params
    );
    setRequests(searchForProjects);
    console.log("getArticles -> searchForProjects", searchForProjects.length);
  };

  useEffect(() => {
    getArticles();
  }, []);

  const handlePublishedChange = (
    request: Article,
    newStatus: "approved" | "pending" | "rejected"
  ) => {
    if (newStatus === "approved") {
      openApproveDialog(request);
    } else if (newStatus === "rejected") {
      openDenyDialog(request);
    }
  };

  const _columns: ColumnDef<Article>[] = [
    ...columns,
    {
      accessorKey: "published",
      header: ({ column }) => {
        return (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-0 hover:bg-transparent"
            >
              <span>Xuất bản</span>
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const request = row.original;
        const color =
          request.published === "approved"
            ? "text-green-500"
            : request.published === "rejected"
              ? "text-pink-500"
              : "text-gray-500";

        console.log("request", request);

        const disabled = request.author?.role !== "admin" ? true : false;

        return (
          <div className="w-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={disabled}>
                <Button
                  variant="outline"
                  className={`px-4 py-1 h-auto font-medium ${color}`}
                >
                  {request.published}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                  value={request.published}
                  onValueChange={(value: string) =>
                    handlePublishedChange(
                      request,
                      value as "approved" | "pending" | "rejected"
                    )
                  }
                >
                  <DropdownMenuRadioItem
                    value="pending"
                    className="text-gray-500"
                  >
                    Pending
                    {request.published === "pending" && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="approved"
                    className="text-green-500"
                  >
                    Approved
                    {request.published === "approved" && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="rejected"
                    className="text-red-500"
                  >
                    Rejected
                    {request.published === "rejected" && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const request = row.original;

        const disabled = request.author?.role !== "admin" ? true : false;
        const allowEdit = ["admin", "editor"].includes(request.author!.role!) || false;
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
            <Link href="/admin/bai-viet/new">
              <span className="flex items-center">
                <span className="mr-1">+</span> Tạo bài viết mới
              </span>
            </Link>
          </Button>
        </div>
        <TableComponent
          data={requests}
          columns={_columns as ColumnDef<DataProps>[]}
          title="Danh sách bài viết"
          // addButton="Tạo bài viết mới"
          // addButtonLink="/admin/bai-viet/new"
          // openApproveDialog={openApproveDialog}
          // openDenyDialog={openDenyDialog}
          onEdit={handleEdit}
        />
      </section>

      {/* Dialogs */}
      <DenyAccountDialog
        open={denyDialogOpen}
        onOpenChange={setDenyDialogOpen}
        onConfirm={handleRejectAccount}
        title="Từ chối bài viết"
        description="Bạn có chắc chắn muốn từ chối bài viết này không?"
        buttonTitle="Từ chối bài viết"
      />

      <ApproveAccountDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onConfirm={handleApproveAccount}
        title="Phê duyệt bài viết"
        description="Bạn có chắc chắn muốn phê duyệt bài viết này không?"
        buttonTitle="Phê duyệt bài viết"
      />

      <DenyAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteRequest}
        title={!isDeleted ? "Khôi phục bài viết" : "Xóa bài viết"}
        description={
          !isDeleted
            ? "Banh có chắc chắn muốn khôi phục bài viết này không?"
            : "Bạn có chắc chắn muốn xóa bài viết này không?"
        }
        buttonTitle={!isDeleted ? "Khôi phục bài viết" : "Xóa bài viết"}
      />
    </>
  );
};

export default ArticlesTable;
