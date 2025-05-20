"use client";

import { useEffect, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Author } from "@/sanity/types";
import {
  ApproveAccountDialog,
  DenyAccountDialog,
} from "@/components/ui/confirmation-dialogs";
import { clientNoCache } from "@/sanity/lib/client";
import { AUTHORS_BY_QUERY } from "@/sanity/lib/queries";
import { deleteById, updateRoleByAdmin } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TableComponent, {
  DataProps,
} from "@/components/admin/table/TableComponent";
import { AuthorProps, columns } from "@/components/admin/users/column";

export default function UsersTable() {
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [selectedRequest, setSelectedRequest] = useState<Author | null>(null);

  const [role, setRole] = useState<string | null>(null);
  const [users, setUsers] = useState<Author[] | []>([]);

  const openApproveDialog = (
    request: Author,
    newRole: "admin" | "editor" | "viewer"
  ) => {
    setSelectedRequestId(request._id);
    setSelectedRequest(request);
    setRole(newRole);
    setApproveDialogOpen(true);
  };

  const handleApproveAccount = async () => {
    setApproveDialogOpen(false);
    setSelectedRequestId(null);
    if (selectedRequest) {
      const post = {
        ...selectedRequest,
        role: role,
      };
      const { error, status } = await updateRoleByAdmin(post as Author);

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
        description: "Your role has been approved successfully",
        // variant: "destructive",
      });

      getUsers();
    }
  };

  const openDeleteDialog = (request: DataProps) => {
    setSelectedRequestId(request._id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRequest = async () => {
    setDeleteDialogOpen(false);
    setSelectedRequestId(null);
    if (selectedRequestId) {
      const { error, status } = await deleteById(selectedRequestId);
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
      getUsers();
    }
  };

  const getUsers = async () => {
    const params = { search: null };
    const searchUsers = await clientNoCache.fetch(AUTHORS_BY_QUERY, params);

    console.log("PermissionTable -> getUsers", searchUsers);
    setUsers(searchUsers);
  };

  useEffect(() => {
    getUsers();
  }, []);

  const _columns: ColumnDef<AuthorProps>[] = [
    ...columns,
    {
      accessorKey: "published",
      header: "Quyền truy cập",
      cell: ({ row }) => {
        const request = row.original;
        const roleColor =
          request.role === "admin"
            ? "text-green-500"
            : request.role === "editor"
              ? "text-pink-500"
              : "text-gray-500";

        const disabled = request?.role !== "admin" ? true : false;
        return (
          <div className="flex items-center justify-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={disabled}>
                <Button
                  variant="outline"
                  className={`px-4 py-1 h-auto font-medium ${roleColor}`}
                >
                  {request.role}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                  value={request.role}
                  onValueChange={(value: string) =>
                    openApproveDialog(
                      request,
                      value as "admin" | "editor" | "viewer"
                    )
                  }
                >
                  <DropdownMenuRadioItem
                    value="admin"
                    className="text-green-500"
                  >
                    Admin
                    {request.role === "admin" && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="editor"
                    className="text-red-500"
                  >
                    Editor
                    {request.role === "editor" && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="viewer"
                    className="text-gray-500"
                  >
                    Viewer
                    {request.role === "viewer" && (
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
        const disabled = request?.role !== "admin" ? true : false;

        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-red-500 border border-red-100 rounded-full"
              disabled={disabled}
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
      <section className="w-full bg-white rounded-2xl p-7">
        <TableComponent
          data={users}
          columns={_columns as ColumnDef<DataProps>[]}
          title="Danh sách hạng mục"
          addButton="Tạo hạng mục mới"
          // openApproveDialog={openApproveDialog}
          // openDenyDialog={openDenyDialog}
          // openDeleteDialog={openDeleteDialog}
        />
      </section>

      {/* Dialogs */}

      <ApproveAccountDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onConfirm={handleApproveAccount}
        title="Cấp quyền truy cập"
        description="Cấp quyền truy cập cho người dùng này. Một email xác nhận sẽ được gửi đi sau khi cấp quyền."
        buttonTitle="Cấp quyền truy cập"
      />

      <DenyAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteRequest}
        title="Xóa người dùng"
        description="Bạn có chắc chắn muốn xóa người dùng này không? Hành động này sẽ không thể hoàn tác."
        buttonTitle="Xóa người dùng"
      />
    </>
  );
}
