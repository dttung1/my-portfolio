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

export const familyRelationSchema = z.object({
  relation: z.string().min(1),
  fullName: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export const disciplineItemSchema = z.object({
  date: z.string().optional().or(z.literal("")),
  form: z.string().optional().or(z.literal("")),
  reason: z.string().optional().or(z.literal("")),
  authority: z.string().optional().or(z.literal("")),
});

export const civilServantSchema = z.object({
  partyJoinDate: z.string().optional().or(z.literal("")),
  partyOfficialDate: z.string().optional().or(z.literal("")),
  youthLeagueJoinDate: z.string().optional().or(z.literal("")),
  recruitmentDate: z.string().optional().or(z.literal("")),
  recruitmentAgency: z.string().optional().or(z.literal("")),
  currentPosition: z.string().optional().or(z.literal("")),
  mainAssignedWork: z.string().optional().or(z.literal("")),
  civilServantRank: z.string().optional().or(z.literal("")),
  rankCode: z.string().optional().or(z.literal("")),
  educationLevel: z.string().optional().or(z.literal("")),
  highestQualification: z.string().optional().or(z.literal("")),
  politicalTheoryLevel: z.string().optional().or(z.literal("")),
  stateManagementLevel: z.string().optional().or(z.literal("")),
  itLevel: z.string().optional().or(z.literal("")),
  foreignLanguages: z.string().optional().or(z.literal("")),
  religion: z.string().optional().or(z.literal("")),
  permanentAddress: z.string().optional().or(z.literal("")),
  placeOfBirth: z.string().optional().or(z.literal("")),
  healthStatus: z.string().optional().or(z.literal("")),
  height: z.string().optional().or(z.literal("")),
  weight: z.string().optional().or(z.literal("")),
  bloodType: z.string().optional().or(z.literal("")),
  idNumber: z.string().optional().or(z.literal("")),
  idIssueDate: z.string().optional().or(z.literal("")),
  socialInsuranceNumber: z.string().optional().or(z.literal("")),
  policyFamilyStatus: z.string().optional().or(z.literal("")),
  family: z.array(familyRelationSchema).default([]),
  disciplines: z.array(disciplineItemSchema).default([]),
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
  civilServant: civilServantSchema.default({
    partyJoinDate: "",
    partyOfficialDate: "",
    youthLeagueJoinDate: "",
    recruitmentDate: "",
    recruitmentAgency: "",
    currentPosition: "",
    mainAssignedWork: "",
    civilServantRank: "",
    rankCode: "",
    educationLevel: "",
    highestQualification: "",
    politicalTheoryLevel: "",
    stateManagementLevel: "",
    itLevel: "",
    foreignLanguages: "",
    religion: "",
    permanentAddress: "",
    placeOfBirth: "",
    healthStatus: "",
    height: "",
    weight: "",
    bloodType: "",
    idNumber: "",
    idIssueDate: "",
    socialInsuranceNumber: "",
    policyFamilyStatus: "",
    family: [],
    disciplines: [],
  }),
});

export type Profile = z.infer<typeof profileSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type PublicationItem = z.infer<typeof publicationItemSchema>;
export type AwardItem = z.infer<typeof awardItemSchema>;
export type LinkItem = z.infer<typeof linkItemSchema>;
export type FamilyRelation = z.infer<typeof familyRelationSchema>;
export type DisciplineItem = z.infer<typeof disciplineItemSchema>;
export type CivilServant = z.infer<typeof civilServantSchema>;

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
  civilServant: {
    partyJoinDate: "",
    partyOfficialDate: "",
    youthLeagueJoinDate: "",
    recruitmentDate: "",
    recruitmentAgency: "",
    currentPosition: "",
    mainAssignedWork: "",
    civilServantRank: "",
    rankCode: "",
    educationLevel: "",
    highestQualification: "",
    politicalTheoryLevel: "",
    stateManagementLevel: "",
    itLevel: "",
    foreignLanguages: "",
    religion: "",
    permanentAddress: "",
    placeOfBirth: "",
    healthStatus: "",
    height: "",
    weight: "",
    bloodType: "",
    idNumber: "",
    idIssueDate: "",
    socialInsuranceNumber: "",
    policyFamilyStatus: "",
    family: [],
    disciplines: [],
  },
};
