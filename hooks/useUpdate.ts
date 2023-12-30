import { useEffect, useRef } from 'react';
/**
 * 一个只在依赖更新时执行的 useEffect hook。
 *
 * @usage
 * 使用上与 useEffect 完全相同，只是它忽略了首次渲染，且只在依赖项更新时运行。
 *
 */
const useUpdate: typeof useEffect = (effect, deps) => {
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current) {
      return effect();
    }
    isMounted.current = true;
  }, deps);
};

export default useUpdate;
