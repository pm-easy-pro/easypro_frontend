import { Suspense } from "react";

import { PropertiesPage } from "@/components/pages/PropertiesPage";

export default function PropertiesRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Ачааллаж байна...</div>}>
      <PropertiesPage />
    </Suspense>
  );
}
