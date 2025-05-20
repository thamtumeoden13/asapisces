import { defineField, defineType } from "sanity";
import { ProjectorIcon } from "lucide-react";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  icon: ProjectorIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      type: "string",
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
    }),
    defineField({
      name: "author",
      type: "reference",
      to: { type: "author" },
      weak: true, // Cho phép xóa author mà không bị lỗi
    }),
    defineField({
      name: "construction",
      type: "array",
      of: [{ type: "reference", to: [{ type: "construction" }], weak: true }],
    }),
    defineField({
      name: "thumbnail",
      type: "url",
      validation: (Rule) =>
        Rule.required().uri({
          allowRelative: true,
          scheme: ["http", "https"],
        }),
    }),
    defineField({
      name: "image",
      type: "url",
      validation: (Rule) =>
        Rule.required().uri({
          allowRelative: true,
          scheme: ["http", "https"],
        }),
    }),
    defineField({
      name: "tags",
      type: "string",
    }),
    defineField({
      name: "orderIndex",
      type: "string",
      initialValue: "0",
    }),
    defineField({
      name: "pitch",
      type: "markdown",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "onlyShowRouter",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "isActived",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "isDeleted",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "createdAt",
      type: "date",
      initialValue: new Date().toISOString(),
    }),
  ],
});
