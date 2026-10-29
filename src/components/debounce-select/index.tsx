import { Select, Spin, type SelectProps } from 'antd';
import debounce from 'lodash/debounce';
import React, { useCallback, useMemo, useRef, useState } from 'react';

const EMPTY_OPTIONS: SelectProps['options'] = [];

export interface DebounceSelectProps<ValueType = any> extends Omit<SelectProps<ValueType | ValueType[]>, 'children'> {
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
  options: InternalOptions = EMPTY_OPTIONS,
  ...props
}: DebounceSelectProps<ValueType>) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState(InternalOptions);
  const fetchRef = useRef(0);

  const search = useCallback(
    (value: string) => {
      if (!fetcher) {
        return;
      }

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
    },
    [fetcher],
  );

  const onSearch = useMemo(() => {
    if (!fetcher) {
      return;
    }

    // oxlint-disable-next-line react/refs
    return debounce(search, delay);
  }, [fetcher, delay, search]);

  return (
    <Select
      // labelInValue
      filterOption={false}
      onSearch={onSearch}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      {...props}
      options={options}
    />
  );
}

export default DebounceSelect;
