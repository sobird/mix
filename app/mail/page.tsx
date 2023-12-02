import getData from '@/lib/renderReactElement';

import Verification from '@/components/email-template/verification';

const Mail = async () => {
  const prerenderStaticComponent = await getData(<Verification />);
  const prerenderStaticComponent2 = await getData(<Verification />, 'renderToString');

  console.log('prerenderStaticComponent', prerenderStaticComponent);

  console.log('prerenderStaticComponent', prerenderStaticComponent2);

  return (
    <div className="mail">
      mail
      <Verification />
      <div dangerouslySetInnerHTML={{ __html: prerenderStaticComponent }} />
    </div>
  );
};

export default Mail;
