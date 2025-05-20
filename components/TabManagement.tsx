
import { Tabs } from "./ui/tabs";
import ProjectDetailTable from "./ProjectDetailTable";
import CategoryTable from "./CategoryTable";
import { Author } from "@/sanity/types";
import ConstructionTable from "./ConstructionTable";
import ProjectTable from "./ProjectTable";
import PermissionTable from "./PermissionTable";
import RouteTable from "./RouteTable";

export const TabManagement = async ({ user }: { user: Author }) => {

  const role = user?.role ?? 'viewer';

  console.log('TabManagement -> user', user)

  const tabs = [
    {
      title: "Hạng Mục",
      value: "hang-muc",
      content: (
        <div className="relative w-full h-full p-10 text-xl font-bold text-white rounded-2xl md:text-4xl bg-gradient-to-br from-blue-700 to-green-900">
          <ConstructionTable title='Hạng Mục'  author={user} />
        </div>
      ),
    },
    {
      title: "Dự Án",
      value: "du-an",
      content: (
        <div className="relative w-full h-full p-10 text-xl font-bold text-white rounded-2xl md:text-4xl bg-gradient-to-br from-blue-700 to-green-900">
          <ProjectTable title="Dự Án" author={user} />
        </div>
      ),
    },
    {
      title: "Bài Viết",
      value: "chi-tiet-bai-viet",
      content: (
        <div className="relative w-full h-full p-10 text-xl font-bold text-white rounded-2xl md:text-4xl bg-gradient-to-br from-blue-700 to-green-900">
          <ProjectDetailTable title="Bài Viết" author={user} />
        </div>
      ),
    },
    {
      title: "Danh Mục Trang Chủ",
      value: "danh-muc-trang-chu",
      content: (
        <div className="relative w-full h-full p-10 text-xl font-bold text-white rounded-2xl md:text-4xl bg-gradient-to-br from-blue-700 to-green-900">
          <CategoryTable
            slug="danh-muc-trang-chu"
            title="Danh Mục Trang Chủ"
            author={user}
          />
        </div>
      ),
    },
    {
      title: "Danh Mục Thiết Kế",
      value: "danh-muc-thiet-ke",
      content: (
        <div className="relative w-full h-full p-10 text-xl font-bold text-white rounded-2xl md:text-4xl bg-gradient-to-br from-blue-700 to-green-900">
          <RouteTable
            slug="thiet-ke"
            route_slug="danh-muc-thiet-ke"
            title="Danh Mục Thiết Kế"
            author={user}
          />
        </div>
      ),
    },
    {
      title: "Danh Mục Thi Công",
      value: "danh-muc-thi-cong",
      content: (
        <div className="relative w-full h-full p-10 text-xl font-bold text-white rounded-2xl md:text-4xl bg-gradient-to-br from-blue-700 to-green-900">
          <RouteTable
            slug="thi-cong"
            route_slug="danh-muc-thi-cong"
            title="Danh Mục Thi Công"
            author={user}
          />
        </div>
      ),
    },
    {
      title: "Danh Mục Cuối Trang",
      value: "danh-muc-cuoi-trang",
      content: (
        <div className="relative w-full h-full p-10 text-xl font-bold text-white rounded-2xl md:text-4xl bg-gradient-to-br from-blue-700 to-green-900">
          <RouteTable
            route_slug="danh-muc-cuoi-trang"
            title="Danh Mục Cuối Trang"
            author={user}
          />
        </div>
      ),
    },
    {
      title: "Danh Mục Thông Tin",
      value: "danh-muc-thong-tin",
      content: (
        <div className="relative w-full h-full p-10 text-xl font-bold text-white rounded-2xl md:text-4xl bg-gradient-to-br from-blue-700 to-green-900">
          <RouteTable
            route_slug="danh-muc-thong-tin"
            title="Danh Mục Thông Tin"
            author={user}
          />
        </div>
      ),
    },
    {
      title: "Quyền Truy Cập",
      value: "permission",
      content: (
        <div className="relative w-full h-full p-10 text-xl font-bold text-white rounded-2xl md:text-4xl bg-gradient-to-br from-blue-700 to-green-900">
          {role === 'admin' ?
            <PermissionTable title="Quyền Truy Cập"  author={user}/>
            : 'Bạn không có quyền truy cập'
          }
        </div>
      ),
    },
  ];

  return (
    <div className="h-[90vh] max-md:hidden [perspective:1000px] relative b flex flex-col max-w-[96rem] mx-auto w-full  items-start justify-start m-10">
      <Tabs
        tabs={tabs}
        activeTabClassName="bg-primary"
      />
    </div>
  );
}

