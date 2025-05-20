import { client } from "@/sanity/lib/client";
import { CONSTRUCTION_BY_SLUG_QUERY, PROJECT_DETAILS_BY_QUERY, PROJECTS_BY_QUERY } from "@/sanity/lib/queries";
import { ProjectDetail } from "@/sanity/types";
import { getServerSideSitemap } from 'next-sitemap'

const baseUrl = 'https://artsunday.vn';

// Định nghĩa kiểu cho các đối tượng trả về
type PostType = Pick<ProjectDetail, "slug" | "_updatedAt">;

async function fetchPosts() {
  const [construction, design] = await Promise.all([
    client.fetch(CONSTRUCTION_BY_SLUG_QUERY, { 'slug': 'thi-cong' }),
    client.fetch(CONSTRUCTION_BY_SLUG_QUERY, { 'slug': 'thiet-ke' })
  ]);

  console.log({ construction, design })

  const [
    // searchForConstructions,
    // searchForDesigns,
    searchForProjects,
    searchForProjectDetails,
  ] = await Promise.all([
    // client.fetch(PROJECTS_BY_CONSTRUCTION_ID_QUERY, { id: construction._id }),
    // client.fetch(PROJECTS_BY_CONSTRUCTION_ID_QUERY, { id: design._id }),
    client.fetch(PROJECTS_BY_QUERY, { search: null }),
    client.fetch(PROJECT_DETAILS_BY_QUERY, { search: null }),
  ]);

  console.log({ searchForProjects, searchForProjectDetails })

  const sitemapProjects = searchForProjects?.map((post: PostType) => ({
    loc: `${baseUrl}/du-an/${post.slug?.current}`,
    lastmod: new Date(post._updatedAt).toISOString(),
  })) || [];

  const sitemapProjectDetails = searchForProjectDetails?.map((post: PostType) => ({
    loc: `${baseUrl}/bai-viet/${post.slug?.current}`,
    lastmod: new Date(post._updatedAt).toISOString(),
  })) || [];

  return [...sitemapProjects, ...sitemapProjectDetails];
}

export async function GET() {
  const dynamicRoutes = await fetchPosts();
  const staticRoutes = [
    { loc: `${baseUrl}/`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/thi-cong`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/thiet-ke`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/du-an`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/bai-viet`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/thong-tin`, lastmod: new Date().toISOString() },
  ];

  return getServerSideSitemap([
    {
      loc: `${baseUrl}`,
      lastmod: new Date().toISOString(),
      // changefreq
      // priority
    },
    ...staticRoutes,
    ...dynamicRoutes
  ])
}
