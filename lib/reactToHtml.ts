/**
 * ReactDOMServer Methods
 *
 * @see https://github.com/vercel/next.js/issues/43810
 * sobird<i@sobird.me> at 2023/12/02 22:15:09 created.
 */

import { ReactElement } from 'react';
import { type PipeableStream } from 'react-dom/server';

interface ReactDOMServerMethodReturn {
  renderToString: string;
  renderToNodeStream: NodeJS.ReadableStream;
  renderToPipeableStream: PipeableStream;
  renderToStaticMarkup: string;
  renderToStaticNodeStream: NodeJS.ReadableStream;
}

type ReactDOMServerMethod = keyof ReactDOMServerMethodReturn;

const renderReactElement = async <T extends ReactDOMServerMethod = 'renderToStaticMarkup'>(element: ReactElement, method?: T) => {
  const ReactDOMServer = (await import('react-dom/server')).default;
  return ReactDOMServer[method || 'renderToStaticMarkup'](element) as ReactDOMServerMethodReturn[T];
};

export default renderReactElement;
