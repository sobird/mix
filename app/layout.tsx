import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import config from '@/styles/theme';
import StyledComponentsRegistry from '@/lib/antdRegistry';
import StoreProvider from '@/store/provider';
import mix from '@/assets/mix.svg';
import '@/styles/presets.scss';

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
  console.log('cookieStore', cookieStore);

  const TOGGLE_ASIDE = cookieStore.get('TOGGLE_ASIDE');
  console.log('TOGGLE_ASIDE', TOGGLE_ASIDE);
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider prefixCls="mix" theme={config}>
          <StyledComponentsRegistry><StoreProvider test={TOGGLE_ASIDE}>{children}</StoreProvider></StyledComponentsRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
