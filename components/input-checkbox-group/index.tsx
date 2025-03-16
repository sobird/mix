'use client';

import {
  Checkbox,
} from 'antd';
import {
  type CheckboxProps,
  type CheckboxOptionType,
  type CheckboxGroupProps,
} from 'antd/lib/checkbox';
import React, { useState } from 'react';

import { useMergedState } from '@/hooks';

const CheckboxGroup = Checkbox.Group;

interface InputCheckboxGroupProps extends CheckboxGroupProps {
  title: string;
  options: CheckboxOptionType[];
}

const InputCheckboxGroup: React.FC<InputCheckboxGroupProps> = ({
  title, onChange, value, defaultValue, options = [], ...checkboxGroupProps
}) => {
  const [checkedList, setCheckedList] = useMergedState<string[]>(defaultValue, {
    value,
    onChange,
  });

  const checkAll = options.length === checkedList.length;
  const indeterminate = checkedList.length > 0 && checkedList.length < options.length;

  const onCheckboxGroupChange = (list: string[]) => {
    setCheckedList(list);
  };

  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    setCheckedList(e.target.checked ? options.map((item) => { return item.value; }) : []);
  };

  return (
    <div>
      <Checkbox
        indeterminate={indeterminate}
        onChange={onCheckAllChange}
        checked={checkAll}
        style={{ marginBottom: 10 }}
      >
        {title}
      </Checkbox>
      <CheckboxGroup
        options={options}
        value={checkedList}
        onChange={onCheckboxGroupChange}
        style={{ display: 'flex' }}
        {...checkboxGroupProps}
      />
    </div>
  );
};

export default InputCheckboxGroup;
