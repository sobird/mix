/**
 * ReactDOMServer
 *
 * @see https://github.com/vercel/next.js/issues/43810
 * sobird<i@sobird.me> at 2023/12/02 22:15:09 created.
 */

import { ReactElement } from 'react';

type ReactDOMServerMethod = 'renderToString' | 'renderToNodeStream' | 'renderToPipeableStream' | 'renderToStaticMarkup' | 'renderToStaticNodeStream';

const renderReactElement = async (element: ReactElement, method: ReactDOMServerMethod = 'renderToStaticMarkup') => {
  const ReactDOMServer = (await import('react-dom/server')).default;
  return ReactDOMServer[method](element as any);
};

export default renderReactElement;
