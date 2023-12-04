/**
 * useLocalStorageState.ts
 *
 * @see https://github.com/alibaba/hooks/tree/master/packages/hooks/src/useLocalStorageState
 * sobird<i@sobird.me> at 2023/10/19 11:38:56 created.
 */
import { useState, useEffect } from 'react';

export type SetState<S> = S | ((prevState?: S) => S);

export default function useLocalStorageState<T>(key: string, defaultValue: T) {
  function getStoredValue() {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('useLocalStorageState :>> ', e);
    }
    if (typeof defaultValue === 'function') {
      return defaultValue();
    }
    return defaultValue;
  }
  const [state, setState] = useState(getStoredValue);

  useEffect(() => {
    if (state === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  const updateState = (value?: SetState<T>) => {
    const currentState = value instanceof Function ? value(state) : value;
    setState(currentState);
  };

  return [state, updateState];
}
