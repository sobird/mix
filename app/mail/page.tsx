import getData from '@/lib/renderReactElement';

import Verification from '@/components/email-template/verification';

const Mail = async () => {
  const prerenderStaticComponent = await getData(<Verification url="https://sobird.me" />);

  return (
    <div className="mail">
      <Verification />
      <div dangerouslySetInnerHTML={{ __html: prerenderStaticComponent }} />
    </div>
  );
};

export default Mail;
