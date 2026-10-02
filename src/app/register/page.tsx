"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { getLoginPathWithInvite } from "@/lib/auth-routes";

function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const invite = searchParams.get("invite");
    router.replace(getLoginPathWithInvite(invite));
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
