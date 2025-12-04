/* eslint-disable no-unused-vars */

// ====== USER PARAMS
declare type CreateUserParams = {
  clerkId: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  photo: string;
};

declare type UpdateUserParams = {
  firstName: string | null;
  lastName: string | null;
  username: string;
  photo: string;
};

// ====== IMAGE PARAMS
declare type AddImageParams = {
  image: {
    title: string;
    publicId: string;
    transformationType: string;
    width: number;
    height: number;
    config: Record<string, unknown>;
    secureURL: string;
    transformationURL: string;
    aspectRatio: string | undefined;
    prompt: string | undefined;
    color: string | undefined;
  };
  userId: string;
  path: string;
};

declare type UpdateImageParams = {
  image: {
    _id: string;
    title: string;
    publicId: string;
    transformationType: string;
    width: number;
    height: number;
    config: Record<string, unknown>;
    secureURL: string;
    transformationURL: string;
    aspectRatio: string | undefined;
    prompt: string | undefined;
    color: string | undefined;
  };
  userId: string;
  path: string;
};

declare type Transformations = {
  restore?: boolean;
  fillBackground?: boolean;
  remove?: {
    prompt: string;
    removeShadow?: boolean;
    multiple?: boolean;
  };
  recolor?: {
    prompt?: string;
    to: string;
    multiple?: boolean;
  };
  removeBackground?: boolean;
};

// ====== TRANSACTION PARAMS
declare type CheckoutTransactionParams = {
  plan: string;
  credits: number;
  amount: number;
  buyerId: string;
};

declare type CreateTransactionParams = {
  stripeId: string;
  amount: number;
  credits: number;
  plan: string;
  buyerId: string;
  createdAt: Date;
};

declare type TransformationTypeKey =
  | "restore"
  | "fill"
  | "remove"
  | "recolor"
  | "removeBackground";

// ====== URL QUERY PARAMS
declare type FormUrlQueryParams = {
  searchParams: string;
  key: string;
  value: string | number | null;
};

declare type UrlQueryParams = {
  params: string;
  key: string;
  value: string | null;
};

declare type RemoveUrlQueryParams = {
  searchParams: string;
  keysToRemove: string[];
};

declare type SearchParamProps = {
  params: { id: string; type: TransformationTypeKey };
  searchParams: { [key: string]: string | string[] | undefined };
};

declare type TransformationFormProps = {
  action: "Add" | "Update";
  userId: string;
  type: TransformationTypeKey;
  creditBalance: number;
  data?: IImage | null;
  config?: Transformations | null;
};

declare type TransformedImageProps = {
  image: IImage;
  type: string;
  title: string;
  transformationConfig: Transformations | null;
  isTransforming: boolean;
  hasDownload?: boolean;
  setIsTransforming?: React.Dispatch<React.SetStateAction<boolean>>;
};

declare module "*.mp4" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

declare module "markdown-it-video";

declare interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
  image: string;
}

interface InterviewCardProps {
  id?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

declare interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

declare interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

declare interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

declare interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

declare interface SignInParams {
  email: string;
  idToken: string;
  password: string;
}

declare interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

declare type FormType = "sign-in" | "sign-up";

declare interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

declare interface TechIconProps {
  techStack: string[];
}

// type User = {
//   name: string;
//   email: string;
//   image?: string;
//   accountId: string;
// };

enum Subject {
  maths = "maths",
  language = "language",
  science = "science",
  history = "history",
  coding = "coding",
  geography = "geography",
  economics = "economics",
  finance = "finance",
  business = "business",
}

type Companion = Models.DocumentList<Models.Document> & {
  $id: string;
  name: string;
  subject: Subject;
  topic: string;
  duration: number;
  bookmarked: boolean;
};

interface CreateCompanion {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
}

interface GetAllCompanions {
  limit?: number;
  page?: number;
  subject?: string | string[];
  topic?: string | string[];
  bookmarked?: boolean;
  isPublic?: boolean;
}

interface BuildClient {
  key?: string;
  sessionToken?: string;
}

interface CreateUser {
  email: string;
  name: string;
  image?: string;
  accountId: string;
}

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Avatar {
  userName: string;
  width: number;
  height: number;
  className?: string;
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  userId: string;
  voice: string;
  style: string;
  voiceId: string;
  transcriptData: processedData;
  initialFeedbackHistory: FeedbackHistoryPoint[];
  initialCompletedTopics: FeedbackHistoryCompletedTopic[];
}

interface PodcastEntry {
  speaker: string;
  text: string;
}

interface TopicConfig {
  key: string;
  keyword: string;
  title?: string;
  description?: string;
  priority?: number;
}

type PodcastTopics = Record<string, PodcastEntry[]>;
type TopicTitles = Record<string, string>;

interface ProcessorResult {
  podcastTopics: PodcastTopics;
  topicTitles: TopicTitles;
  metadata: {
    totalEntries: number;
    totalTopics: number;
    speakers: string[];
    processingTime: number;
  };
}

export interface ProcessorOptions {
  defaultTopic?: string;
  minTextLength?: number;
  caseSensitive?: boolean;
  enableScoring?: boolean;
}

export interface TimingSettings {
  stepTransitionDelay: number;
  speechTimeout: number; // Có thể dùng cho tương lai
  autoAdvance: boolean; // Có thể dùng cho tương lai
  quickMode: boolean; // Có thể dùng cho tương lai
  responseWaitTime: number; // Đây là giá trị quan trọng nhất: GRACE_PERIOD_MS
}
export interface WordResult {
  word: string;
  match: boolean;
}
export interface SimilarityResult {
  score: number;
  confidence: number;
  matchedPhrases: string[];
  missingPhrases: string[];
  feedback: string;
  isPartialMatch: boolean;
  completenessRatio: number;
  shouldWaitForMore: boolean;
  words: WordResult[];
}

type Message = {
  type?: string;
  role: string;
  content: string;
  timestamp: number;
  similarity?: SimilarityResult | null;
};

type MessageGroup = {
  role: string;
  speaker: string;
  messages: Message[];
  timestamp: number;
};
