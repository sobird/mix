import Verification from '@/components/email-template/authentication';
import CaptchaEmail from '@/components/email-template/captcha';
import reactToHtml from '@/lib/reactToHtml';

const Mail = async () => {
  const prerenderStaticComponent = await reactToHtml(<Verification url="https://sobird.me" />);
  const captchaEmailHtml = await reactToHtml(<CaptchaEmail code="123456" />);

  return (
    <div className="mail">
      <Verification url='https://sobird.me' />

      <div dangerouslySetInnerHTML={{ __html: prerenderStaticComponent }} />
      <div dangerouslySetInnerHTML={{ __html: captchaEmailHtml }} />
    </div>
  );
};

export default Mail;
