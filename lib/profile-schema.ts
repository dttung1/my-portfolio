import { z } from "zod";

export const basicSchema = z.object({
  fullName: z.string().min(1, "Bắt buộc"),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  nationality: z.string().optional().or(z.literal("")),
  ethnicity: z.string().optional().or(z.literal("")),
  hometown: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  summary: z.string().optional().or(z.literal("")),
  photoDataUrl: z.string().optional().or(z.literal("")),
});

export const educationItemSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().optional().or(z.literal("")),
  field: z.string().optional().or(z.literal("")),
  startYear: z.string().optional().or(z.literal("")),
  endYear: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export const experienceItemSchema = z.object({
  organization: z.string().min(1),
  role: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export const projectItemSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional().or(z.literal("")),
  year: z.string().optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export const publicationItemSchema = z.object({
  title: z.string().min(1),
  authors: z.string().optional().or(z.literal("")),
  venue: z.string().optional().or(z.literal("")),
  year: z.string().optional().or(z.literal("")),
  doi: z.string().optional().or(z.literal("")),
});

export const awardItemSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional().or(z.literal("")),
  year: z.string().optional().or(z.literal("")),
});

export const linkItemSchema = z.object({
  label: z.string().min(1),
  url: z.string().url("URL không hợp lệ"),
});

export const profileSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  basic: basicSchema,
  education: z.array(educationItemSchema).default([]),
  experience: z.array(experienceItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  publications: z.array(publicationItemSchema).default([]),
  awards: z.array(awardItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  links: z.array(linkItemSchema).default([]),
});

export type Profile = z.infer<typeof profileSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type PublicationItem = z.infer<typeof publicationItemSchema>;
export type AwardItem = z.infer<typeof awardItemSchema>;
export type LinkItem = z.infer<typeof linkItemSchema>;

export const emptyProfile: Profile = {
  schemaVersion: 1,
  basic: {
    fullName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "Việt Nam",
    ethnicity: "",
    hometown: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    summary: "",
    photoDataUrl: "",
  },
  education: [],
  experience: [],
  projects: [],
  publications: [],
  awards: [],
  skills: [],
  languages: [],
  links: [],
};
