import Image from "next/image";
import { Plus, Calendar, ArrowUp, ArrowDown, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CONSTRUCTION_BY_SLUG_QUERY,
  PROJECT_DETAILS_BY_QUERY,
  PROJECTS_BY_CONSTRUCTION_ID_QUERY,
} from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/live";
import { Author, Project, ProjectDetail } from "@/sanity/types";
import { formatDate } from "@/lib/utils";
import { clientNoCache } from "@/sanity/lib/client";

type ProjectDetailFormType = Omit<ProjectDetail, "author" | "project"> & {
  author?: Author;
} & { project?: Project };

export default async function Dashboard() {
  const { _id: constructionId } = await clientNoCache.fetch(
    CONSTRUCTION_BY_SLUG_QUERY,
    { slug: "thi-cong" }
  );
  const { _id: designId } = await clientNoCache.fetch(
    CONSTRUCTION_BY_SLUG_QUERY,
    { slug: "thi-cong" }
  );

  const [searchForConstructions, searchForDesign, searchForProjectDetails] =
    await Promise.all([
      sanityFetch({
        query: PROJECTS_BY_CONSTRUCTION_ID_QUERY,
        params: { id: constructionId },
      }),
      sanityFetch({
        query: PROJECTS_BY_CONSTRUCTION_ID_QUERY,
        params: { id: designId },
      }),
      sanityFetch({
        query: PROJECT_DETAILS_BY_QUERY,
        params: { search: null },
      }),
    ]);

  const { data: dataConstructions } = searchForConstructions;
  const { data: dataDesigns } = searchForDesign;
  const { data: dataArticles } = searchForProjectDetails;

  console.log("dataArticles", dataArticles[1]);

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-600">Hạng mục Thi công</h3>
              <div className="flex items-center text-amber-500">
                <ArrowDown className="w-4 h-4 mr-1" />
                <span>2</span>
              </div>
            </div>
            <p className="text-3xl font-bold">{dataConstructions.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-600">Hạng mục Thiết kế</h3>
              <div className="flex items-center text-green-500">
                <ArrowUp className="w-4 h-4 mr-1" />
                <span>4</span>
              </div>
            </div>
            <p className="text-3xl font-bold">{dataDesigns.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-600">Tổng Bài Viết</h3>
              <div className="flex items-center text-green-500">
                <ArrowUp className="w-4 h-4 mr-1" />
                <span>2</span>
              </div>
            </div>
            <p className="text-3xl font-bold">{dataArticles.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
        {/* Articles Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Bài Viết Chờ Duyệt
            </h2>
            <Button variant="link" className="text-indigo-600">
              Xem tất cả
            </Button>
          </div>
          <Card className="bg-white">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
              <div className="mb-4">
                <Image
                  src="/icons/verified.svg"
                  alt="No requests"
                  width={100}
                  height={100}
                  className="opacity-30"
                />
              </div>
              <h3 className="mb-1 text-lg font-medium text-gray-900">
                Không Có Bài Viết
              </h3>
              <p className="text-sm text-gray-500">
                Không có yêu cầu bài viết nào đang đợi bạn đánh giá và duyệt tại
                thời điểm này.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recently Added Books */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Các Bài Viết Gần Đây
            </h2>
            <Button variant="link" className="text-indigo-600">
              Xem tất cả
            </Button>
          </div>
          <Card className="bg-white">
            <CardContent className="p-6">
              <Button
                variant="outline"
                className="w-full mb-6 text-gray-600 border-2 border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Book
              </Button>

              <div className="space-y-4">
                {dataArticles?.length &&
                  dataArticles
                    .slice(0, 6)
                    .map(
                      ({
                        _id,
                        thumbnail,
                        title,
                        author,
                        _createdAt,
                      }: ProjectDetailFormType) => (
                        <div key={_id} className="flex gap-3">
                          <Image
                            src={thumbnail || "/placeholder.svg"}
                            alt={title!}
                            width={45}
                            height={60}
                            className="object-cover rounded-sm"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              By {author?.name} • {author?.username}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(_createdAt)}
                            </div>
                          </div>
                        </div>
                      )
                    )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Articles Top Views */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Bài viết xem nhiều nhất
          </h2>
          <Button variant="link" className="text-indigo-600">
            Xem tất cả
          </Button>
        </div>
        <Card className="bg-white">
          <CardContent className="p-6 grid grid-cols-2 gap-4">
            {dataArticles?.length &&
              dataArticles
                .slice(0, 6)
                .map(
                  ({
                    _id,
                    thumbnail,
                    title,
                    author,
                    views,
                  }: ProjectDetailFormType) => (
                    <div key={_id} className="flex gap-3">
                      <Image
                        src={thumbnail || "/placeholder.svg"}
                        alt={title!}
                        width={45}
                        height={60}
                        className="object-cover rounded-sm"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{title}</h4>
                        <p className="text-sm text-gray-600">
                          By {author?.name} • {author?.username}
                        </p>
                        <div className="flex items-center mt-1 ">
                          <EyeIcon className="w-3 h-3 mr-1 text-red-500" />
                          <span className="text-sm text-gray-500 font-bold">
                            {views}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
          </CardContent>
        </Card>
      </div>

      {/* User Avatar */}
      <div className="fixed transform -translate-x-1/2 top-6 left-1/2 md:left-auto md:right-16 md:transform-none">
        <Avatar className="w-12 h-12 border-2 border-white shadow-md">
          <AvatarImage src="/placeholder.svg?height=48&width=48" alt="Adrian" />
          <AvatarFallback>V</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
