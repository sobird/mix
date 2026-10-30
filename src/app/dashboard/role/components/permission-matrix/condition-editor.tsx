'use client';

import { Button, Input, InputNumber, Select, Space, Switch } from 'antd';

import { conditionableFields, type ConditionRow, type FieldMeta } from '@/permissions/fields';

interface ConditionEditorProps {
  subject: string;
  rows: ConditionRow[];
  onChange: (rows: ConditionRow[]) => void;
  disabled?: boolean;
}

const OPERATOR_LABELS: Record<ConditionRow['operator'], string> = {
  eq: '等于',
  ne: '不等于',
  in: '属于',
  nin: '不属于',
};

/** 同一字段重复时保留最后一行 */
function keepLastPerField(rows: ConditionRow[]): ConditionRow[] {
  const seen = new Set<string>();
  const result: ConditionRow[] = [];

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (seen.has(row.field)) {
      continue;
    }

    seen.add(row.field);
    result.unshift(row);
  }

  return result;
}

function operatorsFor(field: FieldMeta): ConditionRow['operator'][] {
  return field.kind === 'boolean' ? ['eq', 'ne'] : ['eq', 'ne', 'in', 'nin'];
}

function defaultValueFor(field: FieldMeta, operator: ConditionRow['operator']): ConditionRow['value'] {
  if (operator === 'in' || operator === 'nin') {
    return [];
  }

  return field.kind === 'boolean' ? true : '';
}

function ConditionValue({
  field,
  operator,
  value,
  disabled,
  onChange,
}: {
  field: FieldMeta;
  operator: ConditionRow['operator'];
  value: ConditionRow['value'];
  disabled?: boolean;
  onChange: (value: ConditionRow['value']) => void;
}) {
  const multiple = operator === 'in' || operator === 'nin';

  if (field.kind === 'boolean') {
    return <Switch disabled={disabled} checked={value === true} onChange={onChange} />;
  }

  if (field.kind === 'enum') {
    return (
      <Select
        disabled={disabled}
        mode={multiple ? 'multiple' : undefined}
        value={multiple ? ((value as Array<string | number>) ?? []) : ((value as string) ?? undefined)}
        options={field.options}
        onChange={onChange}
      />
    );
  }

  if (field.kind === 'number') {
    if (multiple) {
      return (
        <Select
          disabled={disabled}
          mode="tags"
          value={((value as Array<string | number>) ?? []).map(String)}
          onChange={(next: string[]) => onChange(next.map(Number))}
        />
      );
    }

    return (
      <InputNumber
        disabled={disabled}
        value={typeof value === 'number' ? value : undefined}
        onChange={(next) => onChange(next ?? '')}
        style={{ width: '100%' }}
      />
    );
  }

  if (multiple) {
    return (
      <Select disabled={disabled} mode="tags" value={(value as Array<string | number>) ?? []} onChange={onChange} />
    );
  }

  return (
    <Input
      disabled={disabled}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

const ConditionEditor: React.FC<ConditionEditorProps> = ({ subject, rows, onChange, disabled }) => {
  const fields = conditionableFields(subject);
  const fieldMap = new Map(fields.map((field) => [field.name, field]));

  const commit = (next: ConditionRow[]) => {
    onChange(keepLastPerField(next.filter((row) => fieldMap.has(row.field))));
  };

  const updateRow = (index: number, patch: Partial<ConditionRow>) => {
    commit(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    const used = new Set(rows.map((row) => row.field));
    const nextField = fields.find((field) => !used.has(field.name)) ?? fields[0];

    if (!nextField) {
      return;
    }

    commit([...rows, { field: nextField.name, operator: 'eq', value: defaultValueFor(nextField, 'eq') }]);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {rows.map((row, index) => {
        const field = fieldMap.get(row.field);
        if (!field) {
          return null;
        }

        return (
          <Space key={row.field} align="baseline" wrap>
            <Select
              disabled={disabled}
              value={row.field}
              options={fields.map((item) => ({ value: item.name, label: item.label }))}
              onChange={(next) => {
                const nextField = fieldMap.get(next);
                if (!nextField) {
                  return;
                }

                updateRow(index, { field: next, operator: 'eq', value: defaultValueFor(nextField, 'eq') });
              }}
              style={{ width: 140 }}
            />
            <Select
              disabled={disabled}
              value={row.operator}
              options={operatorsFor(field).map((operator) => ({
                value: operator,
                label: OPERATOR_LABELS[operator],
              }))}
              onChange={(next) => updateRow(index, { operator: next, value: defaultValueFor(field, next) })}
              style={{ width: 120 }}
            />
            <ConditionValue
              field={field}
              operator={row.operator}
              value={row.value}
              disabled={disabled}
              onChange={(value) => updateRow(index, { value })}
            />
            <Button
              danger
              type="link"
              disabled={disabled}
              aria-label={`删除条件:${row.field}`}
              onClick={() => commit(rows.filter((_, rowIndex) => rowIndex !== index))}
            >
              删除
            </Button>
          </Space>
        );
      })}
      <Button disabled={disabled || rows.length >= fields.length} onClick={addRow}>
        添加条件
      </Button>
    </Space>
  );
};

export default ConditionEditor;
