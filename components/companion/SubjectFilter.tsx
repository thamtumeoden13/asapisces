"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subjects } from "@/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";

const SubjectFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Đọc giá trị trực tiếp từ URL. Đây là "nguồn chân lý duy nhất".
  // Nếu không có param 'subject', giá trị sẽ là 'all' để khớp với lựa chọn mặc định.
  const currentSubject = searchParams.get("subject") || "all";

  // 2. Tạo một hàm xử lý chuyên dụng để cập nhật URL.
  const handleSubjectChange = (newSubject: string) => {
    let newUrl = "";

    // Nếu người dùng chọn "All subjects", hãy xóa param 'subject' khỏi URL.
    if (newSubject === "all") {
      newUrl = removeKeysFromUrlQuery({
        params: searchParams.toString(),
        keysToRemove: ["subject"],
      });
    } else {
      // Ngược lại, cập nhật hoặc thêm mới param 'subject'.
      newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: "subject",
        value: newSubject,
      });
    }

    // Đẩy URL mới vào router.
    router.push(newUrl, { scroll: false });
  };

  return (
    // 3. `onValueChange` gọi trực tiếp hàm xử lý và `value` luôn đọc từ `currentSubject` (lấy từ URL).
    <Select onValueChange={handleSubjectChange} value={currentSubject}>
      <SelectTrigger className="!border-black !bg-white focus-visible:!ring-0 focus-visible:!border-black !w-full capitalize text-black-100 !p-5">
        <SelectValue placeholder="Subject" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All subjects</SelectItem>
        {subjects.map((subject) => (
          <SelectItem key={subject} value={subject} className="capitalize">
            {/* Thay thế gạch dưới bằng khoảng trắng để hiển thị đẹp hơn */}
            {subject.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SubjectFilter;
