'use client';

import {
  Checkbox,
} from 'antd';
import {
  type CheckboxProps,
  type CheckboxOptionType,
  type CheckboxGroupProps,
} from 'antd/lib/checkbox';
import { useMemo } from 'react';

import { useMergedState } from '@/hooks';

const CheckboxGroup = Checkbox.Group;

interface InputCheckboxGroupProps extends CheckboxGroupProps {
  title: string;
  options: CheckboxOptionType[];
}

const InputCheckboxGroup: React.FC<InputCheckboxGroupProps> = ({
  title, onChange, value, defaultValue, options = [], disabled, ...checkboxGroupProps
}) => {
  const [enabledOptions, disabledOptions] = useMemo(() => {
    return options.reduce(
      (acc, option) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        option.disabled ? acc[1].push(option) : acc[0].push(option);
        return acc;
      },
      [[], []] as [CheckboxOptionType[], CheckboxOptionType[]],
    );
  }, [options]);

  const [enabledValues, setEnabledValues] = useMergedState<string[]>(
    () => {
      const initial = defaultValue || [];
      return initial.filter((val) => { return enabledOptions.some((opt) => { return opt.value === val; }); });
    },
    {
      value: value?.filter((val) => { return enabledOptions.some((opt) => { return opt.value === val; }); }),
      onChange: (vals) => {
        // 合并禁用项的原始值
        const disabledOriginalValues = (value || defaultValue || [])
          .filter((val) => { return disabledOptions.some((opt) => { return opt.value === val; }); });
        onChange?.([...vals, ...disabledOriginalValues]);
      },
    },
  );

  const allEnabledSelected = enabledOptions.length > 0
    && enabledOptions.every((opt) => { return enabledValues.includes(opt.value); });
  const indeterminate = !allEnabledSelected && enabledValues.length > 0;

  const onCheckboxGroupChange = (list: string[]) => {
    // 过滤掉禁用项的值变更
    const filtered = list.filter((val) => { return enabledOptions.some((opt) => { return opt.value === val; }); });
    console.log('onCheckboxGroupChange', filtered);
    setEnabledValues(filtered);
  };

  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    const newValues = e.target.checked
      ? enabledOptions.map((opt) => { return opt.value; })
      : [];
    setEnabledValues(newValues);
  };

  console.log('enabledValues', enabledValues, disabledOptions);

  return (
    <div>
      <Checkbox
        indeterminate={indeterminate}
        onChange={onCheckAllChange}
        checked={allEnabledSelected}
        disabled={disabled || enabledOptions.length === 0}
        style={{ marginBottom: 10 }}
      >
        {title}
      </Checkbox>
      <CheckboxGroup
        options={options}
        value={[...enabledValues, ...disabledOptions.map((opt) => { return opt.value; })]}
        onChange={onCheckboxGroupChange}
        disabled={disabled}
        style={{ display: 'flex' }}
        {...checkboxGroupProps}
      />
    </div>
  );
};

export default InputCheckboxGroup;
