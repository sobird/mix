import getData from '@/app/precompile';

import Verification from '@/components/mail-style/verification';

const Mail = async () => {
  const prerenderStaticComponent = await getData(<Verification />);

  console.log('prerenderStaticComponent', prerenderStaticComponent);
  return (
    <div className="mail">
      mail
      <Verification />
      <div dangerouslySetInnerHTML={{ __html: prerenderStaticComponent }} />
    </div>
  );
};

export default Mail;
