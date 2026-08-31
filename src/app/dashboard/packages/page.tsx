"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
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
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import {
  createPackage,
  deletePackage,
  fetchManagePackages,
  updatePackage,
} from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { SubscriptionPackage, SubscriptionPackagePayload } from "@/types";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface PackageFormValues {
  name: string;
  slug?: string;
  description?: string;
  target_type: "individual" | "organization";
  price: number;
  billing_period: "monthly" | "yearly";
  max_listings: number;
  max_vip_listings: number;
  featuresText: string;
  is_popular: boolean;
  sort_order: number;
  is_active: boolean;
}

function formatPrice(value: string | number) {
  return `${Number(value).toLocaleString("mn-MN")}₮`;
}

function toFormValues(pkg: SubscriptionPackage): PackageFormValues {
  return {
    name: pkg.name,
    slug: pkg.slug,
    description: pkg.description,
    target_type: pkg.target_type,
    price: Number(pkg.price),
    billing_period: pkg.billing_period,
    max_listings: pkg.max_listings,
    max_vip_listings: pkg.max_vip_listings,
    featuresText: pkg.features.join("\n"),
    is_popular: pkg.is_popular,
    sort_order: pkg.sort_order,
    is_active: pkg.is_active ?? true,
  };
}

function toPayload(values: PackageFormValues): SubscriptionPackagePayload {
  return {
    name: values.name,
    slug: values.slug || undefined,
    description: values.description || "",
    target_type: values.target_type,
    price: values.price,
    billing_period: values.billing_period,
    max_listings: values.max_listings,
    max_vip_listings: values.max_vip_listings,
    features: values.featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean),
    is_popular: values.is_popular,
    sort_order: values.sort_order,
    is_active: values.is_active,
  };
}

export default function DashboardPackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPackage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<PackageFormValues>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchManagePackages();
      setPackages(data);
    } catch {
      message.error("Багцууд ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.is_staff) {
      load();
    } else {
      setLoading(false);
    }
  }, [user, load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      target_type: "individual",
      billing_period: "monthly",
      max_listings: 5,
      max_vip_listings: 0,
      is_popular: false,
      sort_order: 0,
      is_active: true,
      featuresText: "",
    });
    setModalOpen(true);
  };

  const openEdit = (pkg: SubscriptionPackage) => {
    setEditing(pkg);
    form.setFieldsValue(toFormValues(pkg));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload = toPayload(values);
      if (editing) {
        await updatePackage(editing.id, payload);
        message.success("Багц шинэчлэгдлээ");
      } else {
        await createPackage(payload);
        message.success("Шинэ багц үүслээ");
      }
      setModalOpen(false);
      await load();
    } catch {
      message.error("Хадгалахад алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (pkg: SubscriptionPackage) => {
    Modal.confirm({
      title: "Багц идэвхгүй болгох",
      content: `«${pkg.name}» багцыг идэвхгүй болгох уу?`,
      okText: "Тийм",
      okType: "danger",
      cancelText: "Үгүй",
      onOk: async () => {
        try {
          await deletePackage(pkg.id);
          message.success("Багц идэвхгүй боллоо");
          await load();
        } catch {
          message.error("Устгахад алдаа гарлаа");
        }
      },
    });
  };

  const columns: ColumnsType<SubscriptionPackage> = [
    {
      title: "Нэр",
      dataIndex: "name",
      key: "name",
      render: (name: string, record) => (
        <div>
          <Text strong>{name}</Text>
          {record.is_popular && (
            <Tag color="gold" className="ml-2">
              Түгээмэл
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Зорилтот",
      dataIndex: "target_type_display",
      key: "target_type",
      width: 130,
    },
    {
      title: "Үнэ",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (price: string, record) => (
        <span>
          {formatPrice(price)}
          <div className="text-xs text-gray-400">{record.billing_period_display}</div>
        </span>
      ),
    },
    {
      title: "Зар",
      dataIndex: "max_listings",
      key: "max_listings",
      width: 70,
    },
    {
      title: "VIP",
      dataIndex: "max_vip_listings",
      key: "max_vip",
      width: 70,
    },
    {
      title: "Эрэмбэ",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 80,
    },
    {
      title: "Төлөв",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      render: (active: boolean) =>
        active ? <Tag color="green">Идэвхтэй</Tag> : <Tag color="default">Идэвхгүй</Tag>,
    },
    {
      title: "Үйлдэл",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  if (!user?.is_staff) {
    return (
      <Card className="shadow-sm">
        <Title level={4}>Зөвшөөрөлгүй</Title>
        <Paragraph type="secondary" className="!mb-0">
          Багц удирдах эрх зөвхөн админ хэрэглэгчид л байна.
        </Paragraph>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1">
            Багцууд
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            Subscription багцуудыг үүсгэх, засах, идэвхгүй болгох
          </Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
          Шинэ багц
        </Button>
      </div>

      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={packages}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: "Багц байхгүй" }}
        />
      </Card>

      <Modal
        title={editing ? "Багц засах" : "Шинэ багц"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="Хадгалах"
        cancelText="Болих"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Нэр"
            rules={[{ required: true, message: "Нэр оруулна уу" }]}
          >
            <Input placeholder="Про" />
          </Form.Item>
          <Form.Item name="slug" label="Slug" extra="Хоосон бол нэрээс автоматаар үүснэ">
            <Input placeholder="agent-pro" />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар">
            <TextArea rows={2} placeholder="Багцын тайлбар" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="target_type"
              label="Зорилтот хэрэглэгч"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "individual", label: "Хувь хүн агент" },
                  { value: "organization", label: "Байгууллага" },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="billing_period"
              label="Төлбөрийн хугацаа"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "monthly", label: "Сар бүр" },
                  { value: "yearly", label: "Жил бүр" },
                ]}
              />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="Үнэ (₮)"
              rules={[{ required: true, message: "Үнэ оруулна уу" }]}
            >
              <InputNumber className="w-full" min={0} step={1000} />
            </Form.Item>
            <Form.Item name="sort_order" label="Эрэмбэ">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="max_listings" label="Зарын хязгаар" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="max_vip_listings" label="VIP зарын хязгаар">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>
          <Form.Item
            name="featuresText"
            label="Онцлогууд"
            extra="Мөр бүрт нэг онцлог"
          >
            <TextArea rows={4} placeholder={"20 хүртэл зар\n3 VIP зар\n24/7 дэмжлэг"} />
          </Form.Item>
          <div className="flex gap-8">
            <Form.Item name="is_popular" label="Түгээмэл" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
