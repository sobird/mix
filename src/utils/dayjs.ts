/**
 * 日期处理类库
 *
 * @example
 * （1）今天：[dayjs().startOf('day'), dayjs().endOf('day')]
 * （2）最近一个月：[dayjs().subtract(1, 'months'), dayjs()]
 *
 * @see https://dayjsjs.com/docs/
 * sobird<i@sobird.me> at 2021/06/09 21:09:53 created.
 */

import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import duration from 'dayjs/plugin/duration';

const { parse, format } = dayjs.prototype;

/**
 * 设置中文本地化语言
 */
dayjs.locale('zh-cn');

/** 兼容 13位/10位 数字时间戳参数 */
dayjs.prototype.parse = function (config: any) {
  const { date } = config;
  if (Number.isInteger(date) && String(date).length === 10) {
    // eslint-disable-next-line no-param-reassign
    config.date = dayjs.unix(date);
  }
  return parse.bind(this)(config);
};

dayjs.prototype.format = function (formatStr: string = 'YYYY-MM-DD HH:mm:ss') {
  return format.bind(this)(formatStr);
};

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(duration);

/**
 * 设置默认的日期格式化
 */
// dayjs.defaultFormat = 'YYYY-MM-DD HH:mm:ss';

export default dayjs;
