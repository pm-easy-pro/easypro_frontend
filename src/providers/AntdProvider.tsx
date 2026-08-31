"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import mnMN from "antd/locale/mn_MN";

import { antdTheme } from "@/lib/theme";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={antdTheme} locale={mnMN}>
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
