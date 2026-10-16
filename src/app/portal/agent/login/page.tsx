"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Form, Input, message } from "antd";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Phone,
  Shield,
  Smartphone,
} from "lucide-react";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";
import {
  agentPinResetSendOtp,
  agentPinSetupSendOtp,
  agentPinStatus,
} from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

type Mode = "login" | "setup" | "reset";

function digitsOnly(value: string, max = 8) {
  return value.replace(/\D/g, "").slice(0, max);
}

function AgentLoginForm() {
  const {
    loginWithAgentPin,
    setupAgentPin,
    resetAgentPin,
    user,
    loading,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/portal/agent";

  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    if (loading) return;
    if (user?.agent_profile?.agent_type === "individual") {
      const target = nextPath.startsWith("/portal/agent") ? nextPath : "/portal/agent";
      router.replace(target === "/portal/agent/login" ? "/portal/agent" : target);
    }
  }, [user, loading, router, nextPath]);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const goPortal = () => {
    const target = nextPath.startsWith("/portal/agent") ? nextPath : "/portal/agent";
    router.push(target === "/portal/agent/login" ? "/portal/agent" : target);
  };

  const resolvePhone = (raw?: string) =>
    digitsOnly(raw ?? phone ?? form.getFieldValue("phone") ?? "");

  const startSetup = async (p: string) => {
    const sent = await agentPinSetupSendOtp(p);
    setDebugCode(sent.debug_code || null);
    setCooldown(60);
    form.resetFields(["code", "pin", "pin_confirm"]);
    setMode("setup");
    message.success(sent.message);
  };

  const startReset = async () => {
    const phoneValue = resolvePhone();
    if (phoneValue.length !== 8) {
      message.error("Эхлээд утасны дугаар оруулна уу");
      return;
    }
    setSubmitting(true);
    try {
      const status = await agentPinStatus(phoneValue);
      setPhone(status.phone);
      setDisplayName(status.display_name || "");
      form.setFieldsValue({ phone: status.phone });
      if (status.needs_setup) {
        await startSetup(status.phone);
        return;
      }
      const sent = await agentPinResetSendOtp(status.phone);
      setDebugCode(sent.debug_code || null);
      setCooldown(60);
      form.resetFields(["code", "pin", "pin_confirm"]);
      setMode("reset");
      message.success(sent.message);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "SMS илгээхэд алдаа";
      message.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0 || !phone) return;
    setSubmitting(true);
    try {
      const sent =
        mode === "setup"
          ? await agentPinSetupSendOtp(phone)
          : await agentPinResetSendOtp(phone);
      setDebugCode(sent.debug_code || null);
      setCooldown(60);
      message.success(sent.message);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { detail?: string; retry_after?: number } } })
        ?.response?.data;
      if (data?.retry_after) setCooldown(data.retry_after);
      message.error(data?.detail || "Дахин илгээхэд алдаа");
    } finally {
      setSubmitting(false);
    }
  };

  const onLogin = async (values: { phone: string; pin: string }) => {
    const phoneValue = resolvePhone(values.phone);
    setSubmitting(true);
    try {
      const status = await agentPinStatus(phoneValue);
      setPhone(status.phone);
      setDisplayName(status.display_name || "");
      if (status.needs_setup) {
        message.info("PIN тохируулаагүй байна. SMS-ээр тохируулна уу.");
        await startSetup(status.phone);
        return;
      }
      await loginWithAgentPin(status.phone, values.pin);
      message.success("Амжилттай нэвтэрлээ");
      goPortal();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Нэвтрэх мэдээлэл буруу байна";
      message.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const onSetupOrReset = async (values: {
    code: string;
    pin: string;
    pin_confirm: string;
  }) => {
    setSubmitting(true);
    try {
      if (mode === "setup") {
        await setupAgentPin({
          phone,
          code: values.code,
          pin: values.pin,
          pin_confirm: values.pin_confirm,
        });
        message.success("PIN тохируулагдаж, нэвтэрлээ");
      } else {
        await resetAgentPin({
          phone,
          code: values.code,
          pin: values.pin,
          pin_confirm: values.pin_confirm,
        });
        message.success("PIN шинэчлэгдэж, нэвтэрлээ");
      }
      goPortal();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Алдаа гарлаа";
      message.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const backToLogin = () => {
    setMode("login");
    setDebugCode(null);
    form.resetFields(["code", "pin", "pin_confirm"]);
  };

  if (!loading && user?.agent_profile?.agent_type === "individual") {
    return null;
  }

  const title =
    mode === "login"
      ? "Агент нэвтрэх"
      : mode === "setup"
        ? "PIN тохируулах"
        : "PIN сэргээх";
  const subtitle =
    mode === "login"
      ? "Утасны дугаар болон 6 оронтой PIN код"
      : `${phone} руу илгээсэн SMS кодоор шинэ PIN тохируулна`;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f9] px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <EasyProLogoMark className="h-10 w-10" />
            <span className="text-xl font-bold text-slate-900">EasyPro</span>
          </Link>
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#183E95]/10 px-3 py-1 text-xs font-semibold text-[#183E95]">
            <Shield className="h-3.5 w-3.5" />
            Агент портал
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          {displayName && mode === "login" ? (
            <p className="mt-1 text-sm font-medium text-slate-700">{displayName}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          {mode === "login" ? (
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              size="large"
              onFinish={onLogin}
              initialValues={{ phone }}
            >
              <Form.Item
                name="phone"
                label={<span className="font-medium text-slate-700">Утасны дугаар</span>}
                rules={[
                  { required: true, message: "Утас оруулна уу" },
                  { pattern: /^\d{8}$/, message: "Яг 8 оронтой тоо" },
                ]}
                getValueFromEvent={(e) => digitsOnly(e.target.value)}
              >
                <Input
                  prefix={<Phone className="h-4 w-4 text-slate-400" />}
                  placeholder="99112233"
                  inputMode="numeric"
                  maxLength={8}
                  className="!rounded-xl !border-slate-200 !font-mono !tracking-wider"
                  autoComplete="tel"
                  onChange={(e) => setPhone(digitsOnly(e.target.value))}
                />
              </Form.Item>
              <Form.Item
                name="pin"
                label={<span className="font-medium text-slate-700">PIN код</span>}
                rules={[
                  { required: true, message: "PIN оруулна уу" },
                  { pattern: /^\d{6}$/, message: "6 оронтой тоо" },
                ]}
                getValueFromEvent={(e) => digitsOnly(e.target.value, 6)}
              >
                <Input.Password
                  prefix={<KeyRound className="h-4 w-4 text-slate-400" />}
                  placeholder="••••••"
                  maxLength={6}
                  inputMode="numeric"
                  className="!rounded-xl !border-slate-200 !font-mono !tracking-widest"
                  autoComplete="current-password"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="!mt-1 !h-12 !rounded-xl !font-semibold"
                icon={<ArrowRight className="h-4 w-4" />}
                iconPosition="end"
              >
                Нэвтрэх
              </Button>
            </Form>
          ) : (
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              size="large"
              onFinish={onSetupOrReset}
            >
              {debugCode ? (
                <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                  Debug код: <span className="font-mono font-bold">{debugCode}</span>
                </p>
              ) : null}
              <Form.Item
                name="code"
                label={<span className="font-medium text-slate-700">SMS код</span>}
                rules={[
                  { required: true, message: "Код оруулна уу" },
                  { pattern: /^\d{6}$/, message: "6 оронтой тоо" },
                ]}
                getValueFromEvent={(e) => digitsOnly(e.target.value, 6)}
              >
                <Input
                  prefix={<Smartphone className="h-4 w-4 text-slate-400" />}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  className="!rounded-xl !border-slate-200 !font-mono !tracking-widest"
                />
              </Form.Item>
              <Form.Item
                name="pin"
                label={<span className="font-medium text-slate-700">Шинэ PIN</span>}
                rules={[
                  { required: true, message: "PIN оруулна уу" },
                  { pattern: /^\d{6}$/, message: "6 оронтой тоо" },
                ]}
                getValueFromEvent={(e) => digitsOnly(e.target.value, 6)}
              >
                <Input.Password
                  prefix={<KeyRound className="h-4 w-4 text-slate-400" />}
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="••••••"
                  className="!rounded-xl !border-slate-200 !font-mono !tracking-widest"
                />
              </Form.Item>
              <Form.Item
                name="pin_confirm"
                label={<span className="font-medium text-slate-700">PIN дахин</span>}
                dependencies={["pin"]}
                rules={[
                  { required: true, message: "Дахин оруулна уу" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("pin") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("PIN таарахгүй байна"));
                    },
                  }),
                ]}
                getValueFromEvent={(e) => digitsOnly(e.target.value, 6)}
              >
                <Input.Password
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="••••••"
                  className="!rounded-xl !border-slate-200 !font-mono !tracking-widest"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="!h-12 !rounded-xl !font-semibold"
              >
                {mode === "setup" ? "PIN тохируулах" : "PIN шинэчлэх"}
              </Button>
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-[#183E95]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Буцах
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || submitting}
                  onClick={() => void resendOtp()}
                  className="font-semibold text-[#183E95] disabled:text-slate-300"
                >
                  {cooldown > 0 ? `Дахин (${cooldown}с)` : "Дахин илгээх"}
                </button>
              </div>
            </Form>
          )}

          {mode === "login" ? (
            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void startReset()}
                className="text-sm font-medium text-[#183E95] hover:underline disabled:opacity-60"
              >
                PIN мартсан уу? SMS-ээр сэргээх
              </button>
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Хэрэглэгч үү?{" "}
          <Link href="/login" className="font-semibold text-[#183E95] hover:underline">
            Утсаар нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AgentPortalLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f4f6f9]" />}>
      <AgentLoginForm />
    </Suspense>
  );
}
