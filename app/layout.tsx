import { Metadata } from 'next';
import { ConfigProvider } from 'antd';
import StyledComponentsRegistry from '@/lib/antdRegistry';
import '@/styles/presets.scss';

export const metadata: Metadata = {
  title: 'Next.js',
  description: 'Generated by Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ConfigProvider prefixCls="mix">
          <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
