/**
 * 菜单项带徽章
 *
 * sobird<i@sobird.me> at 2023/09/24 0:45:20 created.
 */

import React, { PropsWithChildren } from 'react';
import { Badge } from 'antd';

interface TitleWithBadgeProps {
  badge: any;
}

const TitleWithBadge: React.FC<PropsWithChildren<TitleWithBadgeProps>> = ({ children, badge }) => {
  if (!badge) {
    return children;
  }
  const { noticeStyle, noticeContent } = badge;

  let titleNode = children;

  switch (noticeStyle) {
    case 10:
      titleNode = <Badge dot>{children}</Badge>;
      break;
    case 20:
      titleNode = <Badge offset={[10, 0]} count={noticeContent}>{children}</Badge>;
      break;
    case 30:
      titleNode = <Badge status="success" text={noticeContent}>{children}</Badge>;
      break;
    default:
      titleNode = <Badge dot>{children}</Badge>;
      break;
  }

  return titleNode;
};

export default TitleWithBadge;
