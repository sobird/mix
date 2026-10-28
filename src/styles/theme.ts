/**
 * antd theme token
 *
 * sobird<i@sobird.me> at 2023/10/20 10:26:16 created.
 */

import { theme, ThemeConfig } from 'antd';

// const defaultToken = theme.defaultConfig.token;

const config: ThemeConfig = {
  token: {
    borderRadius: 4,
    // controlHeight: 28

    // disabled
    // colorBgContainerDisabled: '#fff',
    // colorTextDisabled: '#444',
    motion: false,

    fontFamily: '',
    fontSize: 14,
  },
  components: {
    Breadcrumb: {
      /* here is your component tokens */
      // linkHoverColor: defaultToken.blue,
      separatorColor: '#c0c4cc',
    },
    Form: {
      itemMarginBottom: 20,
      labelColor: '#333',

    },
    Alert: {
      fontSize: 12,
      fontSizeLG: 14,
      paddingContentVerticalSM: 15,
    },
    Badge: {
      textFontSize: 12,
    },
    Notification: {
      motion: false,
    },
    Upload: {

    },
  },
};

export default config;
