"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const invite = searchParams.get("invite");
    const qs = invite ? `?invite=${encodeURIComponent(invite)}` : "";
    router.replace(`/login${qs}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f9] text-sm text-slate-500">
      Нэвтрэх хуудас руу шилжиж байна…
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterRedirect />
    </Suspense>
  );
}
