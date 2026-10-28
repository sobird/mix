/**
 * 登录验证
 *
 * sobird<i@sobird.me> at 2023/11/29 22:38:08 created.
 */
import { Result, Button } from 'antd';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '注册成功',
};

export default function Home() {
  return (
    <div>
      <Result
        status="success"
        title="注册账号成功"
        subTitle="欢迎您的加入，开始登录使用吧"
        extra={<Link href="/signin"><Button type="primary">现在登录</Button></Link>}
      />
    </div>
  );
}
