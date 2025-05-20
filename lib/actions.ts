"use server";

import { auth } from "@/auth";
import { parseServerActionResponse } from "@/lib/utils";
import slugify from "slugify";
import { writeClient } from "@/sanity/lib/write-client";
import { clientNoCache } from "@/sanity/lib/client";
import {
  CATEGORY_BY_ID_QUERY,
  CONSTRUCTION_BY_SLUG_QUERY,
  DESIGN_BY_SLUG_QUERY,
  PROJECT_BY_SLUG_QUERY,
  PROJECT_DETAIL_BY_SLUG_QUERY,
  ROUTE_BY_ID_QUERY,
} from "@/sanity/lib/queries";
import { v4 as uuidv4 } from "uuid";
import { Author } from "@/sanity/types";

export const createPitch = async (
  state: any,
  form: FormData,
  pitch: string
) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { title, description, category, link } = Object.fromEntries(
    Array.from(form).filter(([key]) => key !== "pitch")
  );

  const slug = slugify(title as string, { lower: true, strict: true });

  try {
    const startup = {
      title,
      description,
      category,
      image: link,
      slug: {
        _type: slug,
        current: slug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      pitch,
    };

    const result = await writeClient.create({ _type: "startup", ...startup });

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const createConstruction = async (
  state: any,
  form: FormData,
  pitch: string
) => {
  const session = await auth();

  console.log("createConstruction -> session", session);

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { _id, title, subtitle, description, thumbnail, image, orderIndex } =
    Object.fromEntries(Array.from(form).filter(([key]) => key !== "pitch"));

  const baseSlug = slugify(title as string, { lower: true, strict: true });
  let uniqueSlug = baseSlug;

  const resultQuery = await clientNoCache.fetch(CONSTRUCTION_BY_SLUG_QUERY, {
    slug: baseSlug,
  });

  console.log(resultQuery);

  if (resultQuery?.data) {
    uniqueSlug = `${baseSlug}-${resultQuery.data.length}`;
  }

  try {
    const construction = {
      title,
      subtitle,
      description,
      thumbnail,
      image,
      orderIndex,
      slug: {
        _type: uniqueSlug,
        current: uniqueSlug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      pitch,
    };

    const result = await writeClient.create({
      _type: "construction",
      ...construction,
    });

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateConstruction = async (
  state: any,
  form: FormData,
  pitch: string,
  _id: string
) => {
  const session = await auth();

  console.log("updateConstruction -> session", session);

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { title, subtitle, description, thumbnail, image, orderIndex } =
    Object.fromEntries(Array.from(form).filter(([key]) => key !== "pitch"));

  const baseSlug = slugify(title as string, { lower: true, strict: true });
  let uniqueSlug = baseSlug;

  const resultQuery = await clientNoCache.fetch(CONSTRUCTION_BY_SLUG_QUERY, {
    slug: baseSlug,
  });

  console.log(resultQuery);

  if (resultQuery?.data) {
    uniqueSlug = `${baseSlug}-${resultQuery.data.length}`;
  }

  try {
    const construction = {
      title,
      subtitle,
      description,
      thumbnail,
      image,
      orderIndex,
      slug: {
        _type: uniqueSlug,
        current: uniqueSlug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      pitch,
    };

    const result = await writeClient
      .patch(_id)
      .set({ ...construction })
      .commit();

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const createDesign = async (
  state: any,
  form: FormData,
  pitch: string
) => {
  const session = await auth();

  console.log("createDesign -> session", session);

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { _id, title, subtitle, description, thumbnail, image } =
    Object.fromEntries(Array.from(form).filter(([key]) => key !== "pitch"));

  const baseSlug = slugify(title as string, { lower: true, strict: true });
  let uniqueSlug = baseSlug;

  const resultQuery = await clientNoCache.fetch(DESIGN_BY_SLUG_QUERY, {
    slug: baseSlug,
  });

  console.log(resultQuery);

  if (resultQuery?.data) {
    uniqueSlug = `${baseSlug}-${resultQuery.data.length}`;
  }

  try {
    const design = {
      title,
      subtitle,
      description,
      thumbnail,
      image,
      slug: {
        _type: uniqueSlug,
        current: uniqueSlug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      pitch,
    };

    const result = await writeClient.create({ _type: "design", ...design });

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateDesign = async (
  state: any,
  form: FormData,
  pitch: string,
  _id: string
) => {
  const session = await auth();

  console.log("updateDesign -> session", session);

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { title, subtitle, description, thumbnail, image } = Object.fromEntries(
    Array.from(form).filter(([key]) => key !== "pitch")
  );

  const baseSlug = slugify(title as string, { lower: true, strict: true });
  let uniqueSlug = baseSlug;

  const resultQuery = await clientNoCache.fetch(DESIGN_BY_SLUG_QUERY, {
    slug: baseSlug,
  });

  console.log(resultQuery);

  if (resultQuery?.data) {
    uniqueSlug = `${baseSlug}-${resultQuery.data.length}`;
  }

  try {
    const design = {
      title,
      subtitle,
      description,
      thumbnail,
      image,
      slug: {
        _type: uniqueSlug,
        current: uniqueSlug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      pitch,
    };

    const result = await writeClient
      .patch(_id)
      .set({ ...design })
      .commit();

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const createProject = async (
  state: any,
  form: FormData,
  pitch: string,
  constructionIds: string[]
) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { title, subtitle, description, thumbnail, image, orderIndex } =
    Object.fromEntries(Array.from(form).filter(([key]) => key !== "pitch"));

  const baseSlug = slugify(title as string, { lower: true, strict: true });
  let uniqueSlug = baseSlug;

  const resultQuery = await clientNoCache.fetch(PROJECT_BY_SLUG_QUERY, {
    slug: baseSlug,
  });

  console.log(resultQuery);

  const constructions = constructionIds?.map((_id: string) => ({
    _type: "reference",
    _ref: _id,
    _key: uuidv4(),
  }));

  console.log("updateProject -> constructions", constructions);

  if (resultQuery?.data) {
    uniqueSlug = `${baseSlug}-${resultQuery.data.length}`;
  }

  try {
    const projectData = {
      title,
      subtitle,
      description,
      thumbnail,
      image,
      orderIndex,
      slug: {
        _type: uniqueSlug,
        current: uniqueSlug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      construction: constructions,
      pitch,
    };

    const result = await writeClient.create({
      _type: "project",
      ...projectData,
    });

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateProject = async (
  state: any,
  form: FormData,
  pitch: string,
  constructionIds: string[],
  _id: string
) => {
  console.log("updateProject-1");
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const {
    title,
    subtitle,
    description,
    thumbnail,
    image,
    orderIndex,
    investor,
    address,
    scale,
    _function,
    expense,
    designTeam,
    designYear,
    estimatedTime,
  } = Object.fromEntries(Array.from(form).filter(([key]) => key !== "pitch"));

  const baseSlug = slugify(title as string, { lower: true, strict: true });
  let uniqueSlug = baseSlug;

  const resultQuery = await clientNoCache.fetch(PROJECT_BY_SLUG_QUERY, {
    slug: baseSlug,
  });

  console.log(resultQuery);

  if (resultQuery?.data) {
    uniqueSlug = `${baseSlug}-${resultQuery.data.length}`;
  }

  const constructions = constructionIds?.map((_id: string) => ({
    _type: "reference",
    _ref: _id,
    _key: uuidv4(),
  }));

  console.log("updateProject -> constructions", constructions);

  try {
    const projectData = {
      title,
      subtitle,
      description,
      thumbnail,
      image,
      orderIndex,
      overview: {
        investor,
        address,
        scale,
        function: _function,
        expense,
        designTeam,
        designYear,
        estimatedTime,
      },
      slug: {
        _type: uniqueSlug,
        current: uniqueSlug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      construction: constructions,
      pitch,
    };

    console.log(projectData);

    const result = await writeClient
      .patch(_id)
      .set({ ...projectData })
      .commit();

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const createProjectDetail = async (
  state: any,
  form: FormData,
  pitch: string,
  projectId: string
) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const {
    title,
    subtitle,
    tags,
    description,
    thumbnail,
    image,
    orderIndex,
    overview,
  } = Object.fromEntries(Array.from(form).filter(([key]) => key !== "pitch"));

  console.log("createProjectDetail -> overview", overview);

  const baseSlug = slugify(title as string, { lower: true, strict: true });
  let uniqueSlug = baseSlug;

  const resultQuery = await clientNoCache.fetch(PROJECT_DETAIL_BY_SLUG_QUERY, {
    slug: baseSlug,
  });

  console.log(resultQuery);

  if (resultQuery?.data) {
    uniqueSlug = `${baseSlug}-${resultQuery.data.length}`;
  }

  try {
    const projectDetailData = {
      title,
      subtitle,
      description,
      thumbnail,
      image,
      tags,
      orderIndex,
      overview,
      slug: {
        _type: uniqueSlug,
        current: uniqueSlug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      project: {
        _type: "reference",
        _ref: projectId,
      },
      pitch,
    };

    const result = await writeClient.create({
      _type: "projectDetail",
      ...projectDetailData,
    });

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);

    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateProjectDetail = async (
  state: any,
  form: FormData,
  pitch: string,
  projectId: string,
  _id: string
) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const {
    title,
    subtitle,
    tags,
    description,
    thumbnail,
    image,
    orderIndex,
    investor,
    address,
    scale,
    _function,
    expense,
    designTeam,
    designYear,
    estimatedTime,
  } = Object.fromEntries(Array.from(form).filter(([key]) => key !== "pitch"));

  const baseSlug = slugify(title as string, { lower: true, strict: true });
  let uniqueSlug = baseSlug;

  const resultQuery = await clientNoCache.fetch(PROJECT_DETAIL_BY_SLUG_QUERY, {
    slug: baseSlug,
  });

  console.log(resultQuery);

  if (resultQuery?.data) {
    uniqueSlug = `${baseSlug}-${resultQuery.data.length}`;
  }

  try {
    const projectDetailData = {
      title,
      subtitle,
      description,
      tags,
      thumbnail,
      image,
      orderIndex,
      overview: {
        investor,
        address,
        scale,
        function: _function,
        expense,
        designTeam,
        designYear,
        estimatedTime,
      },
      slug: {
        _type: uniqueSlug,
        current: uniqueSlug,
      },
      author: {
        _type: "reference",
        _ref: session?.id,
      },
      project: {
        _type: "reference",
        _ref: projectId,
      },
      pitch,
    };

    const result = await writeClient
      .patch(_id)
      .set({ ...projectDetailData })
      .commit();

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateCategory = async (
  state: any,
  _id: string,
  projectId: string,
  isDelete: boolean = false
) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { select } = await clientNoCache.fetch(CATEGORY_BY_ID_QUERY, {
    id: _id,
  });

  console.log(select);

  try {
    if (isDelete) {
      const categorySelect = select
        .filter((item: any) => item._id !== projectId)
        .map((item: any) => ({
          _type: "reference",
          _ref: item._id,
          _key: item._key || uuidv4(),
        }));
      const categoryData = {
        select: [...categorySelect],
      };

      const result = await writeClient
        .patch(_id)
        .set({ ...categoryData })
        .commit();

      return parseServerActionResponse({
        result,
        error: "",
        status: "SUCCESS",
      });
    }

    const isExist = select.find((item: any) => item._id === projectId);

    if (isExist) {
      return parseServerActionResponse({
        error: "This item is already exist",
        status: "ERROR",
      });
    }

    const categorySelect = select.map((item: any) => ({
      _type: "reference",
      _ref: item._id,
      _key: item._key || uuidv4(),
    }));
    const categoryData = {
      select: [
        ...categorySelect,
        { _type: "reference", _ref: projectId, _key: uuidv4() },
      ],
    };

    const result = await writeClient
      .patch(_id)
      .set({ ...categoryData })
      .commit();

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateRoute = async (
  state: any,
  _id: string,
  projectId: string,
  isDelete: boolean = false
) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { select } = await clientNoCache.fetch(ROUTE_BY_ID_QUERY, { id: _id });

  console.log(select);

  try {
    if (isDelete) {
      const routeSelect = select
        .filter((item: any) => item._id !== projectId)
        .map((item: any) => ({
          _type: "reference",
          _ref: item._id,
          _key: item._key || uuidv4(),
        }));
      const routeData = {
        select: [...routeSelect],
      };

      const result = await writeClient
        .patch(_id)
        .set({ ...routeData })
        .commit();

      return parseServerActionResponse({
        result,
        error: "",
        status: "SUCCESS",
      });
    }

    const isExist = select.find((item: any) => item._id === projectId);

    if (isExist) {
      return parseServerActionResponse({
        error: "This item is already exist",
        status: "ERROR",
      });
    }

    const routeSelect = select.map((item: any) => ({
      _type: "reference",
      _ref: item._id,
      _key: item._key || uuidv4(),
    }));
    const routeData = {
      select: [
        ...routeSelect,
        { _type: "reference", _ref: projectId, _key: uuidv4() },
      ],
    };

    const result = await writeClient
      .patch(_id)
      .set({ ...routeData })
      .commit();

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const deleteById = async (_id: string) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  try {
    const result = await writeClient.delete(_id);

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateRoleByAdmin = async (post: Author) => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  try {
    const result = await writeClient
      .patch(post._id)
      .set({ role: post.role })
      .commit();

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const publishedProjectDetail = async (
  postId: string,
  published: string
): Promise<ReturnType<typeof parseServerActionResponse>> => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  // const resultQuery = await clientNoCache.fetch(PROJECT_DETAIL_BY_ID_QUERY, {
  //   id: postId,
  // });

  try {
    // const projectDetailData = {
    //   ...resultQuery,
    //   published,
    // };
    const result = await writeClient.patch(postId).set({ published }).commit();

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateIsDeleted = async (
  postId: string,
  isDeleted: boolean
): Promise<ReturnType<typeof parseServerActionResponse>> => {
  const session = await auth();

  if (!session)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  // const resultQuery = await clientNoCache.fetch(PROJECT_DETAIL_BY_ID_QUERY, {
  //   id: postId,
  // });

  try {
    // const projectDetailData = {
    //   ...resultQuery,
    //   published,
    // };
    const result = await writeClient.patch(postId).set({ isDeleted }).commit();

    return parseServerActionResponse({
      result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};
