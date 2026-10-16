"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ListingFormModal } from "@/components/dashboard/ListingFormModal";
import {
  LISTING_STATUS_COLOR,
  LISTING_STATUS_OPTIONS,
  formatListingPrice,
  listingCoverUrl,
} from "@/components/dashboard/listingForm";
import {
  deleteManageProperty,
  fetchManageProperty,
  updateManageProperty,
} from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { portalPath, usePortal } from "@/providers/PortalProvider";
import type { Property } from "@/types";

const { Title, Paragraph, Text } = Typography;

export default function DashboardListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portal = usePortal();
  const { user } = useAuth();
  const isStaff = Boolean(user?.is_staff);
  const isCompanyAdmin = Boolean(user?.is_company_admin);
  const id = Number(params.id);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const listHref = portalPath(portal.basePath, "listings");

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    try {
      const data = await fetchManageProperty(id);
      setProperty(data);
    } catch {
      message.error("Зар олдсонгүй эсвэл хандах эрхгүй");
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const gallery = useMemo(() => {
    if (!property) return [];
    const urls = [property.thumbnail_url, ...(property.images || [])].filter(
      (u): u is string => Boolean(u),
    );
    return Array.from(new Set(urls));
  }, [property]);

  const cover = property ? listingCoverUrl(property) : null;

  const handleDelete = () => {
    if (!property) return;
    Modal.confirm({
      title: "Зар архивлах",
      content: `«${property.title}» зарыг архивлах уу?`,
      okText: "Тийм",
      okType: "danger",
      cancelText: "Үгүй",
      onOk: async () => {
        try {
          await deleteManageProperty(property.id);
          message.success("Зар архивлагдлаа");
          router.push(listHref);
        } catch {
          message.error("Устгахад алдаа гарлаа");
        }
      },
    });
  };

  const handleStatusChange = async (status: string) => {
    if (!property || !isStaff || status === property.status) return;
    setStatusSaving(true);
    try {
      const updated = await updateManageProperty(property.id, {
        status,
        is_active: status !== "archived",
      });
      setProperty(updated);
      message.success("Төлөв шинэчлэгдлээ");
    } catch {
      message.error("Төлөв солиход алдаа гарлаа");
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm" loading>
        <div className="h-40" />
      </Card>
    );
  }

  if (!property) {
    return (
      <Card className="shadow-sm">
        <Title level={4}>Зар олдсонгүй</Title>
        <Button type="link" icon={<ArrowLeftOutlined />} href={listHref}>
          Жагсаалт руу буцах
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            className="!px-0"
            onClick={() => router.push(listHref)}
          >
            Зарууд
          </Button>
          <Title level={3} className="!mb-1 !mt-1">
            {property.title}
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            {property.official_address}
            {property.unofficial_addresses?.[0]
              ? ` · ${property.unofficial_addresses[0]}`
              : ""}
          </Paragraph>
        </div>
        <Space wrap>
          <Button icon={<EyeOutlined />} href={`/properties/${property.id}`} target="_blank">
            Нийтэд харах
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
            Засах
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Архивлах
          </Button>
        </Space>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-sm overflow-hidden">
          <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">
            {cover ? (
              <Image
                src={cover}
                alt={property.title}
                fill
                className="object-cover"
                unoptimized
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                Зураг байхгүй
              </div>
            )}
          </div>
          {gallery.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((src) => (
                <div
                  key={src}
                  className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100"
                >
                  <Image src={src} alt="" fill className="object-cover" unoptimized sizes="80px" />
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="shadow-sm" title="Үйлдэл & төлөв">
          <div className="space-y-4">
            <div>
              <Text type="secondary" className="mb-1 block text-xs uppercase tracking-wide">
                Төлөв
              </Text>
              {isStaff ? (
                <Select
                  className="w-full"
                  size="large"
                  value={property.status}
                  loading={statusSaving}
                  options={LISTING_STATUS_OPTIONS}
                  onChange={handleStatusChange}
                />
              ) : (
                <Tag color={LISTING_STATUS_COLOR[property.status] ?? "default"} className="!text-sm">
                  {property.status_display || property.status}
                </Tag>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {property.is_vip && <Tag color="gold">VIP</Tag>}
              {property.is_verified && <Tag color="blue">Баталгаажсан</Tag>}
              {property.is_active === false && <Tag>Идэвхгүй</Tag>}
              {(property.visibility_scopes || []).includes("public") && (
                <Tag color="green">Нийтэд</Tag>
              )}
              {(property.visibility_scopes || []).includes("company") && (
                <Tag>Company</Tag>
              )}
              {(property.visibility_scopes || []).includes("network") && (
                <Tag color="purple">Network</Tag>
              )}
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Үнэ">
                {formatListingPrice(property.price)}
              </Descriptions.Item>
              <Descriptions.Item label="Төрөл">
                {property.listing_type_display || property.listing_type}
              </Descriptions.Item>
              <Descriptions.Item label="Үл хөдлөх">
                {property.property_type_display || property.property_type}
              </Descriptions.Item>
              <Descriptions.Item label="Талбай">{property.area_m2} м²</Descriptions.Item>
              <Descriptions.Item label="Өрөө">{property.room_count}</Descriptions.Item>
              <Descriptions.Item label="Үзсэн">{property.views_count}</Descriptions.Item>
            </Descriptions>

            <Space direction="vertical" className="w-full">
              <Button
                type="primary"
                block
                size="large"
                icon={<EditOutlined />}
                onClick={() => setEditOpen(true)}
              >
                Засах
              </Button>
              <Button danger block size="large" icon={<DeleteOutlined />} onClick={handleDelete}>
                Архивлах
              </Button>
            </Space>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm" title="Дэлгэрэнгүй">
        <Paragraph className="whitespace-pre-wrap text-slate-700">
          {property.description || "Тайлбар байхгүй"}
        </Paragraph>
        <Descriptions
          className="mt-4"
          bordered
          size="small"
          column={{ xs: 1, sm: 2, lg: 3 }}
        >
          <Descriptions.Item label="Дүүрэг">
            {property.location_detail?.district_display || property.district}
          </Descriptions.Item>
          <Descriptions.Item label="Нөхцөл">
            {property.condition_display || property.condition}
          </Descriptions.Item>
          <Descriptions.Item label="Давхар">
            {property.floor ?? "—"}
            {property.total_floor != null ? ` / ${property.total_floor}` : ""}
          </Descriptions.Item>
          <Descriptions.Item label="Угаалгын өрөө">
            {property.bathroom_count ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Цонх">{property.window_count ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="Барилгын хийц">
            {property.building_type || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Баригдсан он">
            {property.year_built ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Гараж">{property.garage ? "Тийм" : "Үгүй"}</Descriptions.Item>
          <Descriptions.Item label="Тагт">{property.balcony ? "Тийм" : "Үгүй"}</Descriptions.Item>
          <Descriptions.Item label="Тавилгатай">
            {property.furnished ? "Тийм" : "Үгүй"}
          </Descriptions.Item>
          <Descriptions.Item label="Цахилгаан шат">
            {property.has_elevator ? "Тийм" : "Үгүй"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <ListingFormModal
        open={editOpen}
        editing={property}
        isStaff={isStaff}
        isCompanyAdmin={isCompanyAdmin}
        onClose={() => setEditOpen(false)}
        onSaved={(saved) => setProperty(saved)}
      />
    </div>
  );
}
