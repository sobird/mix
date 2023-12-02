/**
 * 发送验证码电子邮件模板组件
 *
 * sobird<i@sobird.me> at 2023/12/02 20:52:40 created.
 */

const Verification = () => {
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
    <body style={{
      background: '#f9f9f9',
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
            Sign in to
            {' '}
            <strong>
              Mix
            </strong>
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
                    Sign
                    in
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
            If you did not request this email you can safely ignore it.
          </td>
        </tr>
      </table>
    </body>
  );
};

export default Verification;
