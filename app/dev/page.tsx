import InputCheckboxGroup from '@/components/input-checkbox-group';

export default function Page() {
  const plainOptions = [{ label: '创建角色', value: 1 }, { label: '编辑角色', value: 2 }];
  return (
    <div>
      <InputCheckboxGroup title='角色权限管理' options={plainOptions} defaultValue={[1, 2]} />
    </div>
  );
}
