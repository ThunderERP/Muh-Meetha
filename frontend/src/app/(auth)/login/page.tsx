"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/store/auth-store";
import { settingsApi } from "@/lib/users-api";
import { useSettingsStore } from "@/store/settings-store";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  tenantSlug: z
    .string()
    .min(1, "Company ID is required")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setAuth(res.user, res.tenant, res.accessToken);
      // Signal cookie for Edge middleware — carries no sensitive data
      document.cookie =
        "thundererp_auth_token=1; path=/; max-age=604800; SameSite=Lax";
      try {
        const userSettings = await settingsApi.getUserSettings();
        if (userSettings) setSettings(userSettings);
      } catch {
        // non-fatal — fall back to local defaults
      }
      toast.success(`Welcome back, ${res.user.name}!`);
      router.replace("/inventory");
    } catch (err) {
      toast.error((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-modal p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          Sign in to your workspace
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Enter your company ID to continue
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="erp-label">Company ID</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 size={15} className="text-text-muted" />
            </div>
            <input
              {...register("tenantSlug")}
              placeholder="your-company"
              className={cn(
                "erp-input pl-9",
                errors.tenantSlug && "border-danger",
              )}
            />
          </div>
          {errors.tenantSlug && (
            <p className="mt-1 text-xs text-danger">
              {errors.tenantSlug.message}
            </p>
          )}
        </div>

        <div>
          <label className="erp-label">Email Address</label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className={cn("erp-input", errors.email && "border-danger")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="erp-label">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn(
                "erp-input pr-10",
                errors.password && "border-danger",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-secondary"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-lg
                     flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Signing in&hellip;
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center">
        <p className="text-sm text-text-secondary">
          New to ThunderERP?{" "}
          <Link
            href="/register"
            className="text-primary-600 font-semibold hover:underline"
          >
            Register your company
          </Link>
        </p>
      </div>

      {/* Demo credentials only visible in development — never shown in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 bg-surface-muted rounded-lg p-3 text-2xs text-text-muted text-center">
          Demo: company <span className="font-mono">demo-corp</span> &middot;
          admin@democorp.in / Admin@1234
        </div>
      )}
    </div>
  );
}
