import {
  useCallback, useEffect, useRef, useState,
} from 'react';

type Updater<T> = T | ((prevState: T) => T);
type SetState<T> = (value: Updater<T>) => void;

function useMergedState<T>(
  // 默认值（可以是值或函数）
  defaultStateValue?: T | (() => T),
  // 配置选项
  options?: {
    // 外部传入的受控值
    value?: T;
    // 值变化时的回调
    onChange?: (value: T, prevValue: T) => void;
    // 后处理函数
    postState?: (value: T) => T;
  },
): [T, SetState<T>] {
  const { value, onChange, postState } = options || {};

  // 是否受控模式
  const isControlled = value !== undefined;

  // 初始化内部状态
  const [innerValue, setInnerValue] = useState<T>(() => {
    if (isControlled) {
      return value!;
    }
    return typeof defaultStateValue === 'function'
      ? (defaultStateValue as () => T)()
      : defaultStateValue!;
  });

  // 合并后的最终值
  const mergedValue = isControlled ? value! : innerValue;

  // 使用 ref 记录上一次的值
  const prevRef = useRef(mergedValue);
  useEffect(() => {
    prevRef.current = mergedValue;
  }, [mergedValue]);

  // 触发 onChange 的回调
  const triggerChange = useCallback(
    (newValue: T) => {
      onChange?.(newValue, prevRef.current);
    },
    [onChange],
  );

  // 增强的 setState 函数
  const setState: SetState<T> = useCallback(
    (updater: Updater<T>) => {
      const newValue = typeof updater === 'function'
        ? (updater as (prevState: T) => T)(mergedValue)
        : updater;

      // 受控模式下只触发 onChange
      if (isControlled) {
        triggerChange(newValue);
      } else {
        // 非受控模式下更新内部状态
        // 使用函数式更新确保基于最新状态
        setInnerValue((prev) => {
          if (typeof updater === 'function') {
            return (updater as (prevState: T) => T)(prev);
          }
          return newValue;
        });
        triggerChange(newValue);
      }
    },
    [isControlled, mergedValue, triggerChange],
  );

  // 处理外部 value 变化
  useEffect(() => {
    if (isControlled) {
      setInnerValue(value!);
    }
  }, [isControlled, value]);

  // 应用后处理
  const postMergedValue = postState ? postState(mergedValue) : mergedValue;

  return [postMergedValue, setState];
}

export default useMergedState;
