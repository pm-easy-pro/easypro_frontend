"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppstoreOutlined,
  BankOutlined,
  CreditCardOutlined,
  GiftOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SettingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Menu, theme, Typography } from "antd";
import { useMemo, useState } from "react";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";
import { getPostPropertyHref } from "@/lib/auth-routes";
import { getMainSiteUrl } from "@/lib/portals";
import { BRAND_COLOR } from "@/lib/theme";
import { portalPath, usePortal } from "@/providers/PortalProvider";
import { useAuth } from "@/providers/AuthProvider";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SEGMENT_LABELS: Record<string, string> = {
  listings: "Зарууд",
  companies: "Компаниуд",
  agents: "Агентүүд",
  invites: "Урилга & бүртгэл",
  subscription: "Захиалга",
  packages: "Багцууд",
  profile: "Профайл",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const portal = usePortal();
  const { token } = theme.useToken();

  const isStaff = Boolean(user?.is_staff);
  const isOrg = user?.agent_profile?.agent_type === "organization";
  const isCompanyAdmin = Boolean(user?.is_company_admin) || isOrg;
  const hasAgent = Boolean(user?.agent_profile);

  const postPropertyHref = getPostPropertyHref();

  const menuItems = useMemo(() => {
    const p = portal.basePath;
    const items = [
      { key: p, icon: <HomeOutlined />, label: "Тойм" },
      { key: portalPath(p, "listings"), icon: <UnorderedListOutlined />, label: "Зарууд" },
    ];
    if (portal.mode === "agent") {
      items.push({ key: portalPath(p, "profile"), icon: <UserOutlined />, label: "Профайл" });
      items.push({
        key: postPropertyHref,
        icon: <PlusOutlined />,
        label: "Зар нэмэх",
      });
      return items;
    }
    if (portal.mode === "staff" && isStaff) {
      items.push({ key: portalPath(p, "companies"), icon: <BankOutlined />, label: "Компаниуд" });
    }
    if (isStaff || isCompanyAdmin) {
      items.push({ key: portalPath(p, "agents"), icon: <TeamOutlined />, label: "Агентүүд" });
      items.push({ key: portalPath(p, "invites"), icon: <GiftOutlined />, label: "Урилга & бүртгэл" });
    }
    if (hasAgent) {
      items.push({
        key: portalPath(p, "subscription"),
        icon: <CreditCardOutlined />,
        label: "Захиалга",
      });
    }
    if (portal.mode === "staff" && isStaff) {
      items.push({
        key: portalPath(p, "packages"),
        icon: <SettingOutlined />,
        label: "Багцууд",
      });
    }
    items.push({
      key: postPropertyHref,
      icon: <PlusOutlined />,
      label: "Зар нэмэх",
    });
    return items;
  }, [hasAgent, isStaff, isCompanyAdmin, portal.basePath, portal.mode, postPropertyHref]);

  const selectedKey = useMemo(() => {
    const exact = menuItems.find((item) => pathname === item.key);
    if (exact) return exact.key;

    const prefixMatch = [...menuItems]
      .filter((item) => item.key !== portal.basePath && pathname.startsWith(`${item.key}/`))
      .sort((a, b) => b.key.length - a.key.length)[0];
    if (prefixMatch) return prefixMatch.key;

    if (pathname.startsWith(portal.basePath)) return portal.basePath;
    return menuItems[0]?.key ?? portal.basePath;
  }, [menuItems, pathname, portal.basePath]);

  const breadcrumbTitle = useMemo(() => {
    if (pathname === portal.basePath) return "Тойм";
    const segment = pathname.replace(`${portal.basePath}/`, "").split("/")[0];
    return SEGMENT_LABELS[segment] ?? portal.homeLabel;
  }, [pathname, portal.basePath, portal.homeLabel]);

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: user?.agent_profile?.display_label ?? user?.username,
        disabled: true,
      },
      { type: "divider" as const },
      {
        key: "site",
        icon: <AppstoreOutlined />,
        label: "Вэбсайт руу",
        onClick: () => {
          window.location.assign(getMainSiteUrl("/"));
        },
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Гарах",
        danger: true,
        onClick: () => {
          logout();
          router.push(portal.loginPath);
        },
      },
    ],
  };

  const navigateMenu = (key: string) => {
    if (key.startsWith("http://") || key.startsWith("https://")) {
      window.location.assign(key);
      return;
    }
    router.push(key);
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{ background: BRAND_COLOR }}
        className="!fixed left-0 top-0 z-50 h-screen"
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
          <EasyProLogoMark />
          {!collapsed && (
            <span className="text-base font-bold text-white">EasyPro</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          className="dashboard-sider-menu"
          style={{ background: "transparent", borderRight: 0 }}
          items={menuItems}
          onClick={({ key }) => navigateMenu(key)}
        />
        {!collapsed && (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/10 p-3">
            <Text className="!text-xs !text-white/70">
              {portal.mode === "company"
                ? "Компанийн админ"
                : portal.mode === "agent"
                  ? "Агент"
                  : isStaff
                    ? "Системийн админ"
                    : hasAgent
                      ? "Агент"
                      : "Хэрэглэгч"}
            </Text>
            <div className="mt-1 truncate text-sm font-medium text-white">
              {user?.agent_profile?.company_name ||
                user?.agent_profile?.display_label ||
                user?.username}
            </div>
            {isCompanyAdmin && user?.agent_profile?.company_name ? (
              <div className="mt-0.5 truncate text-[11px] text-white/60">
                {user.agent_profile.company_name}
              </div>
            ) : null}
          </div>
        )}
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: "margin-left 0.2s" }}>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: "0 24px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Breadcrumb
              items={[
                { title: <Link href={portal.basePath}>{portal.homeLabel}</Link> },
                { title: breadcrumbTitle },
              ]}
            />
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <button type="button" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50">
              <Avatar size="small" icon={<UserOutlined />} style={{ background: BRAND_COLOR }} />
              <span className="hidden text-sm font-medium sm:inline">{user?.username}</span>
            </button>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, background: "#f5f7fb", minHeight: "calc(100vh - 64px)" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
