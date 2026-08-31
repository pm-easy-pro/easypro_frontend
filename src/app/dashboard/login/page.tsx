"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Form, Input, message } from "antd";
import { ArrowRight, Lock, ShieldCheck, User } from "lucide-react";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";
import { useAuth } from "@/providers/AuthProvider";

function DashboardLoginForm() {
  const { login, user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (loading) return;
    if (user?.is_staff) {
      const target = nextPath.startsWith("/dashboard") ? nextPath : "/dashboard";
      router.replace(target === "/dashboard/login" ? "/dashboard" : target);
    }
  }, [user, loading, router, nextPath]);

  const onFinish = async (values: { username: string; password: string }) => {
    setSubmitting(true);
    try {
      const me = await login(values.username, values.password);
      if (!me.is_staff) {
        logout();
        message.error("Зөвхөн системийн админ нэвтэрч болно");
        return;
      }
      message.success("Амжилттай нэвтэрлээ");
      const target = nextPath.startsWith("/dashboard") ? nextPath : "/dashboard";
      router.push(target === "/dashboard/login" ? "/dashboard" : target);
    } catch {
      message.error("Нэвтрэх мэдээлэл буруу байна");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && user?.is_staff) {
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
            <ShieldCheck className="h-3.5 w-3.5" />
            Системийн админ
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Dashboard нэвтрэх
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Зөвхөн superadmin эрхтэй хэрэглэгчид нэвтэрнэ
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            size="large"
            onFinish={onFinish}
          >
            <Form.Item
              name="username"
              label={<span className="font-medium text-slate-700">Хэрэглэгчийн нэр</span>}
              rules={[{ required: true, message: "Нэр оруулна уу" }]}
            >
              <Input
                prefix={<User className="h-4 w-4 text-slate-400" />}
                placeholder="admin"
                className="!rounded-xl !border-slate-200"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span className="font-medium text-slate-700">Нууц үг</span>}
              rules={[{ required: true, message: "Нууц үг оруулна уу" }]}
            >
              <Input.Password
                prefix={<Lock className="h-4 w-4 text-slate-400" />}
                placeholder="••••••••"
                className="!rounded-xl !border-slate-200"
                autoComplete="current-password"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              className="!mt-2 !h-12 !rounded-xl !font-semibold"
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="end"
            >
              Нэвтрэх
            </Button>
          </Form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Энгийн хэрэглэгч үү?{" "}
          <Link href="/login" className="font-semibold text-[#183E95] hover:underline">
            Утсаар нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f4f6f9]" />}>
      <DashboardLoginForm />
    </Suspense>
  );
}
