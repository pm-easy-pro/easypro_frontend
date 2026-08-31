"use client";

import Link from "next/link";
import { SearchOutlined } from "@ant-design/icons";
import { Card, Input, Select, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import { fetchManageAgents } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Agent } from "@/types";

const { Title, Paragraph } = Typography;

export default function DashboardAgentsPage() {
  const { user } = useAuth();
  const isStaff = Boolean(user?.is_staff);
  const isCompanyAdmin = Boolean(user?.is_company_admin);
  const canManage = isStaff || isCompanyAdmin;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "denied"
  >("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchManageAgents({
        search: query || undefined,
        membership_status: statusFilter === "all" ? undefined : statusFilter,
      });
      setAgents(data);
    } catch {
      message.error("Агентүүд ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, [canManage, query, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<Agent> = [
    {
      title: "Агент",
      key: "name",
      render: (_, record) => (
        <div>
          <Link href={`/agents/${record.id}`} className="font-medium text-[#183E95] hover:underline">
            {[record.title, record.display_name || record.display_label].filter(Boolean).join(" ")}
          </Link>
          {record.username ? (
            <div className="text-xs text-slate-400">@{record.username}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Компани",
      dataIndex: "organization_name",
      key: "organization",
      ellipsis: true,
      render: (name: string | null) => name || "—",
    },
    {
      title: "Утас",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (phone: string) => phone || "—",
    },
    {
      title: "Имэйл",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
      render: (email: string) => email || "—",
    },
    {
      title: "Гишүүнчлэл",
      key: "membership",
      width: 140,
      render: (_, record) => {
        if (record.membership_status === "pending") {
          return <Tag color="orange">Хүлээгдэж буй</Tag>;
        }
        if (record.membership_status === "denied") {
          return <Tag color="red">Татгалзсан</Tag>;
        }
        return record.is_verified ? (
          <Tag color="blue">Зөвшөөрсөн</Tag>
        ) : (
          <Tag color="green">Идэвхтэй</Tag>
        );
      },
    },
    {
      title: "Үйлдэл",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Link href={`/agents/${record.id}`} className="text-sm text-[#183E95] hover:underline">
          Дэлгэрэнгүй
        </Link>
      ),
    },
  ];

  if (!canManage) {
    return (
      <Card className="shadow-sm">
        <Title level={4}>Зөвшөөрөлгүй</Title>
        <Paragraph type="secondary" className="!mb-0">
          Агент удирдах эрх зөвхөн системийн админ болон company admin-д байна. Та зөвхөн өөрийн
          зарыг «Зарууд» цэсээс удирдана.
        </Paragraph>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          Агентүүд
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          {isStaff
            ? "Платформын бүх хувь хүн агент"
            : "Зөвхөн өөрийн компанийн агентууд"}
        </Paragraph>
      </div>

      <Card className="shadow-sm">
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Агент хайх..."
            prefix={<SearchOutlined />}
            allowClear
            size="large"
            className="max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => setQuery(search.trim())}
          />
          <Select
            size="large"
            className="w-44"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Бүгд" },
              { value: "approved", label: "Зөвшөөрсөн" },
              { value: "pending", label: "Хүлээгдэж буй" },
              { value: "denied", label: "Татгалзсан" },
            ]}
          />
        </div>
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: "Агент олдсонгүй" }}
        />
      </Card>
    </div>
  );
}
