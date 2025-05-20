import { RouteIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export const route = defineType({
  name: "route",
  title: "Routes",
  type: "document",
  icon: RouteIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
      },
    }),
    defineField({
      name: "select",
      type: "array",
      of: [{ type: "reference", to: [{ type: "project" }], weak: true }],
    }),
  ],
});
