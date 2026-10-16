"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Button, Form, Input, message } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  KeyRound,
  ListChecks,
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

function HeroBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="agent-login-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#agent-login-grid)" />
        </svg>
      </div>
      <div className="pointer-events-none absolute -right-20 top-1/5 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/5 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
    </>
  );
}

function DigitBoxes({
  value,
  length = 6,
  masked = false,
  autoFocus = false,
  onChange,
  onComplete,
}: {
  value: string;
  length?: number;
  masked?: boolean;
  autoFocus?: boolean;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const chars = value.padEnd(length, " ").split("");
    chars[index] = digit || " ";
    const next = chars.join("").replace(/ /g, "").slice(0, length);
    onChange(next);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
    if (next.length === length) {
      onComplete?.(next);
    }
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type={masked ? "password" : "text"}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, length);
            if (!pasted) return;
            onChange(pasted);
            if (pasted.length === length) onComplete?.(pasted);
            refs.current[Math.min(pasted.length, length - 1)]?.focus();
          }}
          className="h-12 w-10 rounded-xl border border-slate-200 bg-white text-center font-mono text-lg font-bold text-slate-900 outline-none transition focus:border-[#183E95] focus:ring-2 focus:ring-[#183E95]/20 sm:h-14 sm:w-11 sm:text-xl"
          autoFocus={autoFocus && i === 0}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
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
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
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

  const resolvePhone = (raw?: string) => {
    const p = digitsOnly(raw ?? phone ?? form.getFieldValue("phone") ?? "");
    return p;
  };

  const startSetup = async (p: string) => {
    const sent = await agentPinSetupSendOtp(p);
    setDebugCode(sent.debug_code || null);
    setCooldown(60);
    setOtp("");
    setNewPin("");
    setNewPinConfirm("");
    setMode("setup");
    message.success(sent.message);
  };

  const startReset = async (p?: string) => {
    const phoneValue = resolvePhone(p);
    if (phoneValue.length !== 8) {
      message.error("Эхлээд утасны дугаар оруулна уу");
      return;
    }
    setSubmitting(true);
    try {
      const status = await agentPinStatus(phoneValue);
      setPhone(status.phone);
      setDisplayName(status.display_name || "");
      if (status.needs_setup) {
        await startSetup(status.phone);
        return;
      }
      const sent = await agentPinResetSendOtp(status.phone);
      setDebugCode(sent.debug_code || null);
      setCooldown(60);
      setOtp("");
      setNewPin("");
      setNewPinConfirm("");
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

  const onLogin = async (values: { phone: string }) => {
    const phoneValue = resolvePhone(values.phone);
    if (phoneValue.length !== 8) {
      message.error("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }
    if (pin.length !== 6) {
      message.error("PIN код 6 оронтой байх ёстой");
      return;
    }
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
      await loginWithAgentPin(status.phone, pin);
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

  const onSetupOrReset = async () => {
    if (otp.length !== 6) {
      message.error("SMS код 6 оронтой байх ёстой");
      return;
    }
    if (newPin.length !== 6) {
      message.error("Шинэ PIN 6 оронтой байх ёстой");
      return;
    }
    if (newPin !== newPinConfirm) {
      message.error("PIN таарахгүй байна");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "setup") {
        await setupAgentPin({
          phone,
          code: otp,
          pin: newPin,
          pin_confirm: newPinConfirm,
        });
        message.success("PIN тохируулагдаж, нэвтэрлээ");
      } else {
        await resetAgentPin({
          phone,
          code: otp,
          pin: newPin,
          pin_confirm: newPinConfirm,
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
    setOtp("");
    setNewPin("");
    setNewPinConfirm("");
    setPin("");
    setDebugCode(null);
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
      : mode === "setup"
        ? `${phone} руу илгээсэн SMS кодоор шинэ PIN үүсгэнэ`
        : `${phone} руу илгээсэн SMS кодоор шинэ PIN тохируулна`;

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      <section className="relative flex min-h-[34vh] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#071a3d] via-[#183E95] to-[#2563eb] px-6 py-8 sm:px-10 lg:min-h-dvh lg:px-14 lg:py-12">
        <HeroBackdrop />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <EasyProLogoMark className="h-11 w-11 md:h-12 md:w-12" />
            <span className="text-2xl font-bold tracking-tight text-white">EasyPro</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 my-8 max-w-lg lg:my-0"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/95 backdrop-blur-md">
            <Shield className="h-3.5 w-3.5 text-amber-300" />
            Агент портал · PIN нэвтрэлт
          </p>
          <h1 className="mt-6 text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Заруудаа
            <br />
            <span className="text-amber-300">утас + PIN</span>-ээр
            <br />
            удирдаарай.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
            Баталгаажсан агент бүртгэлтэй утасны дугаар болон 6 оронтой PIN кодоор
            нэвтэрнэ. PIN мартсан бол SMS OTP-оор сэргээнэ.
          </p>
        </motion.div>

        <div className="relative z-10 hidden gap-3 lg:grid">
          {[
            {
              icon: Smartphone,
              title: "Утас + PIN",
              text: "OTP хэрэглэгчийн нэвтрэлтээс тусдаа, агент-only нэвтрэлт",
            },
            {
              icon: KeyRound,
              title: "PIN сэргээх",
              text: "Мартсан бол SMS кодоор шинэ PIN тохируулна",
            },
            {
              icon: ListChecks,
              title: "Өөрийн зарууд",
              text: "Нэвтэрсний дараа зарууд, профайл нэг дороос",
            },
            {
              icon: Building2,
              title: "Компани биш",
              text: "Компани админ → company.easypro.mn",
            },
          ].map(({ icon: Icon, title: t, text }, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05 }}
              className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon className="h-4 w-4 text-white" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{t}</span>
                <span className="mt-0.5 block text-xs leading-snug text-white/70">{text}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="flex min-h-[66vh] flex-col justify-center bg-[#f7f8fb] px-6 py-10 sm:px-12 lg:min-h-dvh lg:bg-white lg:px-14">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#183E95]/10 px-3 py-1 text-xs font-semibold text-[#183E95]">
              <KeyRound className="h-3.5 w-3.5" />
              agent.easypro.mn
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
                <p className="mt-2 text-slate-500">{subtitle}</p>
                {displayName && mode === "login" ? (
                  <p className="mt-1 text-sm font-medium text-slate-700">{displayName}</p>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {mode === "login" ? (
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
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
                  size="large"
                  prefix={<Phone className="h-4 w-4 text-slate-400" />}
                  placeholder="99112233"
                  inputMode="numeric"
                  maxLength={8}
                  className="!rounded-xl !border-slate-200 !py-2.5 !font-mono !text-lg !tracking-wider"
                  autoComplete="tel"
                  onChange={(e) => setPhone(digitsOnly(e.target.value))}
                />
              </Form.Item>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  PIN код
                </label>
                <DigitBoxes
                  value={pin}
                  masked
                  onChange={setPin}
                />
              </div>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={submitting}
                className="!h-12 !rounded-xl !text-base !font-semibold !shadow-md"
                icon={<ArrowRight className="h-4 w-4" />}
                iconPosition="end"
              >
                Нэвтрэх
              </Button>
            </Form>
          ) : (
            <div className="space-y-5">
              {debugCode ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                  Debug код: <span className="font-mono font-bold">{debugCode}</span>
                </p>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  SMS код
                </label>
                <DigitBoxes value={otp} autoFocus onChange={setOtp} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Шинэ PIN
                </label>
                <DigitBoxes value={newPin} masked onChange={setNewPin} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  PIN дахин
                </label>
                <DigitBoxes value={newPinConfirm} masked onChange={setNewPinConfirm} />
              </div>

              <Button
                type="primary"
                block
                size="large"
                loading={submitting}
                onClick={onSetupOrReset}
                className="!h-12 !rounded-xl !text-base !font-semibold !shadow-md"
              >
                {mode === "setup" ? "PIN тохируулж нэвтрэх" : "PIN шинэчлэх"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-[#183E95]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Нэвтрэх рүү
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || submitting}
                  onClick={resendOtp}
                  className="font-semibold text-[#183E95] disabled:text-slate-300"
                >
                  {cooldown > 0 ? `Дахин илгээх (${cooldown}с)` : "Дахин илгээх"}
                </button>
              </div>
            </div>
          )}

          {mode === "login" ? (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-center text-sm text-slate-500">
                PIN мартсан уу?
              </p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => startReset()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#183E95] transition hover:border-[#183E95]/40 hover:bg-[#183E95]/5 disabled:opacity-60"
              >
                <Smartphone className="h-4 w-4" />
                SMS OTP-оор PIN сэргээх
              </button>
              <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
                Утасны дугаараа дээр оруулсны дараа дар. SMS код ирээд шинэ PIN
                тохируулна.
              </p>
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-slate-400">
            Хэрэглэгч OTP нэвтрэлт →{" "}
            <Link href="/login" className="font-medium text-[#183E95] hover:underline">
              easypro.mn/login
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function AgentPortalLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f7f8fb]" />}>
      <AgentLoginForm />
    </Suspense>
  );
}
