/**
 * 发送验证码电子邮件模板组件
 *
 * sobird<i@sobird.me> at 2023/12/02 20:52:40 created.
 */

import { FC } from 'react';
// eslint-disable-next-line import/no-webpack-loader-syntax
import mix from '!raw-loader!@/assets/mix.svg';
import Mix from '@/assets/mix';
import Mix2 from '@/assets/mix.svg';

const buff = Buffer.from(mix);
const base64data = buff.toString('base64');

interface VerificationProps {

}

const Verification: FC<VerificationProps> = () => {
  // const escapedHost = host.replace(/\./g, '&#8203;.');

  const brandColor = '#346df1';

  const color = {
    background: '#f9f9f9',
    text: '#444',
    mainBackground: '#fff',
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: '#fff',
  };

  return (
    <div style={{
      background: '#F7F9F9',
    }}
    >
      <Mix fill="red" />
      <table
        width="100%"
        border={0}
        cellSpacing="20"
        cellPadding="0"
        style={{
          background: `${color.mainBackground}`,
          maxWidth: 600,
          margin: 'auto',
          borderRadius: 10,
        }}
      >
        <tr>
          <td
            align="center"
            style={{
              padding: '10px 0px',
              fontSize: '22px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              color: `${color.text}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/svg+xml;base64,${base64data}`} width={48} height={48} alt="mix" />
          </td>
        </tr>
        <tr>
          <td align="center" style={{ padding: '20px 0' }}>
            <table border={0} cellSpacing="0" cellPadding="0">
              <tr>
                <td align="center" style={{ borderRadius: '5px', backgroundColor: `${color.buttonBackground}` }}>
                  <a
                    href="/test"
                    target="_blank"
                    style={{
                      fontSize: '18px',
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      color: `${color.buttonText}`,
                      textDecoration: 'none',
                      borderRadius: '5px',
                      padding: '10px 20px',
                      border: `1px solid ${color.buttonBorder}`,
                      display: 'inline-block',
                      fontWeight: 'bold',
                    }}
                  >
                    登录
                  </a>

                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td
            align="center"
            style={{
              padding: '0',
              fontSize: '16px',
              lineHeight: '22px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              color: `${color.text}`,
            }}
          >
            如果您没有请求此电子邮件，您可以放心地忽略它。
          </td>
        </tr>
      </table>
    </div>
  );
};

export default Verification;
