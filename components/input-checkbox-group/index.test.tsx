import { render, screen, fireEvent } from '@testing-library/react';

import InputCheckboxGroup from './index';

describe('InputCheckboxGroup', () => {
  const mockOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Orange', value: 'orange' },
  ];

  // 基础渲染测试
  it('应正确渲染标题和所有选项', () => {
    render(
      <InputCheckboxGroup
        title="水果选择"
        options={mockOptions}
      />,
    );

    // 验证标题
    expect(screen.getByText('水果选择')).toBeInTheDocument();

    // 验证所有选项
    mockOptions.forEach((option) => {
      expect(screen.getByLabelText(option.label)).toBeInTheDocument();
    });
  });

  // 全选功能测试
  it('全选复选框应正常工作', async () => {
    const onChange = vi.fn();
    render(
      <InputCheckboxGroup
        title="全选测试"
        options={mockOptions}
        onChange={onChange}
      />,
    );

    // 获取全选复选框
    const allCheckbox = screen.getByLabelText('全选测试') as HTMLInputElement;

    // 初始状态验证
    expect(allCheckbox.checked).toBe(false);
    expect(allCheckbox.indeterminate).toBe(false);

    // 点击全选
    fireEvent.click(allCheckbox);

    // expect(onChange).toHaveBeenCalledWith(mockOptions.map((o) => { return o.value; }));

    // 验证全选状态
    mockOptions.forEach((option) => {
      expect(screen.getByLabelText(option.label)).toBeChecked();
    });

    expect(allCheckbox.checked).toBe(true);
    expect(allCheckbox.indeterminate).toBe(false);

    // 再次点击取消全选
    fireEvent.click(allCheckbox);
    // expect(onChange).toHaveBeenCalledWith(mockOptions.map((o) => { return o.value; }));
  });

  // 部分选中状态测试
  it('应正确显示indeterminate状态', () => {
    const { container } = render(
      <InputCheckboxGroup
        title="部分选中"
        options={mockOptions}
        value={['apple']}
      />,
    );

    // 获取全选复选框
    const allCheckbox = screen.getByLabelText('部分选中') as HTMLInputElement;
    const checkbox = container.querySelector('.ant-checkbox')!;

    // 验证中间状态
    expect(allCheckbox.checked).toBe(false);
    expect(allCheckbox.indeterminate).toBe(true);
    expect(checkbox).toHaveClass('ant-checkbox-indeterminate');
  });

  // 受控组件测试
  it('应正确处理受控模式', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <InputCheckboxGroup
        title="受控测试"
        options={mockOptions}
        value={['apple']}
        onChange={onChange}
      />,
    );

    // 初始选中状态验证
    expect(screen.getByLabelText('Apple')).toBeChecked();
    expect(screen.getByLabelText('Banana')).not.toBeChecked();

    // 模拟用户选择
    fireEvent.click(screen.getByLabelText('Banana'));

    // 验证onChange参数
    // expect(onChange).toHaveBeenCalledWith(['apple', 'banana']);

    // 外部更新value
    rerender(
      <InputCheckboxGroup
        title="受控测试"
        options={mockOptions}
        value={['orange']}
        onChange={onChange}
      />,
    );

    // 验证更新后的状态
    expect(screen.getByLabelText('Orange')).toBeChecked();
    expect(screen.getByLabelText('Apple')).not.toBeChecked();
  });

  // // 非受控组件测试
  it('应正确处理非受控模式', () => {
    const onChange = vi.fn();
    render(
      <InputCheckboxGroup
        title="非受控测试"
        options={mockOptions}
        defaultValue={['apple']}
        onChange={onChange}
      />,
    );

    // 初始状态验证
    expect(screen.getByLabelText('Apple')).toBeChecked();

    // 模拟用户操作
    fireEvent.click(screen.getByLabelText('Banana'));
    // expect(onChange).toHaveBeenCalledWith(['apple', 'banana']);

    // 验证状态更新
    expect(screen.getByLabelText('Banana')).toBeChecked();
  });

  // // 选项禁用测试
  it('应正确处理禁用选项', () => {
    const disabledOptions = [
      { label: 'Disabled', value: 'disabled', disabled: true },
    ];

    render(
      <InputCheckboxGroup
        title="禁用测试"
        options={disabledOptions}
      />,
    );

    const checkbox = screen.getByLabelText('Disabled') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });

  it('应正确处理组件禁用', () => {
    const disabledOptions = [
      { label: 'Disabled', value: 'disabled' },
    ];

    render(
      <InputCheckboxGroup
        title="禁用测试"
        options={disabledOptions}
        disabled
      />,
    );

    const allCheckbox = screen.getByLabelText('禁用测试') as HTMLInputElement;
    expect(allCheckbox.disabled).toBe(true);

    const checkbox = screen.getByLabelText('Disabled') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });

  it('全选时应忽略禁用选项', () => {
    const disabledOptions = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana', disabled: true }, // 禁用项
      { label: 'Orange', value: 'orange' },
    ];

    const onChange = vi.fn();
    render(
      <InputCheckboxGroup
        title="忽略禁用测试"
        options={disabledOptions}
        onChange={onChange}
      />,
    );

    // 点击全选复选框
    fireEvent.click(screen.getByLabelText('忽略禁用测试'));
    // 期望结果：只选中非禁用项（apple 和 orange）
    expect(onChange).toHaveBeenCalledWith(['apple', 'orange']);

    // 验证 DOM 状态
    expect(screen.getByLabelText('Apple')).toBeChecked();
    expect(screen.getByLabelText('Banana')).not.toBeChecked();
    expect(screen.getByLabelText('Orange')).toBeChecked();
  });

  it('应允许默认值包含禁用选项的值', () => {
    const disabledOptions = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana', disabled: true }, // 禁用项
      { label: 'Orange', value: 'orange', disabled: true }, // 禁用项
    ];

    render(
      <InputCheckboxGroup
        title="禁用项默认值测试"
        options={disabledOptions}
        defaultValue={['banana', 'orange']} // 包含禁用项的默认值
      />,
    );

    // 验证禁用选项显示为已选中
    const bananaCheckbox = screen.getByLabelText('Banana') as HTMLInputElement;
    const orangeCheckbox = screen.getByLabelText('Orange') as HTMLInputElement;

    expect(bananaCheckbox.checked).toBe(true);
    expect(orangeCheckbox.checked).toBe(true);
    expect(bananaCheckbox.disabled).toBe(true);
    expect(orangeCheckbox.disabled).toBe(true);

    // 验证非禁用选项状态
    const appleCheckbox = screen.getByLabelText('Apple') as HTMLInputElement;
    expect(appleCheckbox.checked).toBe(false);
    expect(appleCheckbox.disabled).toBe(false);
  });

  it('禁用选项的默认值应无法通过交互移除', () => {
    const onChange = vi.fn();
    const disabledOptions = [
      { label: 'Apple', value: 'apple', disabled: true },
    ];

    render(
      <InputCheckboxGroup
        title="禁用项交互测试"
        options={disabledOptions}
        defaultValue={['apple']}
        onChange={onChange}
      />,
    );

    // 尝试点击已禁用的选中项
    fireEvent.click(screen.getByLabelText('禁用项交互测试'));
    // fireEvent.click(screen.getByLabelText('Apple'));

    // 期望值保持不变（禁用项不可操作）
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Apple')).toBeChecked();
  });
});
