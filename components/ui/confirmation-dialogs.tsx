"use client";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DenyAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  buttonTitle?: string;
}

export function DenyAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  title ="Deny Account Request",
  description = "Denying this request will notify the student they are not eligible due to unsuccessful ID card verification.",
  buttonTitle = "Deny & Notify Student",
}: DenyAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white-100">
        <DialogHeader className="flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-center text-gray-600 px-6">
          {description}
        </DialogDescription>
        <DialogFooter className="sm:justify-center">
          <Button
            className="w-full bg-red-400 hover:bg-red-500 text-white"
            onClick={onConfirm}
          >
            {buttonTitle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ApproveAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  buttonTitle?: string;
}

export function ApproveAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Approve Book Request",
  description = "Approve the student's account request and grant access. A confirmation email will be sent upon approval.",
  buttonTitle = "Approve & Send Confirmation",
}: ApproveAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white-100">
        <DialogHeader className="flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>

          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-center text-gray-600 px-6">
          {description}
        </DialogDescription>
        <DialogFooter className="sm:justify-center">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={onConfirm}
          >
            {buttonTitle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get avatar background color
export function getAvatarColor(color?: string) {
  switch (color) {
    case "blue":
      return "bg-blue-100 text-blue-600";
    case "green":
      return "bg-green-100 text-green-600";
    case "yellow":
      return "bg-yellow-100 text-yellow-600";
    case "purple":
      return "bg-purple-100 text-purple-600";
    case "indigo":
      return "bg-indigo-100 text-indigo-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
