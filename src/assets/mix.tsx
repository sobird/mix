'use client';

/**
 * mix logo
 *
 * sobird<i@sobird.me> at 2023/12/03 0:17:13 created.
 */

import React, { FC, ReactSVGElement } from 'react';

const styles = `.path {
  fill: #2c3e50;
  fill-rule: evenodd;
}

@media (prefers-color-scheme: dark) {
  .path {
    fill: #ffffff;
  }
}`;
const Mix: FC<ReactSVGElement['props']> = (props) => {
  return (
    <svg
      className="mix"
      viewBox="0 0 1024 1024"
      width={48}
      height={48}
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        {/* eslint-disable-next-line react/no-danger */}
        {/* <style dangerouslySetInnerHTML={{ __html: styles }} /> */}
        <style jsx>
          {`
        .demo {
          color: black;
        }
      `}
        </style>
      </defs>
      <path
        className="demo"
        {...props}
        d="M887.893333 896H981.333333L640 128l-128 287.573333L384 128 42.666667 896h92.8L384 337.706667l81.28 182.613333L298.666667 896h426.666666l-167.04-375.68L640 337.706667z m-293.76-85.333333h-164.906666L512 625.28z"
      />
    </svg>
  );
};

export default Mix;
