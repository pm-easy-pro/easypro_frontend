"use client";

import {
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import {
  acceptMembership,
  createInviteCode,
  deactivateInviteCode,
  denyMembership,
  fetchInviteCodes,
  fetchMembershipRequests,
  updateInviteCode,
} from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Agent, InviteCode } from "@/types";

const { Title, Paragraph, Text } = Typography;

interface InviteFormValues {
  max_uses?: number | null;
  note?: string;
  unlimited: boolean;
}

export default function DashboardInvitesPage() {
  const { user } = useAuth();
  const isCompanyAdmin = Boolean(user?.is_company_admin);
  const isStaff = Boolean(user?.is_staff);
  const canManage = isCompanyAdmin || isStaff;

  const [activeTab, setActiveTab] = useState("requests");
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [requests, setRequests] = useState<Agent[]>([]);
  const [requestStatus, setRequestStatus] = useState<"pending" | "approved" | "denied" | "all">(
    "pending",
  );
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [form] = Form.useForm<InviteFormValues>();

  const loadInvites = useCallback(async () => {
    if (!canManage) return;
    setLoadingInvites(true);
    try {
      const data = await fetchInviteCodes();
      setInvites(data);
    } catch {
      message.error("Урилгын кодууд ачаалахад алдаа гарлаа");
    } finally {
      setLoadingInvites(false);
    }
  }, [canManage]);

  const loadRequests = useCallback(async () => {
    if (!canManage) return;
    setLoadingRequests(true);
    try {
      const data = await fetchMembershipRequests(requestStatus);
      setRequests(data);
    } catch {
      message.error("Бүртгэлийн хүсэлт ачаалахад алдаа гарлаа");
    } finally {
      setLoadingRequests(false);
    }
  }, [canManage, requestStatus]);

  useEffect(() => {
    if (!canManage) return;
    if (activeTab === "codes") loadInvites();
    if (activeTab === "requests") loadRequests();
  }, [activeTab, canManage, loadInvites, loadRequests]);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ unlimited: true, note: "", max_uses: 10 });
    setModalOpen(true);
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const created = await createInviteCode({
        note: values.note?.trim() || "",
        max_uses: values.unlimited ? null : values.max_uses || 1,
      });
      message.success(`Урилгын код үүслээ: ${created.code}`);
      setModalOpen(false);
      await loadInvites();
    } catch {
      message.error("Урилгын код үүсгэхэд алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/login?invite=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      message.success("Урилгын холбоос хуулагдлаа");
    } catch {
      message.info(inviteUrl);
    }
  };

  const handleAccept = async (agent: Agent) => {
    setActionId(agent.id);
    try {
      const res = await acceptMembership(agent.id);
      message.success(res.message);
      await loadRequests();
    } catch {
      message.error("Зөвшөөрөхөд алдаа гарлаа");
    } finally {
      setActionId(null);
    }
  };

  const handleDeny = (agent: Agent) => {
    Modal.confirm({
      title: "Бүртгэл татгалзах",
      content: `«${agent.display_name || agent.display_label}»-ийн хүсэлтийг татгалзах уу?`,
      okText: "Татгалзах",
      okType: "danger",
      cancelText: "Болих",
      onOk: async () => {
        setActionId(agent.id);
        try {
          const res = await denyMembership(agent.id);
          message.success(res.message);
          await loadRequests();
        } catch {
          message.error("Татгалзахад алдаа гарлаа");
        } finally {
          setActionId(null);
        }
      },
    });
  };

  const inviteColumns: ColumnsType<InviteCode> = [
    {
      title: "Код",
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <Space>
          <Text code className="text-base font-semibold tracking-wide">
            {code}
          </Text>
          <Button type="text" icon={<CopyOutlined />} onClick={() => copyCode(code)} />
        </Space>
      ),
    },
    {
      title: "Компани",
      dataIndex: "organization_name",
      key: "org",
      ellipsis: true,
    },
    {
      title: "Ашиглалт",
      key: "uses",
      width: 120,
      render: (_, record) =>
        record.max_uses == null
          ? `${record.uses_count} / ∞`
          : `${record.uses_count} / ${record.max_uses}`,
    },
    {
      title: "Тэмдэглэл",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      render: (note: string) => note || "—",
    },
    {
      title: "Төлөв",
      key: "status",
      width: 140,
      render: (_, record) =>
        record.is_redeemable ? <Tag color="green">Идэвхтэй</Tag> : <Tag>Идэвхгүй</Tag>,
    },
    {
      title: "Үйлдэл",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space>
          <Switch
            checked={record.is_active}
            onChange={async (checked) => {
              try {
                await updateInviteCode(record.id, { is_active: checked });
                await loadInvites();
              } catch {
                message.error("Төлөв солихад алдаа гарлаа");
              }
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: "Урилгын код идэвхгүй болгох",
                content: `«${record.code}» кодыг идэвхгүй болгох уу?`,
                okText: "Тийм",
                okType: "danger",
                cancelText: "Үгүй",
                onOk: async () => {
                  try {
                    await deactivateInviteCode(record.id);
                    message.success("Код идэвхгүй боллоо");
                    await loadInvites();
                  } catch {
                    message.error("Устгахад алдаа гарлаа");
                  }
                },
              });
            }}
          />
        </Space>
      ),
    },
  ];

  const requestColumns: ColumnsType<Agent> = [
    {
      title: "Агент",
      key: "agent",
      render: (_, record) => (
        <div>
          <div className="font-medium text-slate-900">
            {[record.title, record.display_name || record.display_label].filter(Boolean).join(" ")}
          </div>
          <div className="text-xs text-slate-400">@{record.username || "—"}</div>
        </div>
      ),
    },
    {
      title: "Холбоо барих",
      key: "contact",
      width: 180,
      render: (_, record) => (
        <div className="text-sm">
          <div>{record.phone || "—"}</div>
          <div className="truncate text-slate-400">{record.email || "—"}</div>
        </div>
      ),
    },
    {
      title: "Урилгын код",
      dataIndex: "invite_code",
      key: "invite_code",
      width: 140,
      render: (code?: string | null) => (code ? <Text code>{code}</Text> : "—"),
    },
    {
      title: "Огноо",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (value?: string) =>
        value ? new Date(value).toLocaleDateString("mn-MN") : "—",
    },
    {
      title: "Төлөв",
      key: "status",
      width: 130,
      render: (_, record) => {
        if (record.membership_status === "approved") return <Tag color="green">Зөвшөөрсөн</Tag>;
        if (record.membership_status === "denied") return <Tag color="red">Татгалзсан</Tag>;
        return <Tag color="orange">Хүлээгдэж буй</Tag>;
      },
    },
    {
      title: "Үйлдэл",
      key: "actions",
      width: 200,
      render: (_, record) =>
        record.membership_status === "pending" ? (
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={actionId === record.id}
              onClick={() => handleAccept(record)}
            >
              Зөвшөөрөх
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              loading={actionId === record.id}
              onClick={() => handleDeny(record)}
            >
              Татгалзах
            </Button>
          </Space>
        ) : (
          <Text type="secondary" className="text-xs">
            {record.reviewed_by_username
              ? `${record.reviewed_by_username} · ${
                  record.reviewed_at
                    ? new Date(record.reviewed_at).toLocaleDateString("mn-MN")
                    : ""
                }`
              : "—"}
          </Text>
        ),
    },
  ];

  if (!canManage) {
    return (
      <Card className="shadow-sm">
        <Title level={4}>Зөвшөөрөлгүй</Title>
        <Paragraph type="secondary" className="!mb-0">
          Урилга болон бүртгэл батлах эрх зөвхөн company admin эсвэл платформ админд байна.
        </Paragraph>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1">
            Урилга & бүртгэл
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            Урилгын код үүсгэж, кодоор бүртгүүлсэн агентуудыг зөвшөөрөх / татгалзах
          </Paragraph>
        </div>
        {activeTab === "codes" ? (
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
            Шинэ код
          </Button>
        ) : null}
      </div>

      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "requests",
              label: "Бүртгэлийн хүсэлт",
              children: (
                <div className="space-y-4">
                  <Select
                    value={requestStatus}
                    onChange={setRequestStatus}
                    className="w-48"
                    options={[
                      { value: "pending", label: "Хүлээгдэж буй" },
                      { value: "approved", label: "Зөвшөөрсөн" },
                      { value: "denied", label: "Татгалзсан" },
                      { value: "all", label: "Бүгд" },
                    ]}
                  />
                  <Table
                    columns={requestColumns}
                    dataSource={requests}
                    rowKey="id"
                    loading={loadingRequests}
                    pagination={false}
                    locale={{ emptyText: "Хүсэлт байхгүй" }}
                  />
                </div>
              ),
            },
            {
              key: "codes",
              label: "Урилгын код",
              children: (
                <Table
                  columns={inviteColumns}
                  dataSource={invites}
                  rowKey="id"
                  loading={loadingInvites}
                  pagination={false}
                  locale={{ emptyText: "Урилгын код байхгүй" }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Урилгын код үүсгэх"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={submitting}
        okText="Үүсгэх"
        cancelText="Болих"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="note" label="Тэмдэглэл">
            <Input placeholder="Жишээ: 2026 Q1 onboarding" />
          </Form.Item>
          <Form.Item name="unlimited" label="Хязгааргүй ашиглалт" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.unlimited !== next.unlimited}>
            {({ getFieldValue }) =>
              getFieldValue("unlimited") ? null : (
                <Form.Item
                  name="max_uses"
                  label="Хамгийн их ашиглалт"
                  rules={[{ required: true, message: "Тоо оруулна уу" }]}
                >
                  <InputNumber min={1} className="w-full" />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
