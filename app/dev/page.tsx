import InputCheckboxGroup from '@/components/input-checkbox-group';

export default function Page() {
  const mockOptions = [
    { label: 'Apple', value: 'apple', disabled: true },
    { label: 'Banana', value: 'banana' },
    { label: 'Orange', value: 'orange' },
  ];
  return (
    <div>
      <InputCheckboxGroup title='角色权限管理' options={mockOptions} />
    </div>
  );
}
