"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "antd";
import { Building2, MapPin, MessageCircle, Phone, ShieldCheck, User } from "lucide-react";

import type { Agent, ListingOwnerType, User as AppUser } from "@/types";

interface AgentCardProps {
  agent?: Agent | null;
  poster?: AppUser | null;
  listingOwnerType?: ListingOwnerType;
  /** Nested inside offer panel — no outer card chrome */
  embedded?: boolean;
}

function Avatar({
  src,
  alt,
  fallback,
  size = "lg",
}: {
  src?: string | null;
  alt: string;
  fallback: "user" | "building";
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "h-16 w-16" : "h-14 w-14";
  return (
    <div
      className={`relative flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#183E95]/10 text-[#183E95]`}
    >
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" unoptimized />
      ) : fallback === "building" ? (
        <Building2 className="h-8 w-8" />
      ) : (
        <User className="h-8 w-8" />
      )}
    </div>
  );
}

function ContactActions({
  phone,
  listingsHref,
}: {
  phone?: string;
  listingsHref?: string;
}) {
  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {phone ? (
          <Button type="primary" size="large" icon={<Phone className="h-4 w-4" />} block href={`tel:${phone}`}>
            Залгах
          </Button>
        ) : null}
        <Button size="large" icon={<MessageCircle className="h-4 w-4" />} block>
          Мессеж
        </Button>
      </div>
      {listingsHref ? (
        <Link
          href={listingsHref}
          className="mt-4 block text-center text-sm font-semibold text-[#183E95] hover:underline"
        >
          Бүх зар харах
        </Link>
      ) : null}
    </>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#183E95] px-2 py-0.5 text-[10px] font-bold text-white">
      <ShieldCheck className="h-3 w-3" />
      Баталгаажсан
    </span>
  );
}

export function AgentCard({
  agent,
  poster,
  listingOwnerType,
  embedded = false,
}: AgentCardProps) {
  const shell = embedded
    ? "space-y-0"
    : "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6";

  // Хувь хүн эзэн
  if (listingOwnerType === "owner") {
    const name =
      poster?.display_name ||
      [poster?.first_name, poster?.last_name].filter(Boolean).join(" ") ||
      poster?.username ||
      "Хувь хүн";
    const phone = poster?.phone || "";
    const listingsHref = poster?.id ? `/owners/${poster.id}` : undefined;

    return (
      <div className={shell}>
        <div className="flex items-center gap-4">
          <Avatar src={poster?.avatar_url} alt={name} fallback="user" />
          <div className="min-w-0">
            {listingsHref ? (
              <Link
                href={listingsHref}
                className="text-lg font-bold text-slate-900 hover:text-[#183E95]"
              >
                {name}
              </Link>
            ) : (
              <p className="text-lg font-bold text-slate-900">{name}</p>
            )}
            {phone ? <p className="mt-1 text-sm text-slate-600">{phone}</p> : null}
          </div>
        </div>
        <ContactActions phone={phone} listingsHref={listingsHref} />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className={shell}>
        <p className="text-sm text-slate-500">Холбоо барих мэдээлэл байхгүй</p>
      </div>
    );
  }

  const isOrg = agent.agent_type === "organization";
  const org = isOrg
    ? {
        id: agent.id,
        company_name: agent.company_name || agent.display_label,
        bio: agent.bio,
        address: agent.address,
        phone: agent.phone,
        is_verified: agent.is_verified,
        avatar_url: agent.avatar_url,
      }
    : agent.organization_detail
      ? {
          id: agent.organization_detail.id,
          company_name: agent.organization_detail.company_name || agent.organization_detail.display_label,
          bio: agent.organization_detail.bio,
          address: agent.organization_detail.address,
          phone: agent.organization_detail.phone || agent.phone,
          is_verified: agent.organization_detail.is_verified,
          avatar_url: agent.organization_detail.avatar_url,
        }
      : agent.organization_name
        ? {
            id: undefined as number | undefined,
            company_name: agent.organization_name,
            bio: undefined as string | undefined,
            address: undefined as string | undefined,
            phone: agent.phone,
            is_verified: false,
            avatar_url: null as string | null | undefined,
          }
        : null;

  // Компани зар
  if (listingOwnerType === "company" || isOrg) {
    const companyName = org?.company_name || agent.company_name || agent.display_label;
    return (
      <div className={shell}>
        <div className="flex items-start gap-4">
          <Avatar src={agent.avatar_url || org?.avatar_url} alt={companyName} fallback="building" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/agents/${agent.id}`} className="text-lg font-bold text-slate-900 hover:text-[#183E95]">
                {companyName}
              </Link>
              {agent.is_verified ? <VerifiedBadge /> : null}
            </div>
            {agent.phone ? <p className="mt-1 text-sm text-slate-600">{agent.phone}</p> : null}
          </div>
        </div>
        {agent.bio ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{agent.bio}</p>
        ) : null}
        {agent.address ? (
          <p className="mt-3 flex items-start gap-2 text-sm text-slate-500">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#183E95]" />
            <span>{agent.address}</span>
          </p>
        ) : null}
        <ContactActions phone={agent.phone} listingsHref={`/agents/${agent.id}`} />
      </div>
    );
  }

  // Агент + компани
  const personTitle = [agent.title, agent.display_name || agent.display_label].filter(Boolean).join(" ");
  const contactPhone = agent.phone || org?.phone;

  return (
    <div className={shell}>
      {org ? (
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3">
            <Avatar src={org.avatar_url} alt={org.company_name} fallback="building" size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {org.id ? (
                  <Link
                    href={`/agents/${org.id}`}
                    className="text-base font-bold text-slate-900 hover:text-[#183E95]"
                  >
                    {org.company_name}
                  </Link>
                ) : (
                  <p className="text-base font-bold text-slate-900">{org.company_name}</p>
                )}
                {org.is_verified ? <VerifiedBadge /> : null}
              </div>
            </div>
          </div>
          {org.bio ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3">{org.bio}</p>
          ) : null}
          {org.address ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-slate-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#183E95]" />
              <span>{org.address}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={org ? "pt-5" : ""}>
        <div className="flex items-center gap-4">
          <Avatar src={agent.avatar_url} alt={personTitle} fallback="user" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/agents/${agent.id}`} className="text-lg font-bold text-slate-900 hover:text-[#183E95]">
                {personTitle}
              </Link>
              {agent.is_verified ? <VerifiedBadge /> : null}
            </div>
            {agent.phone ? <p className="mt-1 text-sm text-slate-600">{agent.phone}</p> : null}
          </div>
        </div>
        {agent.bio && !org?.bio ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-3">{agent.bio}</p>
        ) : null}
      </div>

      <ContactActions phone={contactPhone} listingsHref={`/agents/${agent.id}`} />
    </div>
  );
}
