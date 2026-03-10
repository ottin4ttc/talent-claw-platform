"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useLogin, useSendCode } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { getToken } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

function maskPhone(phone: string) {
  if (phone.length !== 11) return phone;
  return phone.slice(0, 3) + " **** " + phone.slice(7);
}

export default function AdminLoginPage() {
  const t = useTranslations("login");
  const tAdmin = useTranslations("adminLogin");
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const user = useAuthStore((s) => s.user);

  const sendCode = useSendCode();
  const login = useLogin();

  useEffect(() => {
    if (getToken() && user?.role === "admin") {
      router.replace("/admin/sessions");
    }
  }, [user, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = useCallback(async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setPhoneError(true);
      return;
    }
    setPhoneError(false);
    try {
      await sendCode.mutateAsync({ phone });
      setStep("code");
      setOtp("");
      setCountdown(60);
    } catch {
      toast.error(tAdmin("sendCodeFailed"));
    }
  }, [phone, sendCode, tAdmin]);

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    try {
      await sendCode.mutateAsync({ phone });
      setCountdown(60);
      setOtp("");
    } catch {
      toast.error(tAdmin("sendCodeFailed"));
    }
  }, [countdown, phone, sendCode, tAdmin]);

  const handleLogin = useCallback(
    async (code: string) => {
      try {
        const resp = await login.mutateAsync({ phone, code });
        if (resp.user.role !== "admin") {
          toast.error(tAdmin("notAdmin"));
          setOtp("");
          return;
        }
        router.push("/admin/sessions");
      } catch {
        toast.error(tAdmin("loginFailed"));
        setOtp("");
      }
    },
    [phone, login, router, tAdmin]
  );

  const handleOtpChange = useCallback(
    (value: string) => {
      setOtp(value);
      if (value.length === 6) {
        handleLogin(value);
      }
    },
    [handleLogin]
  );

  const handleBack = useCallback(() => {
    setStep("phone");
    setOtp("");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        {step === "phone" ? (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">{tAdmin("title")}</h1>
              <p className="text-sm text-muted-foreground">{tAdmin("subtitle")}</p>
            </div>

            <div className="space-y-2">
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("phone")}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendCode();
                }}
                className="h-12 text-base"
              />
              {phoneError && (
                <p className="text-sm text-destructive">{t("invalidPhone")}</p>
              )}
            </div>

            <Button
              className="w-full h-12 text-base"
              disabled={sendCode.isPending}
              onClick={handleSendCode}
            >
              {sendCode.isPending ? t("sending") : t("sendCode")}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <button
                type="button"
                onClick={handleBack}
                className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </button>
              <h1 className="text-2xl font-bold">{t("enterCode")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("codeSentTo")}
              </p>
              <p className="font-mono text-base font-medium tracking-wider">
                {maskPhone(phone)}
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOtpChange}
                disabled={login.isPending}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {login.isPending && (
              <p className="text-center text-sm text-muted-foreground">{t("loggingIn")}</p>
            )}

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={countdown > 0 || sendCode.isPending}
                onClick={handleResend}
              >
                {countdown > 0
                  ? t("resendCountdown", { seconds: countdown })
                  : t("resendCode")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
