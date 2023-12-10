import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import config from '@/styles/theme';
import StyledComponentsRegistry from '@/lib/antd';
import StoreProvider from '@/store/provider';
import mix from '@/assets/mix.svg';
import '@/styles/presets.scss';
import { TOGGLE_ASIDE } from '@/store/slices/app';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mix',
  // description: '',
  icons: mix.src,
};

export default function RootLayout({ children }: {
  children: React.ReactNode
}) {
  const cookieStore = cookies();
  const collapsedCookie = cookieStore.get(TOGGLE_ASIDE);

  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider locale={zhCN} prefixCls="mix" theme={config}>
          <StyledComponentsRegistry>
            {/* 全局store配置 */}
            <StoreProvider preloadedState={{
              app: {
                collapsed: collapsedCookie?.value === '1',
              },
            }}
            >
              {children}
            </StoreProvider>
          </StyledComponentsRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
