"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { Button, Form, Input, message } from "antd";
import {
  ArrowRight,
  Building2,
  LayoutDashboard,
  Phone,
  Shield,
  User,
  UserRound,
} from "lucide-react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { AuthLoadingScreen, useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/providers/AuthProvider";

function ProfilePageContent() {
  const { user, loading } = useRequireAuth("/login");
  const { updateProfile } = useAuth();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!user) return;
    form.setFieldsValue({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
    });
  }, [user, form]);

  if (loading || !user) {
    return <AuthLoadingScreen />;
  }

  const agent = user.agent_profile;
  const isIndividualAgent = agent?.agent_type === "individual";
  const roleLabel = user.is_staff
    ? "Системийн админ"
    : user.is_company_admin
      ? "Компанийн админ"
      : isIndividualAgent
        ? "Агент"
        : "Хувь хүн";

  const onFinish = async (values: { first_name: string; last_name: string; email: string }) => {
    try {
      await updateProfile({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
      });
      message.success("Профайл хадгалагдлаа");
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: Record<string, string | string[]> } }).response?.data
          : undefined;
      const firstError =
        data &&
        Object.values(data)
          .flat()
          .find((m) => typeof m === "string");
      message.error(typeof firstError === "string" ? firstError : "Хадгалахад алдаа гарлаа");
    }
  };

  return (
    <div className="bg-[#f4f6f9]">
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#183E95] to-[#1d4ed8] px-6 py-8 text-white md:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-2 ring-white/25">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80">{roleLabel}</p>
                <h1 className="truncate text-2xl font-bold tracking-tight">
                  {user.display_name || user.first_name || user.username}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                  <Phone className="h-3.5 w-3.5" />
                  {user.phone || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6 md:p-8">
            <section>
              <h2 className="text-lg font-bold text-slate-900">Хувийн мэдээлэл</h2>
              <p className="mt-1 text-sm text-slate-500">Нэр, имэйлээ шинэчилнэ үү</p>
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                className="mt-5"
                onFinish={onFinish}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Form.Item
                    name="first_name"
                    label="Нэр"
                    rules={[{ required: true, message: "Нэр оруулна уу" }]}
                  >
                    <Input size="large" className="!rounded-xl" />
                  </Form.Item>
                  <Form.Item name="last_name" label="Овог">
                    <Input size="large" className="!rounded-xl" />
                  </Form.Item>
                </div>
                <Form.Item name="email" label="Имэйл">
                  <Input size="large" type="email" className="!rounded-xl" />
                </Form.Item>
                <Form.Item label="Утас">
                  <Input
                    size="large"
                    disabled
                    value={user.phone}
                    className="!rounded-xl !bg-slate-50"
                  />
                  <p className="mt-1 text-xs text-slate-400">OTP нэвтрэлтээр баталгаажсан</p>
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  className="!h-11 !rounded-xl !font-semibold"
                >
                  Хадгалах
                </Button>
              </Form>
            </section>

            {agent ? (
              <section className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  {agent.agent_type === "organization" ? (
                    <Building2 className="h-5 w-5 text-[#183E95]" />
                  ) : (
                    <UserRound className="h-5 w-5 text-[#183E95]" />
                  )}
                  Агент профайл
                </h2>
                <dl className="mt-4 space-y-2 text-sm">
                  {agent.display_name ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Нэршил</dt>
                      <dd className="font-medium text-slate-900">{agent.display_name}</dd>
                    </div>
                  ) : null}
                  {agent.organization_name ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Компани</dt>
                      <dd className="font-medium text-slate-900">{agent.organization_name}</dd>
                    </div>
                  ) : null}
                  {agent.membership_status_display ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Гишүүнчлэл</dt>
                      <dd className="font-medium text-slate-900">{agent.membership_status_display}</dd>
                    </div>
                  ) : null}
                </dl>
                {isIndividualAgent && agent.id ? (
                  <Link
                    href={`/agents/${agent.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#183E95] hover:underline"
                  >
                    Нийтэд харагдах профайл
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </section>
            ) : null}

            <section>
              <h2 className="text-lg font-bold text-slate-900">Түргэн холбоос</h2>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/post-property"
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-[#183E95]/30 hover:bg-[#183E95]/5"
                  >
                    Зар нэмэх
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                </li>
                {!user.is_staff && !user.is_company_admin && user.id ? (
                  <li>
                    <Link
                      href={`/owners/${user.id}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-[#183E95]/30 hover:bg-[#183E95]/5"
                    >
                      Миний нийтэлсэн зарууд
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </li>
                ) : null}
                {user.is_staff ? (
                  <li>
                    <Link
                      href="/dashboard"
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-[#183E95]/30 hover:bg-[#183E95]/5"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 text-[#183E95]" />
                        Системийн удирдлага
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </li>
                ) : null}
                {user.is_company_admin ? (
                  <li>
                    <Link
                      href="/agent"
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-[#183E95]/30 hover:bg-[#183E95]/5"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#183E95]" />
                        Компанийн удирдлага
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </li>
                ) : null}
              </ul>
            </section>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <ProfilePageContent />
    </Suspense>
  );
}
