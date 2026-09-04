"use client";

import Link from "next/link";
import {
  ArrowRightOutlined,
  BankOutlined,
  CreditCardOutlined,
  CrownOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Progress, Row, Spin, Statistic, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { fetchDashboardStats, fetchManageProperties } from "@/lib/api";
import { BRAND_COLOR } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";
import { portalPath, usePortal } from "@/providers/PortalProvider";
import type { DashboardStats, Property } from "@/types";

const { Title, Text, Paragraph } = Typography;

function formatPrice(value: string | number) {
  return `${Number(value).toLocaleString("mn-MN")}₮`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const portal = usePortal();
  const isStaff = Boolean(user?.is_staff);
  const isCompanyAdmin = Boolean(user?.is_company_admin);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentListings, setRecentListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashboardData, listingsData] = await Promise.all([
          fetchDashboardStats(),
          fetchManageProperties({ page: 1 }),
        ]);
        setStats(dashboardData);
        setRecentListings(listingsData.results.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: ColumnsType<Property> = [
    {
      title: "Гарчиг",
      dataIndex: "title",
      key: "title",
      render: (title: string, record) => (
        <Link href={`/properties/${record.id}`} className="font-medium text-[#183E95] hover:underline">
          {title}
        </Link>
      ),
    },
    {
      title: "Төрөл",
      dataIndex: "listing_type_display",
      key: "type",
    },
    {
      title: "Үнэ",
      dataIndex: "price",
      key: "price",
      render: (price: string) => formatPrice(price),
    },
    {
      title: "Төлөв",
      key: "status",
      render: (_, record) => (
        <div className="flex gap-1">
          {record.is_vip && <Tag color="gold">VIP</Tag>}
          {record.is_verified && <Tag color="blue">Баталгаажсан</Tag>}
        </div>
      ),
    },
    {
      title: "Үзсэн",
      dataIndex: "views_count",
      key: "views",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const usage = stats?.usage;
  const subscription = stats?.subscription;
  const listingsPercent = usage
    ? Math.min(100, Math.round((usage.listings_count / Math.max(usage.max_listings, 1)) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1">
            Тавтай морил
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            Таны үл хөдлөхийн удирдлагын самбар
          </Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} href="/post-property" size="large">
          Зар нэмэх
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Нийт зар"
              value={stats?.stats.total_listings ?? 0}
              prefix={<FileTextOutlined style={{ color: BRAND_COLOR }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Нийт үзсэн"
              value={stats?.stats.total_views ?? 0}
              prefix={<EyeOutlined style={{ color: BRAND_COLOR }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="VIP зар"
              value={stats?.stats.vip_listings ?? 0}
              prefix={<CrownOutlined style={{ color: "#d4a017" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Захиалга"
              value={stats?.stats.active_subscription ? "Идэвхтэй" : "Байхгүй"}
              valueStyle={{
                color: stats?.stats.active_subscription ? "#52c41a" : "#8c8c8c",
                fontSize: 20,
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {[
          {
            href: portalPath(portal.basePath, "listings"),
            icon: <FileTextOutlined style={{ fontSize: 24, color: BRAND_COLOR }} />,
            title: "Зaruud",
            desc: isStaff
              ? "Бүх зар"
              : isCompanyAdmin
                ? "Компанийн зарууд"
                : "Өөрийн зарууд",
          },
          ...(portal.mode === "staff" && isStaff
            ? [
                {
                  href: portalPath(portal.basePath, "companies"),
                  icon: <BankOutlined style={{ fontSize: 24, color: BRAND_COLOR }} />,
                  title: "Компаниуд",
                  desc: "Байгууллага удирдлага",
                },
              ]
            : []),
          ...(isStaff || isCompanyAdmin
            ? [
                {
                  href: portalPath(portal.basePath, "agents"),
                  icon: <TeamOutlined style={{ fontSize: 24, color: BRAND_COLOR }} />,
                  title: "Агентүүд",
                  desc: isStaff ? "Бүх агент" : "Компанийн агентууд",
                },
                {
                  href: portalPath(portal.basePath, "invites"),
                  icon: <TeamOutlined style={{ fontSize: 24, color: BRAND_COLOR }} />,
                  title: "Урилга",
                  desc: "Код & бүртгэл батлах",
                },
              ]
            : []),
          ...(stats?.has_agent_profile
            ? [
                {
                  href: portalPath(portal.basePath, "subscription"),
                  icon: <CreditCardOutlined style={{ fontSize: 24, color: BRAND_COLOR }} />,
                  title: "Захиалга",
                  desc: "Багц, subscription",
                },
              ]
            : []),
          ...(portal.mode === "staff" && isStaff
            ? [
                {
                  href: portalPath(portal.basePath, "packages"),
                  icon: <SettingOutlined style={{ fontSize: 24, color: BRAND_COLOR }} />,
                  title: "Багцууд",
                  desc: "Package удирдлага",
                },
              ]
            : []),
        ].map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.href}>
            <Link href={item.href}>
              <Card className="shadow-sm transition hover:shadow-md" hoverable>
                <div className="flex items-center gap-3">
                  {item.icon}
                  <div>
                    <Text strong>{item.title}</Text>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {stats?.has_agent_profile && (
          <Col xs={24} lg={10}>
            <Card
              title="Захиалгын хэрэглээ"
              className="shadow-sm h-full"
              extra={
                <Link href={portalPath(portal.basePath, "subscription")}>
                  <Button type="link" icon={<ArrowRightOutlined />}>
                    Удирдах
                  </Button>
                </Link>
              }
            >
              {subscription ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Text strong>{subscription.package.name}</Text>
                      <Tag color="green">{subscription.status_display}</Tag>
                    </div>
                    <Text type="secondary" className="text-sm">
                      {subscription.days_remaining} хоног үлдсэн
                    </Text>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Зар</span>
                      <span>
                        {usage?.listings_count} / {usage?.max_listings}
                      </span>
                    </div>
                    <Progress percent={listingsPercent} strokeColor={BRAND_COLOR} />
                  </div>
                  {usage && usage.max_vip_listings > 0 && (
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>VIP зар</span>
                        <span>
                          {usage.vip_listings_count} / {usage.max_vip_listings}
                        </span>
                      </div>
                      <Progress
                        percent={Math.min(
                          100,
                          Math.round(
                            (usage.vip_listings_count / Math.max(usage.max_vip_listings, 1)) * 100,
                          ),
                        )}
                        strokeColor="#d4a017"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Text type="secondary">Идэвхтэй захиалга байхгүй</Text>
                  <div className="mt-3">
                    <Button type="primary" href={portalPath(portal.basePath, "subscription")}>
                      Багц сонгох
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        )}
        <Col xs={24} lg={stats?.has_agent_profile ? 14 : 24}>
          <Card
            title="Сүүлийн зарууд"
            className="shadow-sm"
            extra={
              <Link href={portalPath(portal.basePath, "listings")}>
                <Button type="link">Бүгдийг харах</Button>
              </Link>
            }
          >
            <Table
              columns={columns}
              dataSource={recentListings}
              rowKey="id"
              pagination={false}
              size="middle"
              locale={{ emptyText: "Одоогоор зар байхгүй" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
