import React, { useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { Select, Spin } from 'antd';
import type { SelectProps } from 'antd/es/select';

export interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'children'> {
  fetcher?: (search: string) => Promise<ValueType[]>;
  delay?: number;
}

interface SelectValueType {
  key?: string;
  label: React.ReactNode;
  value: string | number;
}

function DebounceSelect<ValueType extends SelectValueType = any>({
  fetcher,
  delay = 300,
  options: InternalOptions = [],
  ...props
}: DebounceSelectProps<ValueType>) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState(InternalOptions);
  const fetchRef = useRef(0);

  const onSearch = useMemo(() => {
    if (!fetcher) {
      return;
    }
    const search = (value: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      // setOptions([]);
      setFetching(true);

      fetcher(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return;
        }

        setOptions(newOptions);
        setFetching(false);
      });
    };

    return debounce(search, delay);
  }, [fetcher, delay]);

  return (
    <Select
      labelInValue
      filterOption={false}
      onSearch={onSearch}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      {...props}
      options={options}
    />
  );
}

export default DebounceSelect;
