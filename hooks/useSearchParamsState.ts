/**
 * useSearchParamsState Hook
 *
 * sobird<i@sobird.me> at 2023/10/05 10:13:44 created.
 */

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

let singletonSearchParams = null;

export default function useSearchParamsState(
  searchParamName: string,
  defaultValue: string,
): readonly [searchParamsState: string, setSearchParamsState: (newState: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const acquiredSearchParam = searchParams.get(searchParamName);
  const searchParamsState = acquiredSearchParam ?? defaultValue;

  useEffect(() => {
    singletonSearchParams = searchParams;
  }, [searchParams.toString()]);

  const setSearchParamsState = (newState: string) => {
    singletonSearchParams.set(searchParamName, newState);
    setTimeout(() => {
      setSearchParams(singletonSearchParams);
    }, 0);
  };

  return [searchParamsState, setSearchParamsState];
}
