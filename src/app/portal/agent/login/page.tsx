"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Form, Input, message } from "antd";
import { ArrowRight, KeyRound, Phone, Shield } from "lucide-react";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";
import {
  agentPinResetSendOtp,
  agentPinSetupSendOtp,
  agentPinStatus,
} from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

type Step = "phone" | "pin" | "setup_otp" | "setup_pin" | "reset_otp" | "reset_pin";

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
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    if (loading) return;
    if (user?.agent_profile?.agent_type === "individual") {
      const target = nextPath.startsWith("/portal/agent") ? nextPath : "/portal/agent";
      router.replace(target === "/portal/agent/login" ? "/portal/agent" : target);
    }
  }, [user, loading, router, nextPath]);

  const goPortal = () => {
    const target = nextPath.startsWith("/portal/agent") ? nextPath : "/portal/agent";
    router.push(target === "/portal/agent/login" ? "/portal/agent" : target);
  };

  const onPhoneContinue = async (values: { phone: string }) => {
    setSubmitting(true);
    try {
      const status = await agentPinStatus(values.phone);
      setPhone(status.phone);
      setDisplayName(status.display_name || "");
      if (status.needs_setup) {
        const sent = await agentPinSetupSendOtp(status.phone);
        setDebugCode(sent.debug_code || null);
        message.success(sent.message);
        setStep("setup_otp");
      } else {
        setStep("pin");
      }
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Агент олдсонгүй";
      message.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const onPinLogin = async (values: { pin: string }) => {
    setSubmitting(true);
    try {
      await loginWithAgentPin(phone, values.pin);
      message.success("Амжилттай нэвтэрлээ");
      goPortal();
    } catch {
      message.error("PIN буруу байна");
    } finally {
      setSubmitting(false);
    }
  };

  const onSetupVerify = async (values: {
    code: string;
    pin: string;
    pin_confirm: string;
  }) => {
    setSubmitting(true);
    try {
      await setupAgentPin({
        phone,
        code: values.code,
        pin: values.pin,
        pin_confirm: values.pin_confirm,
      });
      message.success("PIN тохируулагдаж, нэвтэрлээ");
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

  const startReset = async () => {
    setSubmitting(true);
    try {
      const sent = await agentPinResetSendOtp(phone);
      setDebugCode(sent.debug_code || null);
      message.success(sent.message);
      setStep("reset_otp");
      form.resetFields(["code", "pin", "pin_confirm"]);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "SMS илгээхэд алдаа";
      message.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const onResetVerify = async (values: {
    code: string;
    pin: string;
    pin_confirm: string;
  }) => {
    setSubmitting(true);
    try {
      await resetAgentPin({
        phone,
        code: values.code,
        pin: values.pin,
        pin_confirm: values.pin_confirm,
      });
      message.success("PIN шинэчлэгдэж, нэвтэрлээ");
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

  if (!loading && user?.agent_profile?.agent_type === "individual") {
    return null;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f9] px-4 py-10">
      <div className="w-full max-w-[420px]">
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
            Агент нэвтрэх
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Утасны дугаар болон 6 оронтой PIN код
          </p>
          {displayName ? (
            <p className="mt-1 text-sm font-medium text-slate-700">{displayName}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          {step === "phone" && (
            <Form form={form} layout="vertical" size="large" onFinish={onPhoneContinue}>
              <Form.Item
                name="phone"
                label="Утасны дугаар"
                rules={[
                  { required: true, message: "Утас оруулна уу" },
                  { pattern: /^\d{8}$/, message: "8 оронтой тоо" },
                ]}
              >
                <Input prefix={<Phone className="h-4 w-4 text-slate-400" />} placeholder="99112233" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                icon={<ArrowRight className="h-4 w-4" />}
                className="!h-11 !rounded-xl"
              >
                Үргэлжлүүлэх
              </Button>
            </Form>
          )}

          {step === "pin" && (
            <Form form={form} layout="vertical" size="large" onFinish={onPinLogin}>
              <p className="mb-4 text-sm text-slate-500">
                Утас: <span className="font-semibold text-slate-800">{phone}</span>
              </p>
              <Form.Item
                name="pin"
                label="PIN код"
                rules={[
                  { required: true, message: "PIN оруулна уу" },
                  { pattern: /^\d{6}$/, message: "6 оронтой тоо" },
                ]}
              >
                <Input.Password
                  prefix={<KeyRound className="h-4 w-4 text-slate-400" />}
                  maxLength={6}
                  placeholder="••••••"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="!h-11 !rounded-xl"
              >
                Нэвтрэх
              </Button>
              <button
                type="button"
                onClick={startReset}
                className="mt-4 w-full text-center text-sm font-medium text-[#183E95] hover:underline"
              >
                PIN мартсан уу?
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  form.resetFields();
                }}
                className="mt-2 w-full text-center text-sm text-slate-500 hover:underline"
              >
                Өөр утас
              </button>
            </Form>
          )}

          {(step === "setup_otp" || step === "setup_pin") && (
            <Form form={form} layout="vertical" size="large" onFinish={onSetupVerify}>
              <p className="mb-3 text-sm text-slate-500">
                SMS-ээр ирсэн кодоор PIN үүсгэнэ. Утас:{" "}
                <span className="font-semibold text-slate-800">{phone}</span>
              </p>
              {debugCode ? (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  DEBUG код: {debugCode}
                </p>
              ) : null}
              <Form.Item
                name="code"
                label="SMS код"
                rules={[{ required: true }, { pattern: /^\d{6}$/ }]}
              >
                <Input
                  maxLength={6}
                  placeholder="000000"
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </Form.Item>
              <Form.Item
                name="pin"
                label="Шинэ PIN (6 орон)"
                rules={[{ required: true }, { pattern: /^\d{6}$/ }]}
              >
                <Input.Password maxLength={6} placeholder="••••••" />
              </Form.Item>
              <Form.Item
                name="pin_confirm"
                label="PIN дахин"
                dependencies={["pin"]}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("pin") === value) return Promise.resolve();
                      return Promise.reject(new Error("PIN таарахгүй байна"));
                    },
                  }),
                ]}
              >
                <Input.Password maxLength={6} placeholder="••••••" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="!h-11 !rounded-xl"
              >
                PIN тохируулах
              </Button>
            </Form>
          )}

          {(step === "reset_otp" || step === "reset_pin") && (
            <Form form={form} layout="vertical" size="large" onFinish={onResetVerify}>
              <p className="mb-3 text-sm text-slate-500">
                SMS кодоор шинэ PIN тохируулна. Утас:{" "}
                <span className="font-semibold text-slate-800">{phone}</span>
              </p>
              {debugCode ? (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  DEBUG код: {debugCode}
                </p>
              ) : null}
              <Form.Item
                name="code"
                label="SMS код"
                initialValue={otpCode}
                rules={[{ required: true }, { pattern: /^\d{6}$/ }]}
              >
                <Input maxLength={6} placeholder="000000" />
              </Form.Item>
              <Form.Item
                name="pin"
                label="Шинэ PIN"
                rules={[{ required: true }, { pattern: /^\d{6}$/ }]}
              >
                <Input.Password maxLength={6} />
              </Form.Item>
              <Form.Item
                name="pin_confirm"
                label="PIN дахин"
                dependencies={["pin"]}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("pin") === value) return Promise.resolve();
                      return Promise.reject(new Error("PIN таарахгүй байна"));
                    },
                  }),
                ]}
              >
                <Input.Password maxLength={6} />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="!h-11 !rounded-xl"
              >
                Шинэчлэх
              </Button>
              <button
                type="button"
                onClick={() => setStep("pin")}
                className="mt-3 w-full text-center text-sm text-slate-500 hover:underline"
              >
                Буцах
              </button>
            </Form>
          )}
        </div>
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
