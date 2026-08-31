import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Phone, ShieldCheck, User } from "lucide-react";

import { PropertyRowCard } from "@/components/property/PropertyRowCard";
import { fetchAgent, fetchProperties } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function AgentProfilePage({ params }: PageProps) {
  const { id } = await params;

  let agent;
  try {
    agent = await fetchAgent(id);
  } catch {
    notFound();
  }

  const properties = await fetchProperties({ agent: String(agent.id), ordering: "newest" });
  const agentProperties = properties.results;

  const isOrg = agent.agent_type === "organization";
  const title = isOrg ? agent.company_name || agent.display_label : agent.display_name;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#183E95]/10 text-[#183E95]">
            {isOrg ? <Building2 className="h-10 w-10" /> : <User className="h-10 w-10" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              {isOrg ? "Байгууллага" : "Агент"}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>
            {agent.is_verified && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#183E95] px-2.5 py-1 text-xs font-bold text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                Баталгаажсан
              </span>
            )}
            {agent.phone && (
              <p className="mt-3 flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4" />
                {agent.phone}
              </p>
            )}
            {agent.bio && <p className="mt-4 text-slate-600">{agent.bio}</p>}
            <p className="mt-4 text-sm text-slate-500">
              {agent.property_count ?? agentProperties.length} идэвхтэй зар
            </p>
          </div>
        </div>

        {agent.member_agents && agent.member_agents.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="mb-3 font-semibold text-slate-900">Байгууллагын агентүүд</h2>
            <div className="flex flex-wrap gap-2">
              {agent.member_agents.map((member) => (
                <Link
                  key={member.id}
                  href={`/agents/${member.id}`}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium hover:border-[#183E95] hover:text-[#183E95]"
                >
                  {member.display_name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 className="mb-4 text-xl font-bold text-slate-900">Зарууд</h2>
      {agentProperties.length ? (
        <div className="space-y-3">
          {agentProperties.map((property) => (
            <PropertyRowCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-500">
          Одоогоор идэвхтэй зар байхгүй
        </p>
      )}
    </div>
  );
}
