"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Col, Row, Statistic, Typography } from "antd";
import { PlusOutlined, UnorderedListOutlined } from "@ant-design/icons";

import { getPostPropertyHref } from "@/lib/auth-routes";
import { fetchManageProperties } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

const { Title, Paragraph } = Typography;

export default function AgentPortalHomePage() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManageProperties({ page: 1 })
      .then((data) => setCount(data.count || 0))
      .catch(() => setCount(0))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          Сайн байна уу,{" "}
          {user?.agent_profile?.display_label || user?.display_name || user?.username}
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Өөрийн зар болон профайлаа эндээс удирдана
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic title="Миний зарууд" value={count} />
          </Card>
        </Col>
      </Row>

      <div className="flex flex-wrap gap-3">
        <Link href="/portal/agent/listings">
          <Button icon={<UnorderedListOutlined />}>Зарууд</Button>
        </Link>
        <a href={getPostPropertyHref()}>
          <Button type="primary" icon={<PlusOutlined />}>
            Зар нэмэх
          </Button>
        </a>
        <Link href="/portal/agent/profile">
          <Button>Профайл</Button>
        </Link>
      </div>
    </div>
  );
}
