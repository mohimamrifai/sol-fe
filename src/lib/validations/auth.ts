import { z } from "zod";
import { NPWP_DIGIT_COUNT, isValidNpwp } from "@/lib/npwp";

export const createLoginSchema = (t: (key: string) => string) => {
  return z.object({
    email: z
      .string()
      .min(1, { message: t("emailRequired") })
      .email({ message: t("emailInvalid") }),
    password: z
      .string()
      .min(1, { message: t("passwordRequired") })
      .min(8, { message: t("passwordMin") }),
  });
};

export const BUSINESS_ENTITY_TYPES = [
  "PT",
  "CV",
  "UD",
  "Koperasi",
  "Yayasan",
  "Firma",
  "Perorangan",
  "Lainnya",
] as const;

export const BUSINESS_CATEGORIES = [
  { value: "trading", label: "Trading" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "distributor", label: "Distributor" },
  { value: "e_commerce", label: "E-Commerce" },
  { value: "logistics", label: "Logistics" },
  { value: "others", label: "Others" },
] as const;

export const createRegisterSchema = (
  t: (key: string, vars?: Record<string, unknown>) => string,
) => {
  return z
    .object({
      // ---- Section 1: Company Information ----
      business_entity_type: z.enum(BUSINESS_ENTITY_TYPES, {
        message: t("businessEntityRequired"),
      }),
      business_entity_other: z.string().optional(),

      company_name: z
        .string()
        .min(1, { message: t("companyNameRequired") }),

      company_code: z
        .string()
        .min(1, { message: t("companyCodeRequired") })
        .length(3, { message: t("companyCodeInvalid") })
        .regex(/^[A-Z]{3}$/, { message: t("companyCodeInvalid") }),

      npwp: z
        .string()
        .min(1, { message: t("npwpRequired") })
        .refine(isValidNpwp, {
          message: t("npwpInvalid", { count: NPWP_DIGIT_COUNT }),
        }),

      company_email: z
        .string()
        .min(1, { message: t("emailRequired") })
        .email({ message: t("emailInvalid") }),

      company_phone: z
        .string()
        .min(1, { message: t("phoneRequired") }),

      website: z
        .string()
        .url({ message: t("websiteInvalid") })
        .or(z.literal(""))
        .optional(),

      // ---- Section 2: Company Address (cascading) ----
      country: z.string().min(1, { message: t("countryRequired") }),
      province: z.string().min(1, { message: t("provinceRequired") }),
      city: z.string().min(1, { message: t("cityRequired") }),
      district: z.string().min(1, { message: t("districtRequired") }),
      postal_code: z
        .string()
        .min(1, { message: t("postalCodeRequired") })
        .max(10, { message: t("postalCodeInvalid") }),
      address: z.string().min(1, { message: t("addressRequired") }),

      // ---- Section 3: Operational Information ----
      business_category: z.enum(
        BUSINESS_CATEGORIES.map((c) => c.value) as [string, ...string[]],
        { message: t("businessCategoryRequired") },
      ),
      business_category_other: z.string().optional(),
      monthly_shipment_estimate: z.enum(["<10", "10-50", "50-100", ">100"], {
        message: t("monthlyShipmentEstimateRequired"),
      }),

      // ---- Section 4: Admin Account ----
      admin_name: z.string().min(1, { message: t("fullNameRequired") }),
      admin_email: z
        .string()
        .min(1, { message: t("emailRequired") })
        .email({ message: t("emailInvalid") }),
      admin_phone: z.string().min(1, { message: t("phoneRequired") }),

      password: z
        .string()
        .min(1, { message: t("passwordRequired") })
        .min(8, { message: t("passwordMin") }),
      confirm_password: z
        .string()
        .min(1, { message: t("confirmPasswordRequired") }),

      terms_accepted: z.literal(true, {
        message: t("termsRequired"),
      }),
    })
    .superRefine((data, ctx) => {
      // Conditional: "Lainnya" requires business_entity_other
      if (data.business_entity_type === "Lainnya" && !data.business_entity_other?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("businessEntityOtherRequired"),
          path: ["business_entity_other"],
        });
      }

      // Conditional: "others" requires business_category_other
      if (data.business_category === "others" && !data.business_category_other?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("businessCategoryOtherRequired"),
          path: ["business_category_other"],
        });
      }

      // Password match
      if (data.password !== data.confirm_password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("passwordMismatch"),
          path: ["confirm_password"],
        });
      }
    });
};

export type LoginSchema = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterSchema = z.infer<ReturnType<typeof createRegisterSchema>>;
