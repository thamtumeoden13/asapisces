"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Construction } from "@/sanity/types"

export type ComboboxDataType = Pick<Construction, "title" | "_id" | "slug">

export function Combobox({
  initValue,
  data,
  className,
  onChange
}: Readonly<{
  initValue?: string;
  data: ComboboxDataType[];
  className?: string;
  onChange?: (value: ComboboxDataType | null) => void;
}>) {

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(initValue ?? "")

  React.useEffect(() => {
    if (onChange) {
      if (!value) {
        onChange(null)
        return;
      }
      const selected = data.find((item) => item._id === value)
      onChange(selected!)
    }
  }, [value])

  React.useEffect(() => {
    if (initValue) {
      setValue(initValue)
    }
  }, [initValue])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className)}
        >
          {value
            ? data.find((item) => item._id === value)?.title
            : "Vui lòng chọn..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex bg-white-100 w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandList className="bg-white-100">
            <CommandEmpty>No data found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item._id}
                  value={item._id}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="hover:bg-white-300 cursor-pointer font-semibold text-[12px] text-black uppercase"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
