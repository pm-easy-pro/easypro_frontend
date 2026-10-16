"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Building2, Trees } from "lucide-react";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";
import { AuthLoadingScreen } from "@/hooks/useRequireAuth";
import { useAuth } from "@/providers/AuthProvider";

export default function PostChooserPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/post")}`);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f4f6f9] px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <EasyProLogoMark className="h-10 w-10" />
            <span className="text-xl font-bold text-slate-900">EasyPro</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Ямар зар нэмэх вэ?
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Үл хөдлөх эсвэл газрын зар сонгоод үргэлжлүүлнэ үү
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/post-property"
            className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-[#183E95]/40 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#183E95]/10 text-[#183E95] transition group-hover:bg-[#183E95] group-hover:text-white">
              <Building2 className="h-6 w-6" />
            </span>
            <span className="mt-5 text-lg font-bold text-slate-900">Үл хөдлөх</span>
            <span className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Орон сууц, хашаа байшин, офис гэх мэт
            </span>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#183E95]">
              Үргэлжлүүлэх
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/post-land"
            className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-[#183E95]/40 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
              <Trees className="h-6 w-6" />
            </span>
            <span className="mt-5 text-lg font-bold text-slate-900">Газар</span>
            <span className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Газрын эрхийн төрөл, талбай, зориулалт
            </span>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
              Үргэлжлүүлэх
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

        <p className="mt-8 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-[#183E95]">
            ← Нүүр рүү буцах
          </Link>
        </p>
      </div>
    </div>
  );
}
