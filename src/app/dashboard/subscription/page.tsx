"use client";

import { CheckOutlined, CrownOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  message,
  Modal,
  Progress,
  Row,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import {
  cancelSubscription,
  fetchMySubscription,
  fetchSubscriptionHistory,
  fetchSubscriptionPackages,
  subscribeToPackage,
} from "@/lib/api";
import { BRAND_COLOR } from "@/lib/theme";
import type { Subscription, SubscriptionPackage, SubscriptionUsage } from "@/types";

const { Title, Text, Paragraph } = Typography;

function formatPrice(value: string | number) {
  return `${Number(value).toLocaleString("mn-MN")}₮`;
}

export default function DashboardSubscriptionPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [agentType, setAgentType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subData, historyData] = await Promise.all([
        fetchMySubscription(),
        fetchSubscriptionHistory(),
      ]);
      setSubscription(subData.subscription);
      setUsage(subData.usage);
      setAgentType(subData.agent_type);
      setHistory(historyData.results);
      const pkgs = await fetchSubscriptionPackages(subData.agent_type);
      setPackages(pkgs);
    } catch {
      message.error("Захиалгын мэдээлэл ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubscribe = async (packageId: number, packageName: string) => {
    Modal.confirm({
      title: "Багц идэвхжүүлэх",
      content: `«${packageName}» багцыг идэвхжүүлэх үү?`,
      okText: "Тийм",
      cancelText: "Үгүй",
      onOk: async () => {
        setSubscribing(packageId);
        try {
          const result = await subscribeToPackage(packageId);
          message.success(result.message);
          await load();
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            "Алдаа гарлаа";
          message.error(typeof msg === "string" ? msg : "Алдаа гарлаа");
        } finally {
          setSubscribing(null);
        }
      },
    });
  };

  const handleCancel = () => {
    Modal.confirm({
      title: "Захиалга цуцлах",
      content: "Та захиалгаа цуцлахдаа итгэлтэй байна уу?",
      okText: "Цуцлах",
      okType: "danger",
      cancelText: "Болих",
      onOk: async () => {
        try {
          const result = await cancelSubscription();
          message.success(result.message);
          await load();
        } catch {
          message.error("Цуцлахад алдаа гарлаа");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const isOrg = agentType === "organization";
  const listingsPercent = usage
    ? Math.min(100, Math.round((usage.listings_count / Math.max(usage.max_listings, 1)) * 100))
    : 0;

  const statusColor: Record<string, string> = {
    active: "green",
    trial: "blue",
    cancelled: "default",
    expired: "red",
  };

  const historyColumns: ColumnsType<Subscription> = [
    {
      title: "Багц",
      key: "package",
      render: (_, record) => record.package.name,
    },
    {
      title: "Үнэ",
      key: "price",
      render: (_, record) => formatPrice(record.package.price),
    },
    {
      title: "Төлөв",
      dataIndex: "status",
      key: "status",
      render: (status: string, record) => (
        <Tag color={statusColor[status] ?? "default"}>{record.status_display}</Tag>
      ),
    },
    {
      title: "Эхэлсэн",
      dataIndex: "started_at",
      key: "started",
      render: (date: string) => new Date(date).toLocaleDateString("mn-MN"),
    },
    {
      title: "Дуусах",
      dataIndex: "expires_at",
      key: "expires",
      render: (date: string) => new Date(date).toLocaleDateString("mn-MN"),
    },
    {
      title: "Авто сунгалт",
      dataIndex: "auto_renew",
      key: "auto_renew",
      render: (val: boolean) => (val ? "Тийм" : "Үгүй"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          Захиалга
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          {isOrg ? "Байгууллагын" : "Агентийн"} багц сонгоод удирдана уу
        </Paragraph>
      </div>

      {subscription && usage && (
        <Card className="shadow-sm" style={{ borderColor: BRAND_COLOR }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Title level={4} className="!mb-0">
                  {subscription.package.name}
                </Title>
                <Tag color="green">{subscription.status_display}</Tag>
                {subscription.package.is_popular && <Tag color="gold">Түгээмэл</Tag>}
              </div>
              <Text type="secondary">
                {formatPrice(subscription.package.price)} / {subscription.package.billing_period_display} ·{" "}
                {subscription.days_remaining} хоног үлдсэн
              </Text>
            </div>
            <Button danger onClick={handleCancel}>
              Захиалга цуцлах
            </Button>
          </div>
          <Row gutter={24} className="mt-6">
            <Col xs={24} md={12}>
              <div className="mb-1 flex justify-between text-sm">
                <span>Зарын хязгаар</span>
                <span>
                  {usage.listings_count} / {usage.max_listings}
                </span>
              </div>
              <Progress percent={listingsPercent} strokeColor={BRAND_COLOR} />
            </Col>
            {usage.max_vip_listings > 0 && (
              <Col xs={24} md={12}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    <CrownOutlined className="mr-1 text-amber-500" />
                    VIP зар
                  </span>
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
              </Col>
            )}
          </Row>
        </Card>
      )}

      <div>
        <Title level={4} className="!mb-4">
          {subscription ? "Багц солих" : "Багц сонгох"}
        </Title>
        <Row gutter={[16, 16]}>
          {packages.map((pkg) => {
            const isCurrent = subscription?.package.id === pkg.id;
            return (
              <Col xs={24} md={12} lg={8} key={pkg.id}>
                <Card
                  className={`h-full shadow-sm transition hover:shadow-md ${
                    pkg.is_popular ? "ring-2 ring-amber-400" : ""
                  }`}
                  style={isCurrent ? { borderColor: BRAND_COLOR, borderWidth: 2 } : undefined}
                >
                  {pkg.is_popular && (
                    <Tag color="gold" className="mb-2">
                      Түгээмэл
                    </Tag>
                  )}
                  <Title level={4}>{pkg.name}</Title>
                  <div className="mb-2">
                    <span className="text-3xl font-bold" style={{ color: BRAND_COLOR }}>
                      {formatPrice(pkg.price)}
                    </span>
                    <Text type="secondary" className="ml-1">
                      / {pkg.billing_period_display}
                    </Text>
                  </div>
                  <Paragraph type="secondary" className="text-sm">
                    {pkg.description}
                  </Paragraph>
                  <ul className="mb-6 space-y-2">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckOutlined className="mt-0.5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type={pkg.is_popular ? "primary" : "default"}
                    block
                    size="large"
                    disabled={isCurrent}
                    loading={subscribing === pkg.id}
                    onClick={() => handleSubscribe(pkg.id, pkg.name)}
                  >
                    {isCurrent ? "Одоогийн багц" : "Сонгох"}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      <Card title="Захиалгын түүх" className="shadow-sm">
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: "Захиалгын түүх байхгүй" }}
        />
      </Card>
    </div>
  );
}
