/**
 * 登录验证
 *
 * sobird<i@sobird.me> at 2023/11/29 22:38:08 created.
 */
import Image from 'next/image';
import { Metadata } from 'next';
import { Result, Button } from 'antd';
import mix from '@/assets/mix.svg';
import { getEmailLoginUrl } from '@/utils/emailLogin';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: '登录电子邮箱',
};

export default function Home({ searchParams }: any) {
  const emailLoginUrl = getEmailLoginUrl(decodeURIComponent(searchParams.email));
  return (
    <div>
      <Result
        status="success"
        title="发送邮件成功"
        subTitle="我们已向您的邮箱发送了一封登录邮件，请点击邮件中的链接完成登录"
        extra={<Button type="primary" href={emailLoginUrl} target="_blank">进入邮箱查收登录邮件</Button>}
      >
        <div className={styles.suggest}>
          <h3>没收到邮件怎么办？</h3>
          <ol>
            <li>请检查邮箱地址是否正确，您可 重置</li>
            <li>邮箱是否误将该邮件归类为垃圾邮件</li>
            <li>
              若仍未收到邮件，请登录你的邮箱将
              <strong style={{ color: '#777' }}>{process.env.EMAIL_FROM}</strong>
              加入白名单
            </li>
          </ol>
        </div>
      </Result>
    </div>
  );
}
