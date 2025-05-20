"use client";

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import React, { useMemo, useState } from "react";

type CloudinaryImageType = {
  src: string;
  alt: string;
  width: number;
  height: number;
  quality?: number;
};

const cloudinaryLoader = ({
  src,
  width,
  quality,
  f_auto = true,
  q_auto = true,
}: {
  src: string;
  width: number;
  quality?: number;
  f_auto?: boolean;
  q_auto?: boolean;
}) => {
  return optimizeCloudinaryImage(src, {
    // f_auto: f_auto,
    q_auto: q_auto,
    w: width,
    q: quality || 75,
  });
};

const optimizeCloudinaryImage = (
  url: string,
  options: { [key: string]: string | number | boolean }
) => {
  // Kiểm tra URL Cloudinary
  if (!url || !url.includes("res.cloudinary.com")) {
    return url; // Trả về URL gốc nếu không hợp lệ
  }

  // Tạo các tham số biến đổi
  const transformations = Object.entries(options)
    .filter(([, value]) => value) // Bỏ qua giá trị "false" hoặc "undefined"
    .map(([key, value]) =>
      typeof value === "boolean" ? key : `${key}_${value}`
    )
    .join(",");

  // Tách URL thành phần cơ bản và đường dẫn ảnh
  const [base, imagePath] = url.split("/upload/");

  // Kết hợp lại URL với các tham số tối ưu hóa
  return `${base}/upload/${transformations}/${imagePath}`;
};

const getBlurDataURL = (src: string): string => {
  if (!src || !src.includes("res.cloudinary.com")) {
    return src; // Nếu không phải URL Cloudinary, trả về URL gốc
  }

  // Tạo URL với kích thước nhỏ, chất lượng thấp để làm ảnh mờ
  return optimizeCloudinaryImage(src, {
    w: 10, // Chiều rộng 10px
    q: 10, // Chất lượng thấp
    f_auto: true, // Định dạng tự động
  });
};

type Custome_ImageProps = ImageProps & {
  q_auto?: boolean;
  f_auto?: boolean;
};

export const CloudinaryImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}: Custome_ImageProps) => {
  return (
    <Image
      loader={cloudinaryLoader}
      src={src}
      className={cn("transition duration-300 blur-0", className)}
      width={width}
      height={height}
      alt={alt || "Art Sunday"}
      {...rest}
    />
  );
};

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}: ImageProps) => {
  const [isLoading, setLoading] = useState(true);

  return (
    <Image
      className={cn(
        className
        // isLoading ? "blur-sm transition duration-300" : "blur-0"
      )}
      loader={cloudinaryLoader}
      onLoad={() => setLoading(false)}
      src={src}
      width={width}
      height={height}
      blurDataURL={typeof src === "string" ? getBlurDataURL(src) : undefined} // Sử dụng hàm tạo blurDataURL
      alt={alt || "Art Sunday"}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      placeholder="blur" // Bật chế độ làm mờ
      priority={true}
      {...rest}
    />
  );
};
