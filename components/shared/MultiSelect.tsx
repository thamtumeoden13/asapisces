import * as React from "react";
import { cn } from "@/lib/utils";

import { Check, X, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Construction } from "@/sanity/types";

export type MultiSelectOption = Pick<Construction, "title" | "_id" | "slug">

export type MultiSelectProps = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  className?: string;
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  className,
  ...props
}: Readonly<MultiSelectProps>) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };
  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]); // Unselect all if all options are selected
    } else {
      onChange(options.map((option) => option._id)); // Select all if not all options are selected
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className)}
          // className={`w-[360px] justify-between h-auto `}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0
              ? selected.map((item) => (
                <Badge
                  variant="outline"
                  key={item}
                  className="p-2 mb-1 mr-1 text-white bg-primary hover:bg-primary/90 "
                  onClick={() => handleUnselect(item)}
                >
                  {options.find((option) => item === option._id)?.title}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleUnselect(item)}
                  >
                    <X className="w-3 h-3 text-white hover:text-foreground " />
                  </button>
                </Badge>
              ))
              : placeholder}
          </div>
          <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex bg-white-100 w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Tìm kiếm ..." />
          <CommandEmpty>Không tìm thấy dữ liệu.</CommandEmpty>
          <CommandGroup className="overflow-auto max-h-64">
            <CommandItem
              onSelect={handleSelectAll}
              className="hover:bg-white-300 cursor-pointer font-semibold text-[12px] text-black uppercase"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4 ",
                  selected.length === options.length
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
              Tất cả
            </CommandItem>
            {options.map((option) => (
              <CommandItem
                key={option._id}
                onSelect={() => {
                  onChange(
                    selected.includes(option._id)
                      ? selected.filter((item) => item !== option._id)
                      : [...selected, option._id]
                  );
                  setOpen(true);
                }}
                className="hover:bg-white-300 cursor-pointer font-semibold text-[12px] text-black uppercase"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected.includes(option._id) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };