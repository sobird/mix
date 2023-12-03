import getData from '@/lib/renderReactElement';

import Verification from '@/components/email-template/verification';
import Mix from '@/assets/mix';

const Mail = async () => {
  const prerenderStaticComponent = await getData(<Verification url="https://sobird.me" />);

  return (
    <div className="mail">
      {/* <Verification /> */}
      <Mix />
      <div dangerouslySetInnerHTML={{ __html: prerenderStaticComponent }} />
    </div>
  );
};

export default Mail;
