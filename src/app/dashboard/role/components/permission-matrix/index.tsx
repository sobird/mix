'use client';

import { Alert, Button, Checkbox, message, Space, Table, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ActionStatus } from '@/actions';
import { saveRolePermissions } from '@/actions/role';
import { PERMISSION_CATALOG } from '@/permissions/catalog';
import type { RolePermissionGrant } from '@/services/role';

import RestrictionDrawer from './restriction-drawer';
import { grantsToState, stateToPermissionInput, type GrantDraft, type MatrixState } from './state';

export interface PermissionMatrixProps {
  roleId: number;
  grants: RolePermissionGrant[];
  editable: boolean;
}

const CRUD_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

const ACTION_LABELS: Record<string, string> = {
  read: '查看',
  create: '创建',
  update: '更新',
  delete: '删除',
};

const SUBJECT_LABELS: Record<string, string> = {
  User: '用户',
  Role: '角色',
  Permission: '权限',
  all: '系统管理',
};

function emptyDraft(): GrantDraft {
  return { fields: [], conditions: [], expiresAt: null, inverted: false };
}

function isExpired(draft: GrantDraft): boolean {
  return draft.expiresAt !== null && Date.parse(draft.expiresAt) <= Date.now();
}

function hasRestriction(draft: GrantDraft): boolean {
  return draft.fields.length > 0 || draft.conditions.length > 0 || draft.expiresAt !== null || draft.inverted;
}

function catalogSubjects(): string[] {
  const subjects: string[] = [];
  for (const entry of PERMISSION_CATALOG) {
    if (entry.subject !== 'all' && !subjects.includes(entry.subject)) {
      subjects.push(entry.subject);
    }
  }
  return subjects;
}

const SUBJECTS = catalogSubjects();
const ROWS = [...SUBJECTS, 'all'].map((subject) => ({ subject }));

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ roleId, grants, editable }) => {
  const router = useRouter();
  const [state, setState] = useState<MatrixState>(() => grantsToState(grants));
  const [saving, setSaving] = useState(false);
  const [drawerSubject, setDrawerSubject] = useState<string | null>(null);

  const toggle = (subject: string, action: string, checked: boolean) => {
    setState((prev) => {
      const next: MatrixState = { ...prev, [subject]: { ...prev[subject] } };

      if (checked) {
        next[subject][action] = emptyDraft();
      } else {
        delete next[subject][action];
      }

      if (Object.keys(next[subject]).length === 0) {
        delete next[subject];
      }

      return next;
    });
  };

  const updateDraft = (action: string, draft: GrantDraft) => {
    if (!drawerSubject) {
      return;
    }

    setState((prev) => ({
      ...prev,
      [drawerSubject]: { ...prev[drawerSubject], [action]: draft },
    }));
  };

  const renderRestriction = (subject: string) => {
    const subjectGrants = state[subject] ?? {};
    const checked = Object.keys(subjectGrants).length;
    const count = Object.values(subjectGrants).filter((draft) => draft && hasRestriction(draft)).length;

    return (
      <Button
        aria-label={`限制:${subject}`}
        disabled={!editable || checked === 0}
        onClick={() => setDrawerSubject(subject)}
      >
        {checked === 0 ? '—' : count > 0 ? `${count} 项` : '限制'}
      </Button>
    );
  };

  const renderCell = (subject: string, action: string) => {
    const draft = state[subject]?.[action];

    return (
      <Space size={4}>
        <Checkbox
          aria-label={`${subject}:${action}`}
          checked={Boolean(draft)}
          disabled={!editable}
          onChange={(event) => toggle(subject, action, event.target.checked)}
        />
        {draft && isExpired(draft) && <Tag color="red">已过期</Tag>}
      </Space>
    );
  };

  const columns = [
    {
      title: '资源',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject: string) => SUBJECT_LABELS[subject] ?? subject,
    },
    ...CRUD_ACTIONS.map((action, actionIndex) => ({
      title: ACTION_LABELS[action],
      key: action,
      render: (_: unknown, record: { subject: string }) => {
        if (record.subject === 'all') {
          if (actionIndex !== 0) {
            return { children: null, props: { colSpan: 0 } };
          }

          return {
            children: (
              <Checkbox
                aria-label="all:manage"
                checked={Boolean(state.all?.manage)}
                disabled={!editable}
                onChange={(event) => toggle('all', 'manage', event.target.checked)}
              >
                管理全部
              </Checkbox>
            ),
            props: { colSpan: CRUD_ACTIONS.length },
          };
        }

        return renderCell(record.subject, action);
      },
    })),
    {
      title: '限制',
      key: 'restriction',
      render: (_: unknown, record: { subject: string }) => renderRestriction(record.subject),
    },
  ];

  const handleSave = async () => {
    setSaving(true);

    try {
      const result = await saveRolePermissions(roleId, stateToPermissionInput(state));

      if (result.status === ActionStatus.FAILURE) {
        message.error(result.message);
        return;
      }

      message.success('权限已保存');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {!editable && <Alert type="info" showIcon message="内置角色权限由权限目录同步维护" />}

      <Table rowKey="subject" pagination={false} size="middle" dataSource={ROWS} columns={columns} bordered />

      <Space>
        <Button disabled={!editable || saving} onClick={() => setState(grantsToState(grants))}>
          重置
        </Button>
        <Button type="primary" loading={saving} disabled={!editable} onClick={handleSave}>
          保存
        </Button>
      </Space>

      <RestrictionDrawer
        open={drawerSubject !== null}
        subject={drawerSubject ?? 'User'}
        subjectLabel={SUBJECT_LABELS[drawerSubject ?? ''] ?? ''}
        grants={drawerSubject ? (state[drawerSubject] ?? {}) : {}}
        onChange={updateDraft}
        onClose={() => setDrawerSubject(null)}
      />
    </Space>
  );
};

export default PermissionMatrix;
