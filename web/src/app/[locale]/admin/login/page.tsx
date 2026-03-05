"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useLogin, useSendCode } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { getToken } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const phoneSchema = z.object({
  phone: z.string().regex(/^1\d{10}$/),
});

const loginSchema = z.object({
  code: z.string().length(6),
});

export default function AdminLoginPage() {
  const t = useTranslations("login");
  const tAdmin = useTranslations("adminLogin");
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [countdown, setCountdown] = useState(0);
  const user = useAuthStore((s) => s.user);

  const sendCode = useSendCode();
  const login = useLogin();

  // If already logged in as admin, redirect
  useEffect(() => {
    if (getToken() && user?.role === "admin") {
      router.replace("/admin/sessions");
    }
  }, [user, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema) });
  const codeForm = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

  const handleSendCode = phoneForm.handleSubmit(async (data) => {
    try {
      await sendCode.mutateAsync({ phone: data.phone });
      setPhone(data.phone);
      setStep("code");
      setCountdown(60);
    } catch {
      toast.error(tAdmin("sendCodeFailed"));
    }
  });

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    try {
      await sendCode.mutateAsync({ phone });
      setCountdown(60);
    } catch {
      toast.error(tAdmin("sendCodeFailed"));
    }
  }, [countdown, phone, sendCode, tAdmin]);

  const handleLogin = codeForm.handleSubmit(async (data) => {
    try {
      const resp = await login.mutateAsync({ phone, code: data.code });
      if (resp.user.role !== "admin") {
        toast.error(tAdmin("notAdmin"));
        return;
      }
      router.push("/admin/sessions");
    } catch {
      toast.error(tAdmin("loginFailed"));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">{tAdmin("title")}</h1>
          <p className="text-sm text-muted-foreground">{tAdmin("subtitle")}</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="space-y-3">
            <Input placeholder={t("phone")} {...phoneForm.register("phone")} />
            {phoneForm.formState.errors.phone && (
              <p className="text-sm text-destructive">{t("invalidPhone")}</p>
            )}
            <Button type="submit" className="w-full" disabled={sendCode.isPending}>
              {sendCode.isPending ? t("sending") : t("sendCode")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <Input placeholder={t("code")} {...codeForm.register("code")} />
            {codeForm.formState.errors.code && (
              <p className="text-sm text-destructive">{t("invalidCode")}</p>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? t("loggingIn") : t("submit")}
            </Button>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("phone")}
              >
                {t("back")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={countdown > 0 || sendCode.isPending}
                onClick={handleResend}
              >
                {countdown > 0 ? t("resendCountdown", { seconds: countdown }) : t("resendCode")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
