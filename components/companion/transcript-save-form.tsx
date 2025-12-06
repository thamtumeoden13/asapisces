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
  FormDescription,
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

import { Switch } from "@/components/ui/switch"; // Cần cho isPublic
import { subjects } from "@/constants";
import {
  UpsertCompanionData,
  upsertTranscriptCompanion2,
} from "@/lib/actions/transcript.actions";
import { ProcessorResult, TopicConfig } from "@/types";
import {
  transcriptCompanionSchema,
  transcriptSaveFormSchema,
} from "@/lib/zodSchema";

import { Sparkles } from "lucide-react"; // Thêm icon
import { generateCompanionDetailsAction } from "@/lib/actions/general.action";

export type CreateTranscriptCompanion = z.infer<
  typeof transcriptCompanionSchema
>;

type FormValues = z.infer<typeof transcriptSaveFormSchema>;

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
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);

  const isEditMode = !!companion;

  const form = useForm({
    resolver: zodResolver(transcriptSaveFormSchema),
    defaultValues: isEditMode
      ? companion
      : {
          name: "",
          subject: "",
          topic: "",
          voice: "female",
          style: "casual",
          duration: 15,
          description: "",
          coverImage: "",
          isPublic: false,
        },
  });

  const handleAutoFill = async () => {
    setIsGeneratingDetails(true);
    try {
      const result = await generateCompanionDetailsAction({ rawTranscript });
      if (result.success && result.data) {
        const subject = result.data.subject;
        // Giả sử bạn lưu ảnh trong public/images/covers/ và có định dạng .jpg
        // Ví dụ: /images/covers/finance.jpg
        const coverImageUrl = `/images/covers/${subject}.png`;
        // Sử dụng form.setValue để điền dữ liệu vào form
        form.setValue("name", result.data.name, { shouldValidate: true });
        form.setValue("subject", result.data.subject, { shouldValidate: true });
        form.setValue("topic", result.data.topic, { shouldValidate: true });
        form.setValue("description", result.data.description, {
          shouldValidate: true,
        });
        form.setValue("duration", result.data.duration, {
          shouldValidate: true,
        });
        form.setValue("coverImage", coverImageUrl, { shouldValidate: true });
      } else {
        alert(result.error || "An unknown error occurred.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to the AI service.");
    } finally {
      setIsGeneratingDetails(false);
    }
  };

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

        <div className="my-4">
          <Button
            type="button" // Quan trọng: để không submit form
            variant="outline"
            className="w-full text-blue-400 border-purple hover:bg-purple"
            disabled={isGeneratingDetails || !rawTranscript.trim()}
            onClick={handleAutoFill}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGeneratingDetails ? "Analyzing..." : "Auto-fill with AI"}
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black-200">
                    Companion Name
                  </FormLabel>
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
                  <FormLabel className="text-black-200">Subject</FormLabel>
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
                  <FormLabel className="text-black-200">
                    What should the companion help with?
                  </FormLabel>
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
                    <FormLabel className="text-black-200">Voice</FormLabel>
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
                    <FormLabel className="text-black-200">Style</FormLabel>
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
                  <FormLabel className="text-black-200">
                    Session Duration (minutes)
                  </FormLabel>
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black-200">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="text-black-200"
                      placeholder="Describe what this conversation is about..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black-200">
                    Cover Image URL
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="text-black-200"
                      placeholder="https://example.com/image.png"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Share with Community</FormLabel>
                    <FormDescription>
                      Allow other users to practice with this companion.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
