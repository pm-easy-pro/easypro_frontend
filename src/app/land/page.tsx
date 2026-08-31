import { Suspense } from "react";

import { PropertiesPage } from "@/components/pages/PropertiesPage";

export default function LandRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Ачааллаж байна...</div>}>
      <PropertiesPage catalog="land" />
    </Suspense>
  );
}
