"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Form, Input, message } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Sparkles,
  User,
  UserRound,
  XCircle,
} from "lucide-react";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";
import { previewInviteCode } from "@/lib/api";
import { getPostAuthPath, getProfileSetupPath } from "@/lib/auth-routes";
import { useAuth } from "@/providers/AuthProvider";

type ProfileType = "owner" | "agent";

const PROFILE_OPTIONS = [
  {
    value: "owner" as const,
    title: "Хувь хүн",
    description: "Өөрийн байр, гэр, газрыг зарж / түрээслүүлнэ",
    icon: Home,
    benefit: "Шууд зар нэмнэ",
  },
  {
    value: "agent" as const,
    title: "Агент",
    description: "Компанийн урилгын кодоор багтаа нэгдэнэ",
    icon: UserRound,
    benefit: "Компанитай холбогдоно",
  },
];

function HeroBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="profile-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M 56 0 L 0 0 0 56" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profile-grid)" />
        </svg>
      </div>
      <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
    </>
  );
}

function ProfileSetupForm() {
  const { user, loading, updateProfile, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("invite");
  const isInviteFlow = Boolean(inviteFromUrl);
  const [profileType, setProfileType] = useState<ProfileType>("owner");
  const [submitting, setSubmitting] = useState(false);
  const [inviteOrg, setInviteOrg] = useState<string | null>(null);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [checkingInvite, setCheckingInvite] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const code = inviteFromUrl;
    if (code) {
      setProfileType("agent");
      form.setFieldsValue({ invite_code: code.toUpperCase() });
      void checkInvite(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteFromUrl, form]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/profile/setup");
      return;
    }
    if (user.profile_completed) {
      router.replace(getPostAuthPath(user));
    }
  }, [user, loading, router]);

  const checkInvite = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setInviteOrg(null);
      setInviteValid(null);
      return;
    }
    setCheckingInvite(true);
    try {
      const preview = await previewInviteCode(trimmed);
      setInviteValid(preview.is_valid);
      setInviteOrg(preview.is_valid ? preview.organization_name : null);
      if (!preview.is_valid) message.warning(preview.message);
    } catch {
      setInviteValid(false);
      setInviteOrg(null);
    } finally {
      setCheckingInvite(false);
    }
  };

  const onFinish = async (values: Record<string, string>) => {
    if (profileType === "agent" && inviteValid === false) {
      message.error("Хүчинтэй урилгын код оруулна уу");
      return;
    }
    setSubmitting(true);
    try {
      const me = await updateProfile(
        profileType === "owner"
          ? {
              profile_type: "owner",
              first_name: values.first_name,
              last_name: values.last_name || "",
              email: values.email || "",
            }
          : {
              profile_type: "agent",
              invite_code: values.invite_code,
              display_name: values.display_name,
              title: values.title || "",
              email: values.email || "",
              first_name: values.display_name,
            },
      );
      message.success(
        profileType === "agent"
          ? "Профайл илгээгдлээ — company admin зөвшөөрнө"
          : "Профайл хадгалагдлаа",
      );
      router.push(getPostAuthPath(me));
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: Record<string, string[] | string> } }).response?.data
          : undefined;
      const fieldMsg = data
        ? Object.values(data).find((v) => Array.isArray(v) && v[0])?.[0]
        : undefined;
      message.error(
        (typeof fieldMsg === "string" ? fieldMsg : undefined) ||
          (typeof data?.detail === "string" ? data.detail : undefined) ||
          "Хадгалахад алдаа гарлаа",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || user.profile_completed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#183E95]" />
      </div>
    );
  }

  const phoneLabel = user.phone || user.username;

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      <section className="relative flex min-h-[32vh] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a2558] via-[#183E95] to-[#1d4ed8] px-6 py-8 sm:px-10 lg:min-h-dvh lg:px-14 lg:py-12">
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
          className="relative z-10 my-8 max-w-md lg:my-0"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/95 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Сүүлийн алхам
          </p>
          <h1 className="mt-6 text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl">
            Профайлаа
            <br />
            <span className="text-amber-300">бүрэн болгоорой</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            {isInviteFlow
              ? "Утас баталгаажсан. Компанийн урилгаар агент профайлаа бөглөөд шууд профайл руугаа орно."
              : "Утас баталгаажсан. Одоо хувь хүн эсвэл агент эсэхээ сонгоод үндсэн мэдээллээ оруулахад л бэлэн болно."}
          </p>
        </motion.div>

        <div className="relative z-10 space-y-3">
          {[
            {
              step: "1",
              title: "Утас баталгаажсан",
              desc: phoneLabel,
              done: true,
            },
            {
              step: "2",
              title: "Профайлын төрөл",
              desc: profileType === "owner" ? "Хувь хүн" : "Агент",
              done: false,
              active: true,
            },
            {
              step: "3",
              title: profileType === "owner" ? "Зар нэмэх" : "Компани зөвшөөрнө",
              desc:
                profileType === "owner"
                  ? "Шууд зар нийтэлнэ"
                  : "Admin зөвшөөрсний дараа идэвхжинэ",
              done: false,
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md ${
                item.done
                  ? "border-emerald-400/30 bg-emerald-500/15"
                  : item.active
                    ? "border-white/25 bg-white/15"
                    : "border-white/10 bg-white/5"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  item.done
                    ? "bg-emerald-400 text-emerald-950"
                    : item.active
                      ? "bg-white text-[#183E95]"
                      : "bg-white/20 text-white/70"
                }`}
              >
                {item.done ? <CheckCircle2 className="h-4 w-4" /> : item.step}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="truncate text-xs text-white/70">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="flex min-h-[68vh] flex-col justify-center bg-white px-6 py-10 sm:px-12 lg:min-h-dvh lg:overflow-y-auto lg:px-14 xl:px-16">
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="mx-auto w-full max-w-[460px] py-2"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Phone className="h-3.5 w-3.5" />
              {phoneLabel}
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-[#183E95]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Гарах
            </button>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isInviteFlow ? "Агент профайл" : "Таны профайл"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isInviteFlow
              ? "Урилгын кодоо баталгаажуулж, агентын мэдээллээ бөглөнө үү"
              : "Төрлөө сонгоод мэдээллээ бөглөнө үү — дараа нь өөрчилж болно"}
          </p>

          {!isInviteFlow ? (
          <div className="mt-6">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Би хэн бэ?
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {PROFILE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = profileType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setProfileType(opt.value);
                      if (opt.value === "owner") {
                        setInviteValid(null);
                        setInviteOrg(null);
                      }
                    }}
                    className={`relative flex flex-col rounded-2xl border px-3.5 py-3.5 text-left transition ${
                      active
                        ? "border-[#183E95] bg-[#183E95]/[0.04] shadow-[0_0_0_3px_rgba(24,62,149,0.12)]"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    {active ? (
                      <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-[#183E95]" />
                    ) : null}
                    <span
                      className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${
                        active ? "bg-[#183E95] text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-slate-900">{opt.title}</span>
                    <span className="mt-1 text-xs leading-snug text-slate-500">{opt.description}</span>
                    <span
                      className={`mt-2 text-[11px] font-semibold ${
                        active ? "text-[#183E95]" : "text-slate-400"
                      }`}
                    >
                      {opt.benefit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          ) : null}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            size="large"
            className="mt-6 [&_.ant-form-item]:mb-4 [&_.ant-form-item-label]:pb-1"
          >
            <AnimatePresence mode="wait">
              {profileType === "agent" ? (
                <motion.div
                  key="agent-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      <Building2 className="h-3.5 w-3.5" />
                      Компанийн урилга
                    </p>
                    <Form.Item
                      name="invite_code"
                      label={<span className="font-medium text-slate-700">Урилгын код</span>}
                      rules={[{ required: true, message: "Урилгын код оруулна уу" }]}
                      className="!mb-3"
                    >
                      <Input
                        prefix={<KeyRound className="h-4 w-4 text-slate-400" />}
                        placeholder="REMX-XXXXXX"
                        className="!rounded-xl !border-slate-200 !py-2.5 !font-mono !uppercase"
                        onBlur={(e) => checkInvite(e.target.value)}
                        onChange={(e) => {
                          form.setFieldValue("invite_code", e.target.value.toUpperCase());
                          setInviteValid(null);
                          setInviteOrg(null);
                        }}
                      />
                    </Form.Item>
                    {checkingInvite ? (
                      <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Код шалгаж байна…
                      </p>
                    ) : inviteValid === true && inviteOrg ? (
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {inviteOrg}
                      </p>
                    ) : inviteValid === false ? (
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                        <XCircle className="h-3.5 w-3.5" />
                        Код хүчингүй эсвэл дууссан
                      </p>
                    ) : (
                      <p className="mb-3 text-xs text-slate-500">
                        Company admin-аас авсан кодоо оруулна уу
                      </p>
                    )}
                    <Form.Item
                      name="display_name"
                      label={<span className="font-medium text-slate-700">Агентын нэр</span>}
                      rules={[{ required: true, message: "Нэр оруулна уу" }]}
                      className="!mb-3"
                    >
                      <Input
                        prefix={<User className="h-4 w-4 text-slate-400" />}
                        placeholder="Ankhbileg.D"
                        className="!rounded-xl !border-slate-200 !py-2.5"
                      />
                    </Form.Item>
                    <Form.Item
                      name="title"
                      label={<span className="font-medium text-slate-700">Цол / зэрэглэл</span>}
                      className="!mb-0"
                    >
                      <Input
                        placeholder="Platinum agent"
                        className="!rounded-xl !border-slate-200 !py-2.5"
                      />
                    </Form.Item>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="owner-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Хувийн мэдээлэл
                  </p>
                  <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
                    <Form.Item
                      name="first_name"
                      label={<span className="font-medium text-slate-700">Нэр</span>}
                      rules={[{ required: true, message: "Нэр оруулна уу" }]}
                    >
                      <Input
                        prefix={<User className="h-4 w-4 text-slate-400" />}
                        placeholder="Бат"
                        className="!rounded-xl !border-slate-200 !py-2.5"
                      />
                    </Form.Item>
                    <Form.Item
                      name="last_name"
                      label={<span className="font-medium text-slate-700">Овог</span>}
                    >
                      <Input
                        placeholder="Болд"
                        className="!rounded-xl !border-slate-200 !py-2.5"
                      />
                    </Form.Item>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Form.Item
              name="email"
              label={<span className="font-medium text-slate-700">И-мэйл (сонголттой)</span>}
              rules={[{ type: "email", message: "Буруу и-мэйл" }]}
            >
              <Input
                prefix={<Mail className="h-4 w-4 text-slate-400" />}
                type="email"
                placeholder="you@email.com"
                className="!rounded-xl !border-slate-200 !py-2.5"
              />
            </Form.Item>

            <motion.p
              key={profileType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex items-start gap-2 rounded-xl bg-[#183E95]/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-slate-600"
            >
              <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#183E95]" />
              {profileType === "owner"
                ? "Дараагийн алхам: зар нэмэх хуудас руу шилжинэ."
                : "Company admin зөвшөөрсний дараа зар нэмэх боломжтой болно."}
            </motion.p>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              className="!h-12 !rounded-xl !text-base !font-semibold !shadow-lg"
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="end"
            >
              {profileType === "owner" ? "Дуусгаад зар нэмэх" : "Профайл илгээх"}
            </Button>
          </Form>
        </motion.div>
      </section>
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f9]">
          <Loader2 className="h-8 w-8 animate-spin text-[#183E95]" />
        </div>
      }
    >
      <ProfileSetupForm />
    </Suspense>
  );
}
