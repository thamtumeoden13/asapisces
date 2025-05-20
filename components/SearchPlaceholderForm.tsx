import { useCallback, useEffect, useRef, useState } from "react";
import Form from "next/form";
import { AnimatePresence, motion } from "framer-motion";
import SearchFormReset from "@/components/SearchFormReset";
import { Search } from "lucide-react";
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input';

const SearchPlaceholderForm = ({ query, path }: { query?: string, path?: string }) => {

  const reset = () => {
    const form = document.querySelector('.search-form') as HTMLFormElement;
    if (form) form.reset();
  }

  const actionPath = path ? `/${path}` : "/";
  const placeholders = [
    "What's the first rule of Fight Club?",
    "Who is Tyler Durden?",
    "Where is Andrew Laeddis Hiding?",
    "Write a Javascript method to reverse a string",
    "How to assemble your own PC?",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };

  return (
    <Form action={actionPath} scroll={false} className={"search-form"}>
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        // onChange={handleChange}
        // onSubmit={onSubmit}
      />
      {/* <input
        name={"query"}
        defaultValue={query}
        className={"search-input"}
        placeholder={"Search Startups"}
      />

      <div className={"flex gap-2"}>
        {query && <SearchFormReset path={actionPath} />}

        <button type={"submit"} className={"search-btn text-white"}>
          <Search className={"size-5"} />
        </button>
      </div> */}
    </Form>
  )
}
export default SearchPlaceholderForm
