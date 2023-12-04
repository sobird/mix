/**
 * logger.ts
 *
 * sobird<i@sobird.me> at 2023/09/20 22:40:12 created.
 */

import { Store } from 'redux';

const logger = (store: Store) => {
  return (next) => {
    return (action) => {
      console.group(action.type);
      console.info('dispatching', action);
      const result = next(action);
      console.log('next state', store.getState());
      console.groupEnd();
      return result;
    };
  };
};

export default logger;
