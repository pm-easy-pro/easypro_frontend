"use client";

import Image from "next/image";
import Link from "next/link";
import { KeyOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import { fetchManageAgents, staffSetAgentPin } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Agent } from "@/types";

const { Title, Paragraph, Text } = Typography;

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
  const [pinAgent, setPinAgent] = useState<Agent | null>(null);
  const [pinSaving, setPinSaving] = useState(false);
  const [pinForm] = Form.useForm();

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

  const openPinModal = (agent: Agent) => {
    setPinAgent(agent);
    pinForm.resetFields();
  };

  const savePin = async (values: { pin: string; pin_confirm: string }) => {
    if (!pinAgent) return;
    setPinSaving(true);
    try {
      const res = await staffSetAgentPin(pinAgent.id, values);
      message.success(res.detail);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === pinAgent.id
            ? { ...a, has_pin: true, pin_set_at: res.pin_set_at }
            : a,
        ),
      );
      setPinAgent(null);
      pinForm.resetFields();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "PIN хадгалахад алдаа";
      message.error(detail);
    } finally {
      setPinSaving(false);
    }
  };

  const columns: ColumnsType<Agent> = [
    {
      title: "Агент",
      key: "name",
      render: (_, record) => {
        const name = [record.title, record.display_name || record.display_label]
          .filter(Boolean)
          .join(" ");
        return (
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#183E95]/10 text-[#183E95]">
              {record.avatar_url ? (
                <Image
                  src={record.avatar_url}
                  alt={name}
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="44px"
                />
              ) : (
                <UserOutlined className="text-lg" />
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/agents/${record.id}`}
                className="font-medium text-[#183E95] hover:underline"
              >
                {name}
              </Link>
              {record.username ? (
                <div className="text-xs text-slate-400">@{record.username}</div>
              ) : null}
            </div>
          </div>
        );
      },
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
      title: "PIN",
      key: "pin",
      width: 120,
      render: (_, record) =>
        record.has_pin ? (
          <Tag color="green">Тохируулсан</Tag>
        ) : (
          <Tag color="default">Байхгүй</Tag>
        ),
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
      width: 200,
      render: (_, record) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            className="!px-0"
            onClick={() => openPinModal(record)}
          >
            {record.has_pin ? "PIN солих" : "PIN тохируулах"}
          </Button>
          <Link href={`/agents/${record.id}`} className="text-sm text-slate-500 hover:text-[#183E95]">
            Дэлгэрэнгүй
          </Link>
        </div>
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
            ? "Платформын бүх хувь хүн агент — PIN шууд тохируулах / солих боломжтой"
            : "Зөвхөн өөрийн компанийн агентууд — PIN тохируулах / солих боломжтой"}
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

      <Modal
        title={
          pinAgent?.has_pin
            ? "Агентийн PIN солих"
            : "Агентийн PIN тохируулах"
        }
        open={Boolean(pinAgent)}
        onCancel={() => {
          setPinAgent(null);
          pinForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        {pinAgent ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="font-medium text-slate-900">
                {[pinAgent.title, pinAgent.display_name || pinAgent.display_label]
                  .filter(Boolean)
                  .join(" ")}
              </div>
              <Text type="secondary">
                Утас: {pinAgent.phone || "—"}
                {pinAgent.has_pin ? " · PIN аль хэдийн тохируулагдсан" : " · PIN байхгүй"}
              </Text>
            </div>
            <Paragraph type="secondary" className="!mb-0 text-sm">
              SMS шаардлагагүй. Шинэ 6 оронтой PIN шууд тохируулна. Агент
              agent.easypro.mn дээр утас + энэ PIN-ээр нэвтэрнэ.
            </Paragraph>
            <Form
              form={pinForm}
              layout="vertical"
              requiredMark={false}
              onFinish={savePin}
            >
              <Form.Item
                name="pin"
                label="Шинэ PIN"
                rules={[
                  { required: true, message: "PIN оруулна уу" },
                  { pattern: /^\d{6}$/, message: "6 оронтой тоо" },
                ]}
              >
                <Input.Password
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="••••••"
                  size="large"
                  className="!font-mono !tracking-widest"
                />
              </Form.Item>
              <Form.Item
                name="pin_confirm"
                label="PIN дахин"
                dependencies={["pin"]}
                rules={[
                  { required: true, message: "Дахин оруулна уу" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("pin") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("PIN таарахгүй байна"));
                    },
                  }),
                ]}
              >
                <Input.Password
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="••••••"
                  size="large"
                  className="!font-mono !tracking-widest"
                />
              </Form.Item>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setPinAgent(null);
                    pinForm.resetFields();
                  }}
                >
                  Болих
                </Button>
                <Button type="primary" htmlType="submit" loading={pinSaving}>
                  {pinAgent.has_pin ? "PIN солих" : "PIN тохируулах"}
                </Button>
              </div>
            </Form>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
