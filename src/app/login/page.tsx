"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button, Form, Input, message } from "antd";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Home,
  KeyRound,
  Phone,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";
import { SiteIntroText } from "@/components/layout/SiteIntroText";
import { sendOtp } from "@/lib/api";
import { getPostAuthPath, getProfileSetupPath } from "@/lib/auth-routes";
import { getAgentPortalUrl, getCompanyPortalUrl } from "@/lib/portals";
import { useAuth } from "@/providers/AuthProvider";

function HeroBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M 56 0 L 0 0 0 56" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
        </svg>
      </div>
      <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
    </>
  );
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { loginWithOtp, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const nextPath =
    searchParams.get("next") ||
    (invite ? getProfileSetupPath(invite) : "/");

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [form] = Form.useForm();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (!loading && user) {
      if (user.profile_completed === false) {
        router.replace(getProfileSetupPath(invite));
      } else {
        const dest = getPostAuthPath(user, { invite });
        if (dest.startsWith("http")) {
          window.location.replace(dest);
        } else {
          router.replace(dest);
        }
      }
    }
  }, [loading, user, router, nextPath, invite]);

  const handleSend = async (phoneValue?: string) => {
    const p = digitsOnly(phoneValue ?? phone);
    if (p.length !== 8) {
      message.error("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }
    setSending(true);
    try {
      const res = await sendOtp(p);
      setPhone(p);
      setStep("otp");
      setCode("");
      setCooldown(60);
      setDebugCode(res.debug_code || null);
      message.success(res.sms_sent ? "SMS код илгээлээ" : "Код үүсгэлээ (debug)");
      if (res.debug_code) {
        message.info(`Debug код: ${res.debug_code}`, 8);
      }
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string; phone?: string; retry_after?: number } } })
              .response?.data
          : undefined;
      if (data?.retry_after) setCooldown(data.retry_after);
      message.error(data?.detail || data?.phone || "SMS илгээхэд алдаа гарлаа");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const c = (otpCode ?? code).replace(/\D/g, "");
    if (c.length !== 6) {
      message.error("6 оронтой код оруулна уу");
      return;
    }
    setVerifying(true);
    try {
      const me = await loginWithOtp(phone, c);
      message.success("Амжилттай нэвтэрлээ");
      if (!me.profile_completed) {
        router.push(getProfileSetupPath(invite));
      } else {
        const dest = getPostAuthPath(me, { invite });
        if (dest.startsWith("http")) {
          window.location.assign(dest);
        } else {
          router.push(dest);
        }
      }
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string; code?: string } } }).response?.data
          : undefined;
      message.error(data?.detail || data?.code || "Код буруу байна");
    } finally {
      setVerifying(false);
    }
  };

  const onOtpDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const chars = code.padEnd(6, " ").split("");
    chars[index] = digit || " ";
    const next = chars.join("").replace(/ /g, "").slice(0, 6);
    setCode(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (next.length === 6) {
      void handleVerify(next);
    }
  };

  const onOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  if (!loading && user) {
    return null;
  }

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      <section className="relative flex min-h-[36vh] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a2558] via-[#183E95] to-[#1d4ed8] px-6 py-8 sm:px-10 lg:min-h-dvh lg:px-14 lg:py-12">
        <HeroBackdrop />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <EasyProLogoMark className="h-11 w-11 md:h-12 md:w-12" />
            <span className="text-2xl font-bold tracking-tight text-white">EasyPro</span>
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 my-8 max-w-xl lg:my-0"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/95 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Монголын үл хөдлөх хөрөнгийн платформ
          </p>
          <h1 className="mt-6 text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
            Зар нийтлэ.
            <br />
            <span className="text-amber-300">Худалдан авагчдаа</span>
            <br />
            хүрээрэй.
          </h1>
          <SiteIntroText
            className="mt-5 max-w-lg space-y-4"
            paragraphClassName="text-base leading-relaxed text-white/80"
          />
        </motion.div>
        <div className="relative z-10 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-1">
          {[
            {
              icon: Home,
              title: "Зар нийтлэх",
              text: "Зураг, газрын зураг, дэлгэрэнгүй мэдээллээр мэргэжлийн зар гаргана",
            },
            {
              icon: Search,
              title: "Хурдан хайлт",
              text: "Дүүрэг, үнэ, өрөө, байршлын шүүлтүүрээр хэрэгтэй зарыг олно",
            },
            {
              icon: Users,
              title: "Агент & компани",
              text: "Урилгын кодоор багтаа нэгдэж, заруудаа хамт удирдана",
            },
            {
              icon: BadgeCheck,
              title: "Ил тод мэдээлэл",
              text: "Баталгаажсан профайл, ойролцоох байршил, шууд холбоо барих",
            },
          ].map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur-md"
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon className="h-5 w-5 text-white" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-white/75">{text}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="flex min-h-[64vh] flex-col justify-center bg-white px-6 py-10 sm:px-12 lg:min-h-dvh lg:px-14">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {step === "phone" ? "Нэвтрэх / Бүртгүүлэх" : "Код оруулах"}
            </h2>
            <p className="mt-2 text-slate-500">
              {step === "phone"
                ? "Утасны дугаараа оруулна уу"
                : `${phone} дугаар руу илгээсэн 6 оронтой код`}
            </p>
          </div>

          {step === "phone" ? (
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={(v) => handleSend(v.phone)}
              initialValues={{ phone }}
            >
              <Form.Item
                name="phone"
                label={<span className="font-medium text-slate-700">Утасны дугаар</span>}
                rules={[
                  { required: true, message: "Утас оруулна уу" },
                  {
                    pattern: /^\d{8}$/,
                    message: "Яг 8 оронтой тоо оруулна уу",
                  },
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
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={sending}
                className="!mt-2 !h-12 !rounded-xl !text-base !font-semibold !shadow-lg"
                icon={<ArrowRight className="h-4 w-4" />}
                iconPosition="end"
              >
                Код авах
              </Button>
            </Form>
          ) : (
            <div>
              <div className="mb-6 flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i] || ""}
                    onChange={(e) => onOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => onOtpKeyDown(i, e)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      if (!pasted) return;
                      setCode(pasted);
                      if (pasted.length === 6) void handleVerify(pasted);
                    }}
                    className="h-14 w-11 rounded-xl border border-slate-200 bg-white text-center font-mono text-xl font-bold text-slate-900 outline-none transition focus:border-[#183E95] focus:ring-2 focus:ring-[#183E95]/20 sm:w-12"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {debugCode ? (
                <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                  Debug код: <span className="font-mono font-bold">{debugCode}</span>
                </p>
              ) : null}

              <Button
                type="primary"
                block
                size="large"
                loading={verifying}
                onClick={() => handleVerify()}
                className="!h-12 !rounded-xl !text-base !font-semibold !shadow-lg"
              >
                Баталгаажуулах
              </Button>

              <div className="mt-5 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setCode("");
                    setDebugCode(null);
                  }}
                  className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-[#183E95]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Дугаар солих
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || sending}
                  onClick={() => handleSend(phone)}
                  className="font-semibold text-[#183E95] disabled:text-slate-300"
                >
                  {cooldown > 0 ? `Дахин илгээх (${cooldown}с)` : "Дахин илгээх"}
                </button>
              </div>
            </div>
          )}

          <p className="mt-8 text-center">
            <Link href="/properties" className="text-sm text-slate-400 hover:text-[#183E95]">
              Нэвтрэхгүйгээр зар хайх →
            </Link>
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <a
              href={getAgentPortalUrl("/login")}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center transition hover:border-[#183E95]/40 hover:bg-[#183E95]/5 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#183E95]/10 text-[#183E95] transition group-hover:bg-[#183E95] group-hover:text-white">
                <KeyRound className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-900">Агентаар нэвтрэх</span>
            </a>
            <a
              href={getCompanyPortalUrl("/login")}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center transition hover:border-[#183E95]/40 hover:bg-[#183E95]/5 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#183E95]/10 text-[#183E95] transition group-hover:bg-[#183E95] group-hover:text-white">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-900">Компаниар нэвтрэх</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
