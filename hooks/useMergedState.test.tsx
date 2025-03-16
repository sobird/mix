import { renderHook, act } from '@testing-library/react-hooks';

import useMergedState from '@/hooks/useMergedState';

vi.setConfig({
  testTimeout: 20000,
});

describe('useMergedState', () => {
  it('应正确初始化默认值', () => {
    // 测试非受控模式
    const { result } = renderHook(() => { return useMergedState('default'); });
    expect(result.current[0]).toBe('default');

    // 测试函数式默认值
    const { result: funcResult } = renderHook(() => { return useMergedState(() => { return 'functional'; }); });
    expect(funcResult.current[0]).toBe('functional');
  });

  it('受控模式下应跟随外部value变化', () => {
    const { result, rerender } = renderHook(
      ({ value }) => { return useMergedState(undefined, { value }); },
      { initialProps: { value: 'initial' } },
    );

    // 初始状态
    expect(result.current[0]).toBe('initial');

    // 模拟外部value变化
    act(() => {
      rerender({ value: 'updated' });
    });
    expect(result.current[0]).toBe('updated');
  });

  it('非受控模式下应更新内部状态', () => {
    const { result } = renderHook(() => { return useMergedState('default'); });

    // 初始状态
    expect(result.current[0]).toBe('default');

    // 触发内部更新
    act(() => {
      result.current[1]('new value');
    });
    expect(result.current[0]).toBe('new value');
  });

  it('应正确触发onChange回调', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => { return useMergedState('default', { onChange }); });

    // 内部更新触发onChange
    act(() => {
      result.current[1]('updated');
    });
    expect(onChange).toHaveBeenCalledWith('updated', 'default');

    // 受控模式外部更新不触发
    const { rerender } = renderHook(
      ({ value }) => { return useMergedState(undefined, { value, onChange }); },
      { initialProps: { value: 'external' } },
    );
    onChange.mockClear();
    act(() => {
      rerender({ value: 'new-external' });
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('应应用postState处理', () => {
    const postState = (v: string) => { return v.toUpperCase(); };
    const { result } = renderHook(() => { return useMergedState('hello', { postState }); });

    expect(result.current[0]).toBe('HELLO');

    act(() => {
      result.current[1]('world');
    });
    expect(result.current[0]).toBe('WORLD');
  });

  it('应正确处理连续异步更新', async () => {
    const { result } = renderHook(() => { return useMergedState(0); });

    act(() => {
      result.current[1]((prev) => { return prev + 1; });
      result.current[1]((prev) => { return prev + 1; });
    });
    expect(result.current[0]).toBe(2);
  });

  it('应处理undefined初始值', () => {
    const { result } = renderHook(() => { return useMergedState(undefined); });
    expect(result.current[0]).toBeUndefined();
  });

  it('应正确处理null值', () => {
    const { result } = renderHook(() => { return useMergedState(null, { value: null }); });
    expect(result.current[0]).toBeNull();
  });
});
