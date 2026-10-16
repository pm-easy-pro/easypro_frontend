"use client";

import Link from "next/link";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Divider,
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

import { PropertyImageUploader } from "@/components/property/PropertyImageUploader";
import {
  GeocodeStatusHint,
  LocationPicker,
  type GeocodeStatus,
} from "@/components/map/LocationPicker";
import {
  createManageProperty,
  deleteManageProperty,
  fetchFilterOptions,
  fetchManageProperties,
  updateManageProperty,
} from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { FilterOptions, Property } from "@/types";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

function formatPrice(value: string | number) {
  return `${Number(value).toLocaleString("mn-MN")}₮`;
}

const STATUS_COLOR: Record<string, string> = {
  active: "green",
  pending: "orange",
  sold: "blue",
  rented: "cyan",
  archived: "default",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Идэвхтэй" },
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "sold", label: "Зарагдсан" },
  { value: "rented", label: "Түрээслэгдсэн" },
  { value: "archived", label: "Архив" },
];

const BUILDING_TYPE_OPTIONS = [
  { value: "Панел", label: "Панел" },
  { value: "Тоосго", label: "Тоосго" },
  { value: "Бетон цутгамал", label: "Бетон цутгамал" },
  { value: "Модон", label: "Модон" },
  { value: "Төмөр каркас", label: "Төмөр каркас" },
  { value: "Холимог", label: "Холимог" },
  { value: "Бусад", label: "Бусад" },
];

interface PropertyFormValues {
  title: string;
  description: string;
  listing_type: string;
  property_type: string;
  condition: string;
  district: string;
  official_address: string;
  unofficial_addresses_text?: string;
  price: number;
  area_m2: number;
  room_count: number;
  floor?: number | null;
  total_floor?: number | null;
  window_count?: number | null;
  bathroom_count?: number | null;
  view_directions?: string[];
  payment_terms?: string[];
  year_built?: number | null;
  building_type?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  listing_owner_type?: string;
  is_vip: boolean;
  is_verified: boolean;
  is_active: boolean;
  garage: boolean;
  balcony: boolean;
  furnished: boolean;
  has_elevator: boolean;
  images?: string[];
}

function toFormValues(p: Property): PropertyFormValues {
  return {
    title: p.title,
    description: p.description || "",
    listing_type: p.listing_type,
    property_type: p.property_type,
    condition: p.condition,
    district: p.district,
    official_address: p.official_address,
    unofficial_addresses_text: (p.unofficial_addresses || []).join("\n"),
    price: Number(p.price),
    area_m2: Number(p.area_m2),
    room_count: p.room_count,
    floor: p.floor,
    total_floor: p.total_floor,
    window_count: p.window_count ?? null,
    bathroom_count: p.bathroom_count ?? null,
    view_directions: p.view_directions?.length ? p.view_directions : undefined,
    payment_terms: p.payment_terms || [],
    year_built: p.year_built,
    building_type: p.building_type || undefined,
    latitude: p.latitude != null && p.latitude !== "" ? Number(p.latitude) : null,
    longitude: p.longitude != null && p.longitude !== "" ? Number(p.longitude) : null,
    status: p.status,
    listing_owner_type: p.listing_owner_type || "owner",
    is_vip: p.is_vip,
    is_verified: p.is_verified,
    is_active: p.is_active !== false,
    garage: p.garage,
    balcony: p.balcony,
    furnished: p.furnished,
    has_elevator: p.has_elevator,
    images: p.images || [],
  };
}

function toPayload(values: PropertyFormValues, editing: Property | null) {
  const unofficial = (values.unofficial_addresses_text || "")
    .split("\n")
    .map((a) => a.trim())
    .filter(Boolean);

  const payload: Record<string, unknown> = {
    title: values.title,
    description: values.description,
    listing_type: values.listing_type,
    property_type: values.property_type,
    condition: values.condition,
    district: values.district,
    official_address: values.official_address,
    unofficial_addresses: unofficial,
    price: values.price,
    area_m2: values.area_m2,
    room_count: values.room_count,
    floor: values.floor ?? null,
    total_floor: values.total_floor ?? null,
    window_count: values.window_count ?? null,
    bathroom_count: values.bathroom_count ?? null,
    view_directions: values.view_directions || [],
    payment_terms: values.payment_terms || [],
    year_built: values.year_built ?? null,
    building_type: values.building_type || "",
    latitude: values.latitude ?? null,
    longitude: values.longitude ?? null,
    status: values.status,
    is_vip: values.is_vip,
    is_verified: values.is_verified,
    is_active: values.is_active,
    garage: values.garage,
    balcony: values.balcony,
    furnished: values.furnished,
    has_elevator: values.has_elevator,
    images: (values.images || []).filter(Boolean),
  };

  if (editing) {
    // Preserve owner type / agent unless staff changes listing_owner_type
    if (values.listing_owner_type) {
      payload.listing_owner_type = values.listing_owner_type;
    }
    if (editing.agent != null) {
      payload.agent = editing.agent;
    }
  } else {
    payload.listing_owner_type = values.listing_owner_type || "owner";
  }

  return payload;
}

export default function DashboardListingsPage() {
  const { user } = useAuth();
  const isStaff = Boolean(user?.is_staff);
  const isCompanyAdmin = Boolean(user?.is_company_admin);
  const canManage = Boolean(user);

  const [listings, setListings] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [options, setOptions] = useState<FilterOptions | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>("idle");
  const [form] = Form.useForm<PropertyFormValues>();

  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);
  const officialAddress = Form.useWatch("official_address", form);
  const unofficialText = Form.useWatch("unofficial_addresses_text", form);

  const mapPos =
    latitude != null &&
    longitude != null &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude))
      ? { lat: Number(latitude), lng: Number(longitude) }
      : null;

  const mapSearchQuery =
    (unofficialText || "")
      .split("\n")
      .map((s) => s.trim())
      .find(Boolean) ||
    officialAddress ||
    "";

  const load = useCallback(
    async (p: number, q: string, status?: string) => {
      setLoading(true);
      try {
        const data = await fetchManageProperties({
          page: p,
          search: q || undefined,
          status,
        });
        setListings(data.results);
        setTotal(data.count);
      } catch {
        message.error("Зарууд ачаалахад алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (canManage) load(page, query, statusFilter);
  }, [page, query, statusFilter, load, canManage]);

  useEffect(() => {
    fetchFilterOptions().then(setOptions).catch(() => undefined);
  }, []);

  const subtitle = isStaff
    ? "Бүх зарыг удирдах — үүсгэх, засах, архивлах"
    : isCompanyAdmin
      ? "Зөвхөн өөрийн компанийн агент болон зарууд"
      : "Зөвхөн өөрийн зарууд";

  const openCreate = () => {
    setEditing(null);
    setGeocodeStatus("idle");
    form.resetFields();
    form.setFieldsValue({
      listing_type: "sell",
      property_type: "apartment",
      condition: "good",
      status: "active",
      listing_owner_type: "owner",
      room_count: 2,
      is_vip: false,
      is_verified: false,
      is_active: true,
      garage: false,
      balcony: false,
      furnished: false,
      has_elevator: false,
      payment_terms: [],
      images: [],
      unofficial_addresses_text: "",
      latitude: null,
      longitude: null,
    });
    setModalOpen(true);
  };

  const openEdit = (record: Property) => {
    setEditing(record);
    setGeocodeStatus("idle");
    form.setFieldsValue(toFormValues(record));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload = toPayload(values, editing);
      if (editing) {
        await updateManageProperty(editing.id, payload);
        message.success("Зар шинэчлэгдлээ");
      } else {
        await createManageProperty(payload);
        message.success("Зар үүслээ");
      }
      setModalOpen(false);
      await load(page, query, statusFilter);
    } catch {
      message.error("Хадгалахад алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (record: Property) => {
    Modal.confirm({
      title: "Зар архивлах",
      content: `«${record.title}» зарыг архивлах уу?`,
      okText: "Тийм",
      okType: "danger",
      cancelText: "Үгүй",
      onOk: async () => {
        try {
          await deleteManageProperty(record.id);
          message.success("Зар архивлагдлаа");
          await load(page, query, statusFilter);
        } catch {
          message.error("Устгахад алдаа гарлаа");
        }
      },
    });
  };

  const handleStatusChange = async (record: Property, status: string) => {
    if (!isStaff || status === record.status) return;
    setStatusUpdatingId(record.id);
    try {
      const updated = await updateManageProperty(record.id, {
        status,
        is_active: status !== "archived",
      });
      setListings((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                status: updated.status,
                status_display: updated.status_display || status,
                is_active: updated.is_active,
              }
            : item,
        ),
      );
      message.success("Төлөв шинэчлэгдлээ");
      if (statusFilter && statusFilter !== status) {
        await load(page, query, statusFilter);
      }
    } catch {
      message.error("Төлөв солиход алдаа гарлаа");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const columns: ColumnsType<Property> = [
    {
      title: "Гарчиг",
      dataIndex: "title",
      key: "title",
      render: (title: string, record) => (
        <div>
          <Link
            href={`/properties/${record.id}`}
            className="font-medium text-[#183E95] hover:underline"
          >
            {title}
          </Link>
          <div className="mt-1 flex flex-wrap gap-1">
            {record.is_vip && <Tag color="gold">VIP</Tag>}
            {record.is_verified && <Tag color="blue">Баталгаажсан</Tag>}
            {record.is_active === false && <Tag>Идэвхгүй</Tag>}
            {(record.visibility_scopes || []).includes("public") && (
              <Tag color="green">Нийтэд</Tag>
            )}
            {(record.visibility_scopes || []).includes("company") && (
              <Tag>Company</Tag>
            )}
            {(record.visibility_scopes || []).includes("network") && (
              <Tag color="purple">Network</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Төрөл",
      dataIndex: "listing_type_display",
      key: "type",
      width: 110,
    },
    {
      title: "Байршил",
      dataIndex: "official_address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "Үнэ",
      dataIndex: "price",
      key: "price",
      width: 130,
      render: (price: string) => formatPrice(price),
    },
    {
      title: "Төлөв",
      dataIndex: "status",
      key: "status",
      width: isStaff ? 160 : 120,
      render: (status: string, record: Property) =>
        isStaff ? (
          <Select
            size="small"
            value={status}
            loading={statusUpdatingId === record.id}
            disabled={statusUpdatingId === record.id}
            options={STATUS_OPTIONS}
            onChange={(value) => handleStatusChange(record, value)}
            className="w-full min-w-[140px]"
            popupMatchSelectWidth={false}
          />
        ) : (
          <Tag color={STATUS_COLOR[status] ?? "default"}>
            {record.status_display || status}
          </Tag>
        ),
    },
    {
      title: "Үзсэн",
      dataIndex: "views_count",
      key: "views",
      width: 80,
    },
    {
      title: "Үйлдэл",
      key: "actions",
      width: 110,
      render: (_: unknown, record: Property) => (
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1">
            Зарууд
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            {subtitle}
          </Paragraph>
        </div>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
            Шинэ зар
          </Button>
          <Button icon={<PlusOutlined />} href="/post-property" size="large">
            Дэлгэрэнгүй форм
          </Button>
        </Space>
      </div>

      <Card className="shadow-sm">
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Зар хайх..."
            prefix={<SearchOutlined />}
            allowClear
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              setQuery(search);
            }}
          />
          <Select
            allowClear
            placeholder="Төлөв"
            className="w-40"
            value={statusFilter}
            onChange={(v) => {
              setPage(1);
              setStatusFilter(v);
            }}
            options={[
              { value: "active", label: "Идэвхтэй" },
              { value: "pending", label: "Хүлээгдэж буй" },
              { value: "sold", label: "Зарагдсан" },
              { value: "rented", label: "Түрээслэгдсэн" },
              { value: "archived", label: "Архив" },
            ]}
          />
        </div>
        <Table
          columns={columns}
          dataSource={listings}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 12,
            showSizeChanger: false,
            onChange: setPage,
          }}
          locale={{ emptyText: "Одоогоор зар байхгүй" }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={editing ? "Зар засах" : "Шинэ зар"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="Хадгалах"
        cancelText="Болих"
        width={840}
        destroyOnClose
        styles={{ body: { maxHeight: "72vh", overflowY: "auto" } }}
      >
        <Form form={form} layout="vertical" className="mt-2 pr-1">
          <Text strong className="mb-2 block text-slate-700">
            Үндсэн мэдээлэл
          </Text>
          <Form.Item
            name="title"
            label="Гарчиг"
            rules={[{ required: true, message: "Гарчиг оруулна уу" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Тайлбар"
            rules={[{ required: true, message: "Тайлбар оруулна уу" }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Form.Item name="listing_type" label="Зарын төрөл" rules={[{ required: true }]}>
              <Select options={options?.listing_types} />
            </Form.Item>
            <Form.Item name="property_type" label="Үл хөдлөхийн төрөл" rules={[{ required: true }]}>
              <Select options={options?.property_types} />
            </Form.Item>
            <Form.Item name="condition" label="Нөхцөл" rules={[{ required: true }]}>
              <Select options={options?.conditions} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="status" label="Төлөв" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "active", label: "Идэвхтэй" },
                  { value: "pending", label: "Хүлээгдэж буй" },
                  { value: "sold", label: "Зарагдсан" },
                  { value: "rented", label: "Түрээслэгдсэн" },
                  { value: "archived", label: "Архив" },
                ]}
              />
            </Form.Item>
            {isStaff ? (
              <Form.Item name="listing_owner_type" label="Зарын эзэн">
                <Select options={options?.listing_owner_types} />
              </Form.Item>
            ) : null}
          </div>

          <Divider className="!my-4" />
          <Text strong className="mb-2 block text-slate-700">
            Байршил
          </Text>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item name="district" label="Дүүрэг" rules={[{ required: true }]}>
              <Select
                options={
                  options?.district_choices || [
                    { value: "hud", label: "Хан-Уул" },
                    { value: "bayanzurkh", label: "Баянзүрх" },
                  ]
                }
              />
            </Form.Item>
            <Form.Item
              name="official_address"
              label="Албан ёсны хаяг"
              rules={[{ required: true, message: "Хаяг оруулна уу" }]}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item
            name="unofficial_addresses_text"
            label="Бусад нэршил"
            extra="Мөр бүрт нэг нэршил — эхний мөрөөр газрын зураг хайна"
          >
            <TextArea rows={2} placeholder="Жишээ: Солонго хотхон" />
          </Form.Item>

          <Form.Item name="latitude" hidden>
            <InputNumber />
          </Form.Item>
          <Form.Item name="longitude" hidden>
            <InputNumber />
          </Form.Item>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700">Газрын зураг дээрх байршил</p>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  mapPos
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {mapPos ? "Тэмдэглэгдсэн" : "Pin тавина уу"}
              </span>
            </div>
            <LocationPicker
              value={mapPos}
              searchQuery={mapSearchQuery}
              onChange={(pos) => {
                form.setFieldsValue({
                  latitude: pos.lat,
                  longitude: pos.lng,
                });
              }}
              onGeocodeStatus={setGeocodeStatus}
              className="h-64 sm:h-72"
            />
            <GeocodeStatusHint status={geocodeStatus} />
            {!mapPos && geocodeStatus === "idle" ? (
              <p className="mt-2 text-xs text-slate-500">
                Хаяг эсвэл хотхоны нэр бичнэ үү — эсвэл зураг дээр дарж pin тавина уу
              </p>
            ) : null}
          </div>

          <Divider className="!my-4" />
          <Text strong className="mb-2 block text-slate-700">
            Үнэ, талбай, тохиргоо
          </Text>          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Form.Item name="price" label="Үнэ (₮)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} step={100000} />
            </Form.Item>
            <Form.Item name="area_m2" label="Талбай (м²)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} step={0.5} />
            </Form.Item>
            <Form.Item name="room_count" label="Өрөө" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="bathroom_count" label="Угаалгын өрөө">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="window_count" label="Цонхны тоо">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="view_directions" label="Цонхны харагдац">
              <Select
                mode="multiple"
                allowClear
                options={options?.view_directions}
                placeholder="Олон чиглэл"
                maxTagCount="responsive"
              />
            </Form.Item>
            <Form.Item name="floor" label="Давхар">
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item name="total_floor" label="Нийт давхар">
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item name="year_built" label="Баригдсан он">
              <InputNumber className="w-full" min={1950} max={2030} />
            </Form.Item>
          </div>
          <Form.Item name="building_type" label="Барилгын хийц">
            <Select allowClear options={BUILDING_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="payment_terms" label="Төлбөрийн нөхцөл">
            <Checkbox.Group
              className="flex flex-col gap-2"
              options={(options?.payment_terms || []).map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </Form.Item>

          <Divider className="!my-4" />
          <Text strong className="mb-2 block text-slate-700">
            Зураг
          </Text>
          <Form.Item name="images" label="Зургууд" valuePropName="value" getValueFromEvent={(v) => v}>
            <PropertyImageUploader />
          </Form.Item>

          <Divider className="!my-4" />
          <Text strong className="mb-2 block text-slate-700">
            Нэмэлт сонголт
          </Text>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(isStaff || isCompanyAdmin) && (
              <Form.Item name="is_vip" label="VIP" valuePropName="checked">
                <Switch />
              </Form.Item>
            )}
            {isStaff && (
              <Form.Item name="is_verified" label="Баталгаажсан" valuePropName="checked">
                <Switch />
              </Form.Item>
            )}
            <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="has_elevator" label="Цахилгаан шат" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="garage" label="Гараж" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="balcony" label="Тагт" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="furnished" label="Тавилгатай" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
