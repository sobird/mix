/**
 * useInterval
 *
 * @see https://github.com/alibaba/hooks/blob/master/packages/hooks/src/useInterval/index.ts
 * @see https://github.com/vueuse/vueuse/tree/main/packages/shared/useIntervalFn
 *
 * sobird<i@sobird.me> at 2023/10/27 12:01:38 created.
 */

import {
  useState, useMemo, useCallback, useEffect, useRef,
} from 'react';

type ReturnType = (time: null | undefined | number) => void;

export interface UseIntervalOptions {
  /**
   * Execute the callback immediate after calling this function
   *
   * @default true
   */
  immediate?: boolean;
}

/**
 * useInterval
 *
 * @param fn 回调函数
 * @param delay 执行间隔 ms; 当设置为非整数或小于0的值时，不会启动定时器，
 * 此时可通过返回值resume(1000)来启动间隔1000ms的定时器，通过执行 resume(null) 清除定时器
 * @param options
 * @returns
 */
const useInterval = (fn: () => void, delay?: number, options: UseIntervalOptions = {}): ReturnType => {
  const { immediate = false } = options;
  const [runEffect, setRunEffect] = useState(true);
  const [time, setTime] = useState(delay);

  const timerCallback = useMemo(() => { return fn; }, [fn]);

  const timerRef = useRef<NodeJS.Timer | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current as unknown as number);
    }
  }, []);

  useEffect(() => {
    if (!Number.isInteger(time) || time < 0) {
      return;
    }
    if (immediate) {
      timerCallback();
    }

    timerRef.current = setInterval(timerCallback, time);
    return clear;
  }, [time, immediate, runEffect]);

  return (interval = 1000) => {
    setTime(interval);
    setRunEffect((v) => { return !v; });
  };
};

export default useInterval;
