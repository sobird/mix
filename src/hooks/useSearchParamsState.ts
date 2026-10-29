/**
 * useSearchParamsState Hook
 *
 * sobird<i@sobird.me> at 2023/10/05 10:13:44 created.
 */

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export default function useSearchParamsState(
  searchParamName: string,
  defaultValue: string,
): readonly [searchParamsState: string, setSearchParamsState: (newState: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const acquiredSearchParam = searchParams.get(searchParamName);
  const searchParamsState = acquiredSearchParam ?? defaultValue;

  const setSearchParamsState = useCallback(
    (newState: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(searchParamName, newState);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, searchParamName, router, pathname],
  );

  return [searchParamsState, setSearchParamsState];
}
