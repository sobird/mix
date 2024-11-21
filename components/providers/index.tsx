/**
 * Next-Auth Providers
 *
 * sobird<i@sobird.me> at 2024/11/21 21:05:11 created.
 */

import { Button } from 'antd';
import Image from 'next/image';
import { getProviders } from 'next-auth/react';

import { getCsrfAuthToken } from '@/services/auth';

import styles from './index.module.scss';

interface ProvidersProps {
  callbackUrl: string;
}

const Providers:React.FC<ProvidersProps> = async ({ callbackUrl }) => {
  const csrfToken = await getCsrfAuthToken();
  console.log('await getProviders()', await getProviders());
  const providers = Object.entries(await getProviders() || {}).map(([, item]) => {
    return item;
  }).filter((item) => {
    return item.type === 'oauth';
  });

  return (
    <div className={styles.container}>
      {providers.map((provider) => {
        return (
          <div key={provider.id} className="provider">
            <form action={provider.signinUrl} method="POST">
              <input type="hidden" name="csrfToken" value={csrfToken} />
              {callbackUrl && (
                <input
                  type="hidden"
                  name="callbackUrl"
                  value={callbackUrl}
                />
              )}

              <Button
                htmlType="submit"
                shape="circle"
                title={provider.name}
                icon={<Image src={`/img/providers/${provider.id}.svg`} alt={provider.name} width={20} height={20} />}
              />
            </form>

          </div>
        );
      })}
    </div>

  );
};

export default Providers;
