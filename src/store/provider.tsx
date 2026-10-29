/**
 * Providing the Store
 *
 * To use this new makeStore function we need to create a new "client" component
 * that will create the store and share it using the React-Redux Provider component.
 *
 * sobird<i@sobird.me> at 2023/12/04 17:32:47 created.
 */

'use client';

import { useState, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { makeStore, AppStore, RootState } from '@/store';

interface StoreProviderProps {
  preloadedState?: DeepPartial<RootState>;
}

export default function StoreProvider({ preloadedState, children }: PropsWithChildren<StoreProviderProps>) {
  const [store] = useState<AppStore>(() => makeStore(preloadedState));

  return <Provider store={store}>{children}</Provider>;
}
