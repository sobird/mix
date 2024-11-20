/**
 * 发送身份认证登录链接电子邮件模板组件
 *
 * sobird<i@sobird.me> at 2023/12/02 20:52:40 created.
 */

// eslint-disable-next-line import/no-webpack-loader-syntax
import mix from '!raw-loader!@/assets/mix.svg';

const buff = Buffer.from(mix);
const base64data = buff.toString('base64');

interface AuthenticationProps {
  /** user sign in url */
  url: string;
}

const Authentication: React.FC<AuthenticationProps> = ({ url }) => {
  const brandColor = '#346df1';

  const color = {
    background: '#f9f9f9',
    text: '#888',
    mainBackground: '#fff',
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: '#fff',
  };

  return (
    <div style={{
      background: '#F7F9F9',
      padding: 20,
    }}
    >
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
          position: 'relative',
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
          <td align="center" style={{ padding: '10px 0' }}>
            <table border={0} cellSpacing="0" cellPadding="0">
              <tr>
                <td align="center" style={{ lineHeight: 'normal' }}>
                  <a
                    href={url}
                    target="_blank"
                    style={{
                      fontSize: '18px',
                      color: `${color.buttonText}`,
                      textDecoration: 'none',
                      borderRadius: '5px',
                      padding: '7px 20px',
                      border: `1px solid ${color.buttonBorder}`,
                      backgroundColor: `${color.buttonBackground}`,
                      display: 'inline-block',
                      fontWeight: 'bold',
                    }}
                    rel="noreferrer"
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
              padding: '10px 0px',
              fontSize: '14px',
              lineHeight: '22px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              color: `${color.text}`,
            }}
          >
            若非本人请求此电子邮件，请忽略
          </td>
        </tr>
      </table>
    </div>
  );
};

export default Authentication;
