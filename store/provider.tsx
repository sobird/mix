/**
 * Providing the Store
 *
 * To use this new makeStore function we need to create a new "client" component
 * that will create the store and share it using the React-Redux Provider component.
 *
 * sobird<i@sobird.me> at 2023/12/04 17:32:47 created.
 */

'use client';

// import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/store';
import { setCollapsed } from '@/store/slices/app';

export default function StoreProvider({
  test,
  children,
}: {
  // count: number
  children: React.ReactNode
}) {
  // const storeRef = useRef<AppStore | null>(null);
  // if (!storeRef.current) {
  //   storeRef.current = makeStore();
  //   // storeRef.current.dispatch(initializeApp(count));
  //   console.log('process.browser', process.browser);
  // }

  const store = makeStore();

  console.log('test', test);

  console.log('store', test.value === '1');

  store.dispatch(setCollapsed(true));

  console.log('store', store.getState());

  return <Provider store={store}>{children}</Provider>;
}
