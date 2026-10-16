"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import { ListingFormModal } from "@/components/dashboard/ListingFormModal";
import {
  LISTING_STATUS_COLOR,
  formatListingPrice,
  listingCoverUrl,
} from "@/components/dashboard/listingForm";
import { getPostPropertyHref } from "@/lib/auth-routes";
import { fetchManageProperties } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { portalPath, usePortal } from "@/providers/PortalProvider";
import type { Property } from "@/types";

const { Title, Paragraph } = Typography;

export default function DashboardListingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const portal = usePortal();
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
  const [createOpen, setCreateOpen] = useState(false);

  const detailHref = (id: number) => portalPath(portal.basePath, `listings/${id}`);

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

  const subtitle = isStaff
    ? "Бүх зарыг удирдах — дэлгэрэнгүй хуудаснаас засах, архивлах"
    : isCompanyAdmin
      ? "Зөвхөн өөрийн компанийн агент болон зарууд"
      : "Зөвхөн өөрийн зарууд";

  const columns: ColumnsType<Property> = [
    {
      title: "Зураг",
      key: "image",
      width: 88,
      render: (_, record) => {
        const src = listingCoverUrl(record);
        return (
          <Link
            href={detailHref(record.id)}
            className="relative block h-14 w-16 overflow-hidden rounded-lg bg-slate-100"
          >
            {src ? (
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                unoptimized
                sizes="64px"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-[10px] text-slate-400">
                Зураггүй
              </span>
            )}
          </Link>
        );
      },
    },
    {
      title: "Гарчиг",
      dataIndex: "title",
      key: "title",
      render: (title: string, record) => (
        <div>
          <Link
            href={detailHref(record.id)}
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
      render: (price: string) => formatListingPrice(price),
    },
    {
      title: "Төлөв",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string, record: Property) => (
        <Tag color={LISTING_STATUS_COLOR[status] ?? "default"}>
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setCreateOpen(true)}
          >
            Шинэ зар
          </Button>
          <Button icon={<PlusOutlined />} href={getPostPropertyHref()} size="large">
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
          onRow={(record) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement;
              if (target.closest("a,button,.ant-tag")) return;
              router.push(detailHref(record.id));
            },
            className: "cursor-pointer",
          })}
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

      <ListingFormModal
        open={createOpen}
        editing={null}
        isStaff={isStaff}
        isCompanyAdmin={isCompanyAdmin}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          void load(page, query, statusFilter);
        }}
      />
    </div>
  );
}
