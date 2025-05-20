import { defineField, defineType } from "sanity";
import { UsersIcon } from "lucide-react";

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Github', value: 'github' },
          { title: 'Google', value: 'google' },
        ],
      },
      initialValue: 'github',
    }),
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'username',
      title: 'Username',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Image URL',
      type: 'url',
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'text',
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'Viewer', value: 'viewer' },
          { title: 'Editor', value: 'editor' },
          { title: 'Admin', value: 'admin' },
        ],
      },
      initialValue: 'viewer', // Giá trị mặc định
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role', // Hiển thị vai trò trong bản xem trước
    },
  },
});
