import React from "react";
import { SearchInput } from "../ui/search-input";
import { User } from "@auth/core/types";

const Header = ({
  user,
  subtitle = "",
  onSearch,
}: {
  user: User;
  subtitle?: string;
  onSearch?: (value: string) => void;
}) => {
  return (
    <header className="admin-header">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Xin Chào, {user?.name}
        </h1>
        {subtitle && <p className="text-gray-500">{subtitle}</p>}
      </div>

      <div className="w-full max-w-md md:w-auto hidden">
        <SearchInput
          onSearch={onSearch}
          containerClassName="w-full md:w-[400px]"
        />
      </div>
    </header>
  );
};

export default Header;
