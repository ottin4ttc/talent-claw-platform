"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "@/i18n/routing";
import { useLogin, useSendCode } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const phoneSchema = z.object({
  phone: z.string().regex(/^1\d{10}$/),
});

const loginSchema = z.object({
  code: z.string().length(6),
});

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");

  const sendCode = useSendCode();
  const login = useLogin();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema) });
  const codeForm = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

  const handleSendCode = phoneForm.handleSubmit(async (data) => {
    await sendCode.mutateAsync({ phone: data.phone });
    setPhone(data.phone);
    setStep("code");
  });

  const handleLogin = codeForm.handleSubmit(async (data) => {
    await login.mutateAsync({ phone, code: data.code });
    router.push("/dashboard");
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("loginSubtitle")}</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="space-y-3">
            <Input placeholder={t("phone")} {...phoneForm.register("phone")} />
            {phoneForm.formState.errors.phone && (
              <p className="text-sm text-destructive">{t("invalidPhone")}</p>
            )}
            <Button type="submit" className="w-full">{t("sendCode")}</Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <Input placeholder={t("code")} {...codeForm.register("code")} />
            {codeForm.formState.errors.code && (
              <p className="text-sm text-destructive">{t("invalidCode")}</p>
            )}
            <Button type="submit" className="w-full">{t("submit")}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
