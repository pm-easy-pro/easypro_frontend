import Image from "next/image";
import { notFound } from "next/navigation";
import { Phone, User } from "lucide-react";

import { PropertyRowCard } from "@/components/property/PropertyRowCard";
import { fetchProperties } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerProfilePage({ params }: PageProps) {
  const { id } = await params;

  if (!id || Number.isNaN(Number(id))) {
    notFound();
  }

  const properties = await fetchProperties({
    posted_by: String(id),
    ordering: "newest",
  });
  const listings = properties.results;

  if (!listings.length) {
    notFound();
  }

  const poster = listings.find((p) => p.posted_by_detail)?.posted_by_detail;
  const name =
    poster?.display_name ||
    [poster?.first_name, poster?.last_name].filter(Boolean).join(" ") ||
    poster?.username ||
    "Хувь хүн";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#183E95]/10 text-[#183E95]">
            {poster?.avatar_url ? (
              <Image
                src={poster.avatar_url}
                alt={name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{name}</h1>
            {poster?.phone ? (
              <p className="mt-3 flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4" />
                {poster.phone}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-slate-500">{listings.length} идэвхтэй зар</p>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-bold text-slate-900">Зарууд</h2>
      <div className="space-y-3">
        {listings.map((property) => (
          <PropertyRowCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
