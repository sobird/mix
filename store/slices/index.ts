/**
 * Reducers
 *
 * sobird<i@sobird.me> at 2023/05/08 23:19:26 created.
 */

import { appSlice } from './app';
import menu from './menu';

export default {
  [appSlice.name]: appSlice.reducer,
  menu,
};
