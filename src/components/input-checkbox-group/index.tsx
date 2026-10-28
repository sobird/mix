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
  const [checkedList, setCheckedList] = useMergedState<string[]>(defaultValue || [], {
    value,
    onChange,
  });

  const enabledOptions = useMemo(() => {
    return options.filter((option) => { return !option.disabled; });
  }, [options]);

  const enabledValues = checkedList.filter((val) => { return enabledOptions.some((opt) => { return opt.value === val; }); });
  const disabledValues = checkedList.filter((val) => { return !enabledOptions.some((opt) => { return opt.value === val; }); });

  const checkAll = enabledOptions.length === enabledValues.length;
  const indeterminate = enabledValues.length > 0 && enabledValues.length < enabledOptions.length;

  const onCheckboxGroupChange = (list: string[]) => {
    setCheckedList(list);
  };

  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    setCheckedList(e.target.checked ? [...disabledValues, ...enabledOptions.map((item) => { return item.value; })] : [...disabledValues]);
  };

  return (
    <div>
      <Checkbox
        indeterminate={indeterminate}
        onChange={onCheckAllChange}
        checked={checkAll}
        disabled={disabled}
        style={{ marginBottom: 10 }}
      >
        {title}
      </Checkbox>
      <CheckboxGroup
        options={options}
        value={checkedList}
        onChange={onCheckboxGroupChange}
        disabled={disabled}
        style={{ display: 'flex' }}
        {...checkboxGroupProps}
      />
    </div>
  );
};

export default InputCheckboxGroup;
