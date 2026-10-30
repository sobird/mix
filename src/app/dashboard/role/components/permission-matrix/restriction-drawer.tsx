'use client';

import { Collapse, DatePicker, Drawer, Select, Space, Switch, Tabs, Typography } from 'antd';
import { useMemo, useState } from 'react';

import { restrictableFields } from '@/permissions/fields';
import dayjs from '@/utils/dayjs';

import ConditionEditor from './condition-editor';
import type { GrantDraft } from './state';

interface RestrictionDrawerProps {
  open: boolean;
  subject: string;
  subjectLabel: string;
  grants: Partial<Record<string, GrantDraft>>;
  onChange: (action: string, draft: GrantDraft) => void;
  onClose: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  read: '查看',
  create: '创建',
  update: '更新',
  delete: '删除',
  manage: '管理全部',
};

const ACTION_ORDER = ['read', 'create', 'update', 'delete', 'manage'];

function sortedActions(grants: Partial<Record<string, GrantDraft>>): string[] {
  return ACTION_ORDER.filter((action) => grants[action]);
}

const RestrictionDrawer: React.FC<RestrictionDrawerProps> = ({
  open,
  subject,
  subjectLabel,
  grants,
  onChange,
  onClose,
}) => {
  const actions = useMemo(() => sortedActions(grants), [grants]);
  const [activeKey, setActiveKey] = useState<string>('');
  const currentKey = actions.includes(activeKey) ? activeKey : (actions[0] ?? '');

  const fieldOptions = restrictableFields(subject).map((field) => ({ value: field.name, label: field.label }));
  const isFieldDisabled = (action: string) => subject === 'all' || action === 'create' || action === 'delete';
  const fieldPlaceholder = (action: string) => {
    if (subject === 'all') {
      return '系统管理不支持字段限制';
    }

    return action === 'create' || action === 'delete' ? '该动作不支持字段限制' : '留空表示不限制';
  };

  const update = (action: string, patch: Partial<GrantDraft>) => {
    const draft = grants[action];
    if (!draft) {
      return;
    }

    onChange(action, { ...draft, ...patch });
  };

  const items = actions.map((action) => {
    const draft = grants[action] as GrantDraft;
    const fieldDisabled = isFieldDisabled(action);

    return {
      key: action,
      label: ACTION_LABELS[action] ?? action,
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">字段限制</Typography.Text>
            <Select
              aria-label="字段限制"
              mode="multiple"
              allowClear
              disabled={fieldDisabled}
              placeholder={fieldPlaceholder(action)}
              value={draft.fields}
              options={fieldOptions}
              onChange={(fields: string[]) => update(action, { fields })}
              style={{ width: '100%' }}
            />
          </div>

          {action !== 'create' && subject !== 'all' && (
            <div>
              <Typography.Text type="secondary">数据条件</Typography.Text>
              <ConditionEditor
                subject={subject}
                rows={draft.conditions}
                onChange={(conditions) => update(action, { conditions })}
              />
            </div>
          )}

          <div>
            <Typography.Text type="secondary">过期时间</Typography.Text>
            <DatePicker
              aria-label="过期时间"
              showTime
              value={draft.expiresAt ? dayjs(draft.expiresAt) : null}
              onChange={(date) => update(action, { expiresAt: date ? date.toISOString() : null })}
              style={{ width: '100%' }}
            />
          </div>

          <Collapse
            items={[
              {
                key: 'advanced',
                label: '高级',
                children: (
                  <Space align="start">
                    <Switch
                      aria-label="拒绝规则"
                      checked={draft.inverted}
                      onChange={(inverted) => update(action, { inverted })}
                    />
                    <Typography.Text type="secondary">填写字段时仅拒绝这些字段；留空则拒绝整行</Typography.Text>
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      ),
    };
  });

  return (
    <Drawer open={open} width={520} title={`${subjectLabel} 权限限制`} onClose={onClose} destroyOnHidden>
      {actions.length > 0 && <Tabs activeKey={currentKey} items={items} onChange={setActiveKey} />}
    </Drawer>
  );
};

export default RestrictionDrawer;
