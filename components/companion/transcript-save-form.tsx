"use client";

import type React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { subjects } from "@/constants";
import {
  UpsertCompanionData,
  upsertTranscriptCompanion,
  upsertTranscriptCompanion2,
} from "@/lib/actions/transcript.actions";
import { ProcessorResult, TopicConfig } from "@/types";

// Schema for transcript companion
export const transcriptCompanionSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  topic: z.string().min(1, { message: "Topic is required." }),
  voice: z.string().min(1, { message: "Voice is required." }),
  style: z.string().min(1, { message: "Style is required." }),
  duration: z.coerce.number().min(1, { message: "Duration is required." }),
  // Transcript specific fields
  transcript_data: z.object({
    rawTranscript: z.string(),
    topicConfig: z.array(
      z.object({
        key: z.string(),
        keyword: z.string(),
        title: z.string().optional(),
      })
    ),
    podcastTopics: z.record(
      z.array(
        z.object({
          speaker: z.string(),
          text: z.string(),
        })
      )
    ),
    topicTitles: z.record(z.string()),
    metadata: z.object({
      totalEntries: z.number(),
      totalTopics: z.number(),
      speakers: z.array(z.string()),
      processingTime: z.number(),
    }),
  }),
});

export type CreateTranscriptCompanion = z.infer<
  typeof transcriptCompanionSchema
>;

// Form schema for the save form
const formSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, { message: "Name is required." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  topic: z.string().min(1, { message: "Topic is required." }),
  voice: z.string().min(1, { message: "Voice is required." }),
  style: z.string().min(1, { message: "Style is required." }),
  duration: z.coerce.number().min(1, { message: "Duration is required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface TranscriptSaveFormProps {
  children: React.ReactNode;
  rawTranscript: string;
  topicConfig: TopicConfig[];
  processedData: ProcessorResult;
  // Thêm companion để truyền dữ liệu mặc định khi edit
  companion?: FormValues & { id: string };
}
export function TranscriptSaveForm({
  children,
  rawTranscript,
  topicConfig,
  processedData,
  companion,
}: TranscriptSaveFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!companion;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode
      ? companion
      : {
          name: "",
          subject: "",
          topic: "",
          voice: "female",
          style: "casual",
          duration: 15,
        },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const companionData: UpsertCompanionData = {
        ...values,
        id: isEditMode ? companion.id : undefined, // Truyền ID nếu là edit
        transcriptData: {
          rawTranscript,
          topicConfig,
          podcastTopics: processedData.podcastTopics,
          topicTitles: processedData.topicTitles,
          metadata: processedData.metadata,
        },
      };

      const savedCompanion = await upsertTranscriptCompanion2(companionData);

      if (savedCompanion.success) {
        setOpen(false);
        // router.push(`/companions/${savedCompanion.id}`);
      }
    } catch (error) {
      console.error("Failed to save transcript companion:", error);
      // You can add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode && companion) {
      form.reset(companion);
    }
  }, [companion, isEditMode, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-black-200">
            {isEditMode ? "Update Companion" : "Save Transcript Companion"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Edit the details for this companion."
              : "Create a companion based on your processed transcript data."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Companion Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter companion name"
                      {...field}
                      className="input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="text-black-400">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem
                            key={subject}
                            value={subject}
                            className="capitalize"
                          >
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What should the companion help with?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex. English speaking practice, podcast analysis, etc."
                      {...field}
                      className="input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voice</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="text-black-400">
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="text-black-400">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="15"
                      {...field}
                      className="input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Companion"
                  : "Create Companion"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
