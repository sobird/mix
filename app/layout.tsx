import { Metadata } from 'next';
import { ConfigProvider } from 'antd';
import StyledComponentsRegistry from '@/lib/antdRegistry';
import mix from '@/assets/mix.svg';
import '@/styles/presets.scss';

export const metadata: Metadata = {
  title: 'Mix',
  // description: '',
  icons: mix.src,
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
