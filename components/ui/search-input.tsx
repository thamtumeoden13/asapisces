"use client"

import type React from "react"
import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
  className?: string
  placeholder?: string
  iconClassName?: string
  containerClassName?: string
}

export function SearchInput({
  onSearch,
  className,
  placeholder = "Search users, books by title, author, or genre.",
  iconClassName,
  containerClassName,
  ...props
}: SearchInputProps) {
  const [value, setValue] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    if (onSearch) {
      onSearch(newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value)
    }
  }

  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search
        className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4", iconClassName)}
      />
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "pl-10 pr-4 py-2 w-full bg-white border border-gray-200 rounded-lg",
          "focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:outline-none",
          className,
        )}
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
}

