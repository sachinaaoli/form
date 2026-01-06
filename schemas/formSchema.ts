import * as z from "zod";
import { calculateAge } from "@/lib/utils"; 
import { NEPALI_DISTRICTS } from "@/lib/districts";

const MAX_FILE_SIZE = 2 * 1024 * 1024; 
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export const formSchema = z.object({
  fullNameEn: z
    .string()
    .min(1, "Full Name (English) is required")
    .regex(/^[a-zA-Z\s]+$/, "Only alphabets allowed"),
  fullNameNp: z.string().optional(),
  
  gender: z.enum(["Male", "Female", "Other"]),
  
  dobAD: z.date(),
  dobBS: z.string().min(1, "Date of Birth (BS) is required"),
phone: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; 
      return /^[9]\d{9}$/.test(val);
    }, {
      message: "Phone must be 10 digits and start with 9"
    }),
  citizenshipNo: z.string().min(1, "Citizenship number is required"),
  
 issuedDistrict: z.enum(NEPALI_DISTRICTS as [string, ...string[]]),
  
  issuedDateAD: z.date(),
  issuedDateBS: z.string().min(1, "Issued Date (BS) is required"),
  
  citizenshipFront: z
    .any()
    .refine((file) => file instanceof File, "Front image is required")
    .refine((file) => file?.size <= MAX_FILE_SIZE, "Max file size is 2MB")
    .refine((file) => ACCEPTED_TYPES.includes(file?.type),
      "Only .jpg, .png, and .pdf allowed"
    ),
  citizenshipBack: z
    .any()
    .refine((file) => file instanceof File, "Back image is required")
    .refine((file) => file?.size <= MAX_FILE_SIZE, "Max file size is 2MB")
    .refine((file) => ACCEPTED_TYPES.includes(file?.type),
      "Only .jpg, .png, and .pdf allowed"
    ),
}).superRefine((data, ctx) => {
  if (data.dobAD && data.gender === "Male") {
    const age = calculateAge(data.dobAD);
    if (age > 18) {
      if (!data.phone || !/^9\d{9}$/.test(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Phone is required for Males over 18 (10 digits, starts with 9)",
        });
      }
    }
  }
});

export type FormSchemaType = z.infer<typeof formSchema>;