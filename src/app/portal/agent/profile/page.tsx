"use client";

import Link from "next/link";
import { Card, Descriptions, Tag, Typography } from "antd";

import { useAuth } from "@/providers/AuthProvider";

const { Title } = Typography;

export default function AgentPortalProfilePage() {
  const { user } = useAuth();
  const profile = user?.agent_profile;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Title level={3}>Профайл</Title>
      <Card>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Нэр">
            {profile?.display_label || user?.display_name || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Утас">{user?.phone || profile?.phone || "—"}</Descriptions.Item>
          <Descriptions.Item label="И-мэйл">{user?.email || profile?.email || "—"}</Descriptions.Item>
          <Descriptions.Item label="Албан тушаал">{profile?.title || "—"}</Descriptions.Item>
          <Descriptions.Item label="Компани">
            {profile?.organization_name || profile?.organization_detail?.company_name || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Төлөв">
            {profile?.is_verified ? <Tag color="blue">Баталгаажсан</Tag> : <Tag>Энгийн</Tag>}
            {profile?.membership_status_display ? (
              <Tag>{profile.membership_status_display}</Tag>
            ) : null}
          </Descriptions.Item>
        </Descriptions>
        <div className="mt-4">
          <Link href="/profile" className="text-sm font-medium text-[#183E95] hover:underline">
            Дэлгэрэнгүй профайл →
          </Link>
        </div>
      </Card>
    </div>
  );
}
