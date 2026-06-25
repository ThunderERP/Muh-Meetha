"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/store/auth-store";
import { cn, slugify } from "@/lib/utils";

// Matches backend RegisterTenantDto field-for-field
const registerSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(255),
    slug: z
      .string()
      .min(3, "Workspace ID must be at least 3 characters")
      .max(60)
      .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
    adminName: z
      .string()
      .min(2, "Your name must be at least 2 characters")
      .max(255),
    adminEmail: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    gstin: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().optional(),
    jobTitle: z.string().optional(),
    tosAccepted: z
      .boolean()
      .refine((v) => v === true, "You must accept the Terms of Service"),
    privacyAccepted: z
      .boolean()
      .refine((v) => v === true, "You must accept the Privacy Policy"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type RegisterForm = z.infer<typeof registerSchema>;

const INDUSTRIES = [
  "Retail",
  "Manufacturing",
  "Distribution & Wholesale",
  "Healthcare",
  "Food & Beverage",
  "Electronics",
  "Apparel & Fashion",
  "Construction",
  "Automotive",
  "Agriculture",
  "Jewellery",
  "Pharmaceuticals",
  "Other",
];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { tosAccepted: false, privacyAccepted: false },
  });

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("companyName", name);
    setValue("slug", slugify(name));
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await authApi.register({
        companyName: data.companyName,
        slug: data.slug,
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        password: data.password,
        phone: data.phone,
        email: data.email || undefined,
        gstin: data.gstin,
        industry: data.industry,
        website: data.website,
        jobTitle: data.jobTitle,
        tosAccepted: data.tosAccepted,
        privacyAccepted: data.privacyAccepted,
      });
      setAuth(res.user, res.tenant, res.accessToken);
      toast.success(res.message || "Company registered successfully!");
      router.replace("/inventory");
      document.cookie =
        "thundererp_auth_token=1; path=/; max-age=604800; SameSite=Lax";
    } catch (err) {
      toast.error((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const slugValue = watch("slug");

  return (
    <div className="bg-white rounded-2xl shadow-modal p-8 max-h-[85vh] overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          Set up your company
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Create your ThunderERP workspace in minutes
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Company Info */}
        <div className="pb-4 border-b border-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Company Details
          </p>
          <div className="space-y-3">
            <div>
              <label className="erp-label">Company Name *</label>
              <input
                {...register("companyName")}
                onChange={handleCompanyNameChange}
                placeholder="Acme Corporation"
                className={cn(
                  "erp-input",
                  errors.companyName && "border-danger",
                )}
              />
              {errors.companyName && (
                <p className="mt-1 text-xs text-danger">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div>
              <label className="erp-label">Workspace ID *</label>
              <div className="relative">
                <input
                  {...register("slug")}
                  placeholder="acme-corp"
                  className={cn(
                    "erp-input pr-32",
                    errors.slug && "border-danger",
                  )}
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-2xs text-text-muted">
                    .thundererp.com
                  </span>
                </div>
              </div>
              {slugValue && !errors.slug && (
                <p className="mt-1 text-xs text-success flex items-center gap-1">
                  <CheckCircle2 size={11} /> thundererp.com/{slugValue}
                </p>
              )}
              {errors.slug && (
                <p className="mt-1 text-xs text-danger">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Phone</label>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">GSTIN</label>
                <input
                  {...register("gstin")}
                  placeholder="27AADCB2230M1ZV"
                  className="erp-input uppercase"
                />
              </div>
            </div>

            <div>
              <label className="erp-label">Industry</label>
              <select {...register("industry")} className="erp-input">
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Admin Account */}
        <div className="pb-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Admin Account
          </p>
          <div className="space-y-3">
            <div>
              <label className="erp-label">Your Full Name *</label>
              <input
                {...register("adminName")}
                placeholder="Rahul Sharma"
                className={cn("erp-input", errors.adminName && "border-danger")}
              />
              {errors.adminName && (
                <p className="mt-1 text-xs text-danger">
                  {errors.adminName.message}
                </p>
              )}
            </div>

            <div>
              <label className="erp-label">Work Email *</label>
              <input
                {...register("adminEmail")}
                type="email"
                placeholder="rahul@acmecorp.com"
                className={cn(
                  "erp-input",
                  errors.adminEmail && "border-danger",
                )}
              />
              {errors.adminEmail && (
                <p className="mt-1 text-xs text-danger">
                  {errors.adminEmail.message}
                </p>
              )}
            </div>

            <div>
              <label className="erp-label">Job Title</label>
              <input
                {...register("jobTitle")}
                placeholder="e.g. Managing Director"
                className="erp-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="erp-label">Password *</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className={cn(
                      "erp-input pr-10",
                      errors.password && "border-danger",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-danger">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="erp-label">Confirm Password *</label>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="Repeat password"
                  className={cn(
                    "erp-input",
                    errors.confirmPassword && "border-danger",
                  )}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-danger">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compliance — required by backend */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              {...register("tosAccepted")}
              className="mt-0.5 w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs text-text-secondary">
              I agree to the{" "}
              <span className="text-primary-600 font-medium">
                Terms of Service
              </span>
            </span>
          </label>
          {errors.tosAccepted && (
            <p className="text-xs text-danger ml-6">
              {errors.tosAccepted.message}
            </p>
          )}

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              {...register("privacyAccepted")}
              className="mt-0.5 w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs text-text-secondary">
              I agree to the{" "}
              <span className="text-primary-600 font-medium">
                Privacy Policy
              </span>
            </span>
          </label>
          {errors.privacyAccepted && (
            <p className="text-xs text-danger ml-6">
              {errors.privacyAccepted.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-lg
                     flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creating workspace…
            </>
          ) : (
            <>
              Create Workspace <ChevronRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-border text-center">
        <p className="text-sm text-text-secondary">
          Already have a workspace?{" "}
          <Link
            href="/login"
            className="text-primary-600 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
