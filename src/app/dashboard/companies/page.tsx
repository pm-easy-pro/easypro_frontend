"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createManageCompany,
  deleteManageCompany,
  fetchAgents,
  fetchManageCompanies,
  updateManageCompany,
} from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Agent, AgentCompanyPayload } from "@/types";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface CompanyFormValues {
  company_name: string;
  slug?: string;
  phone?: string;
  email?: string;
  address?: string;
  bio?: string;
  is_verified: boolean;
  is_active: boolean;
  admin_username?: string;
  admin_password?: string;
  admin_email?: string;
  admin_phone?: string;
}

function toFormValues(company: Agent): CompanyFormValues {
  return {
    company_name: company.company_name || company.display_label,
    slug: company.slug,
    phone: company.phone || "",
    email: company.email || "",
    address: company.address || "",
    bio: company.bio || "",
    is_verified: company.is_verified,
    is_active: company.is_active ?? true,
    admin_username: company.admin?.username || "",
    admin_email: company.admin?.email || "",
    admin_phone: company.admin?.phone || "",
    admin_password: "",
  };
}

export default function DashboardCompaniesPage() {
  const { user } = useAuth();
  const isStaff = Boolean(user?.is_staff);

  const [companies, setCompanies] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [clearAvatar, setClearAvatar] = useState(false);
  const [form] = Form.useForm<CompanyFormValues>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isStaff) {
        const data = await fetchManageCompanies({
          search: query || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        });
        setCompanies(data);
      } else {
        const data = await fetchAgents({
          agent_type: "organization",
          search: query || undefined,
          page: 1,
        });
        setCompanies(data.results);
      }
    } catch {
      message.error("Компаниуд ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, [isStaff, query, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const resetLogoState = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setClearAvatar(false);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      is_verified: false,
      is_active: true,
      phone: "",
      email: "",
      address: "",
      bio: "",
      slug: "",
      admin_username: "",
      admin_password: "",
      admin_email: "",
      admin_phone: "",
    });
    resetLogoState();
    setModalOpen(true);
  };

  const openEdit = (company: Agent) => {
    setEditing(company);
    form.setFieldsValue(toFormValues(company));
    resetLogoState();
    setLogoPreview(company.avatar_url || null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload: AgentCompanyPayload = {
        company_name: values.company_name.trim(),
        slug: values.slug?.trim() || "",
        phone: values.phone?.trim() || "",
        email: values.email?.trim() || "",
        address: values.address?.trim() || "",
        bio: values.bio?.trim() || "",
        is_verified: values.is_verified,
        is_active: values.is_active,
        clear_avatar: clearAvatar && !logoFile,
        admin_username: values.admin_username?.trim() || "",
        admin_password: values.admin_password || "",
        admin_email: values.admin_email?.trim() || "",
        admin_phone: values.admin_phone?.trim() || "",
      };

      if (editing) {
        await updateManageCompany(editing.id, payload, logoFile);
        message.success("Компани шинэчлэгдлээ");
      } else {
        await createManageCompany(payload, logoFile);
        message.success("Компани болон company admin үүслээ");
      }
      setModalOpen(false);
      resetLogoState();
      await load();
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as {
              response?: {
                data?: Record<string, string[] | string>;
              };
            }).response?.data
          : undefined;
      const firstFieldError =
        detail &&
        Object.values(detail).find((v) => Array.isArray(v) && typeof v[0] === "string")?.[0];
      const msg =
        (typeof firstFieldError === "string" ? firstFieldError : undefined) ||
        (typeof detail?.detail === "string" ? detail.detail : undefined) ||
        "Хадгалахад алдаа гарлаа";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (company: Agent) => {
    Modal.confirm({
      title: "Компани идэвхгүй болгох",
      content: `«${company.company_name || company.display_label}» компанийг идэвхгүй болгох уу?`,
      okText: "Тийм",
      okType: "danger",
      cancelText: "Үгүй",
      onOk: async () => {
        try {
          await deleteManageCompany(company.id);
          message.success("Компани идэвхгүй боллоо");
          await load();
        } catch {
          message.error("Устгахад алдаа гарлаа");
        }
      },
    });
  };

  const uploadProps = useMemo(
    () => ({
      accept: "image/png,image/jpeg,image/webp,image/gif",
      maxCount: 1,
      showUploadList: false,
      beforeUpload: (file: File) => {
        const ok = file.size <= 8 * 1024 * 1024;
        if (!ok) {
          message.error("Logo хамгийн ихдээ 8MB байх ёстой");
          return Upload.LIST_IGNORE;
        }
        setLogoFile(file);
        setClearAvatar(false);
        setLogoPreview(URL.createObjectURL(file));
        return false;
      },
    }),
    [],
  );

  const columns: ColumnsType<Agent> = [
    {
      title: "Компани",
      key: "name",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#183E95]/10 text-sm font-bold text-[#183E95]">
            {record.avatar_url ? (
              <Image
                src={record.avatar_url}
                alt={record.company_name || record.display_label}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              (record.company_name || record.display_label || "?").slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/agents/${record.id}`}
              className="font-medium text-[#183E95] hover:underline"
            >
              {record.company_name || record.display_label}
            </Link>
            {record.address ? (
              <div className="truncate text-xs text-slate-400">{record.address}</div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: "Холбоо барих",
      key: "contact",
      width: 200,
      render: (_, record) => (
        <div className="text-sm">
          <div>{record.phone || "—"}</div>
          <div className="truncate text-slate-400">{record.email || "—"}</div>
        </div>
      ),
    },
    {
      title: "Admin",
      key: "admin",
      width: 160,
      render: (_, record) =>
        record.admin?.username ? (
          <div className="text-sm">
            <div className="font-medium">{record.admin.username}</div>
            <div className="truncate text-xs text-slate-400">{record.admin.email || "—"}</div>
          </div>
        ) : (
          <Tag color="orange">Admin байхгүй</Tag>
        ),
    },
    {
      title: "Агент",
      dataIndex: "member_count",
      key: "members",
      width: 90,
      render: (count?: number) => count ?? "—",
    },
    {
      title: "Зар",
      dataIndex: "property_count",
      key: "properties",
      width: 80,
      render: (count?: number) => count ?? "—",
    },
    {
      title: "Төлөв",
      key: "status",
      width: 170,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.is_verified ? <Tag color="blue">Баталгаажсан</Tag> : <Tag>Бүртгэлтэй</Tag>}
          {isStaff ? (
            record.is_active === false ? (
              <Tag color="default">Идэвхгүй</Tag>
            ) : (
              <Tag color="green">Идэвхтэй</Tag>
            )
          ) : null}
        </Space>
      ),
    },
    {
      title: "Үйлдэл",
      key: "actions",
      width: isStaff ? 120 : 100,
      render: (_, record) =>
        isStaff ? (
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              disabled={record.is_active === false}
            />
          </Space>
        ) : (
          <Link href={`/agents/${record.id}`} className="text-sm text-[#183E95] hover:underline">
            Дэлгэрэнгүй
          </Link>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1">
            Компаниуд
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            {isStaff
              ? "Agent company-ийн нэр, logo, танилцуулга, хаяг, холбоо барих мэдээллийг бүрэн удирдах"
              : "Платформ дээрх байгууллага, агентлаг"}
          </Paragraph>
        </div>
        {isStaff ? (
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
            Шинэ компани
          </Button>
        ) : null}
      </div>

      <Card className="shadow-sm">
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Компани хайх..."
            prefix={<SearchOutlined />}
            allowClear
            size="large"
            className="max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => setQuery(search.trim())}
          />
          {isStaff ? (
            <Select
              size="large"
              className="w-40"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "Бүгд" },
                { value: "active", label: "Идэвхтэй" },
                { value: "inactive", label: "Идэвхгүй" },
              ]}
            />
          ) : null}
          <Button
            size="large"
            onClick={() => {
              setQuery(search.trim());
            }}
          >
            Хайх
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={companies}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: "Компани олдсонгүй" }}
        />
      </Card>

      <Modal
        title={editing ? "Компани засах" : "Шинэ компани"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          resetLogoState();
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="Хадгалах"
        cancelText="Болих"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="Logo">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-[#183E95]">
                {logoPreview && !clearAvatar ? (
                  <Image src={logoPreview} alt="Logo" fill className="object-cover" unoptimized />
                ) : (
                  <Text type="secondary">Logo</Text>
                )}
              </div>
              <Space wrap>
                <Upload {...uploadProps} fileList={[] as UploadFile[]}>
                  <Button icon={<UploadOutlined />}>Зураг сонгох</Button>
                </Upload>
                {logoPreview && !clearAvatar ? (
                  <Button
                    danger
                    type="link"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                      setClearAvatar(true);
                    }}
                  >
                    Устгах
                  </Button>
                ) : null}
              </Space>
            </div>
            <Text type="secondary" className="mt-2 block text-xs">
              PNG, JPG, WEBP — хамгийн ихдээ 8MB
            </Text>
          </Form.Item>

          <Form.Item
            name="company_name"
            label="Компанийн нэр"
            rules={[{ required: true, message: "Нэр оруулна уу" }]}
          >
            <Input placeholder="RE/MAX HUB" size="large" />
          </Form.Item>

          <Form.Item name="slug" label="Slug" extra="Хоосон бол нэрээс автоматаар үүснэ">
            <Input placeholder="remax-hub" />
          </Form.Item>

          <Form.Item
            name="bio"
            label="Танилцуулга"
            extra="Компанийн богино танилцуулга / short description"
          >
            <TextArea
              rows={4}
              placeholder="+200 агенттай Монголын хамгийн том үл хөдлөх хөрөнгө зуучлалын брокер оффис..."
            />
          </Form.Item>

          <Form.Item name="address" label="Хаяг / байршил">
            <TextArea
              rows={2}
              placeholder="3rd floor, Encanto Mall, Bayanzurkh District, Ulaanbaatar, Mongolia"
            />
          </Form.Item>

          <div className="grid gap-4 sm:grid-cols-2">
            <Form.Item name="phone" label="Утас">
              <Input placeholder="7711-2000" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Имэйл"
              rules={[{ type: "email", message: "Имэйл буруу байна" }]}
            >
              <Input placeholder="hub@remax.mn" />
            </Form.Item>
          </div>

          <div className="flex flex-wrap gap-8">
            <Form.Item name="is_verified" label="Баталгаажсан" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <Text strong className="block text-[#183E95]">
              Company admin эрх
            </Text>
            <Text type="secondary" className="mb-3 mt-1 block text-xs">
              {editing?.admin
                ? "Нууц үгийг хоосон үлдээвэл өөрчлөгдөхгүй. Admin урилгын код үүсгэж агентуудаа урих боломжтой."
                : "Компани бүртгэхэд admin хэрэглэгч үүснэ. Энэ эрхээр урилгын код үүсгэнэ."}
            </Text>
            <div className="grid gap-4 sm:grid-cols-2">
              <Form.Item
                name="admin_username"
                label="Admin хэрэглэгчийн нэр"
                rules={
                  editing?.admin
                    ? []
                    : [{ required: true, message: "Admin нэр оруулна уу" }]
                }
              >
                <Input placeholder="remax_admin" autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="admin_password"
                label={editing?.admin ? "Шинэ нууц үг (сонголттой)" : "Admin нууц үг"}
                rules={
                  editing?.admin
                    ? [{ min: 6, message: "Хамгийн багадаа 6 тэмдэгт" }]
                    : [
                        { required: true, message: "Нууц үг оруулна уу" },
                        { min: 6, message: "Хамгийн багадаа 6 тэмдэгт" },
                      ]
                }
              >
                <Input.Password placeholder="••••••••" autoComplete="new-password" />
              </Form.Item>
              <Form.Item name="admin_email" label="Admin имэйл">
                <Input placeholder="admin@company.mn" />
              </Form.Item>
              <Form.Item name="admin_phone" label="Admin утас">
                <Input placeholder="9911-0000" />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
