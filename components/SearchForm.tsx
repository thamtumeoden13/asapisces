import React from 'react'
import Form from "next/form";
import SearchFormReset from "@/components/SearchFormReset";
import { Search } from "lucide-react";

const SearchForm = ({ query, path, search }: { query?: string, path?: string, search?: string }) => {

  const actionPath = path ? `/${path}` : "/";
  const placeholder = search ? `Tìm kiếm ${search}` : "Tìm kiếm";

  return (
    <Form action={actionPath} scroll={false} className={"search-form"}>
      <input
        name={"query"}
        defaultValue={query}
        className={"search-input"}
        placeholder={placeholder}
      />

      <div className={"flex gap-2"}>
        {query && <SearchFormReset path={actionPath} />}

        <button type={"submit"} className={"search-btn text-white"}>
          <Search className={"size-5"} />
        </button>
      </div>
    </Form>
  )
}
export default SearchForm
