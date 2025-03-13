'use client'

import { useState, useEffect } from 'react';


// 权限项类型
type PermissionConfig = {
  subject: string;    // 操作对象（如 "Article"）
  actions: {
    action: string;   // 操作类型（如 "read", "update"）
    fields?: string[]; // 允许的字段（空数组表示允许所有字段）
  }[];
};

// 表单整体数据
type RolePermissionForm = {
  roleId: number;
  permissions: PermissionConfig[];
};

const permissionConfig: PermissionConfig[] = [
  {
    subject: 'User',
    actions: [
      {action: 'read', fields: ['username', 'email']},
      {action: 'update', fields: ['username', 'email']}
    ]
  }
]

export function PermissionForm() {
  const [roleId, setRoleId] = useState<number>(0);
  const [models, setModels] = useState<string[]>(['User', 'Article']); // 所有可管理的模型（如 ["Article", "User"]）
  const [permissions, setPermissions] = useState<PermissionConfig[]>(permissionConfig);

  // 初始化加载模型列表
  useEffect(() => {
    
  }, []);

  // 角色切换时加载权限
  useEffect(() => {
    // if (roleId > 0) {
    //   fetchRolePermissions(roleId).then(setPermissions);
    // }
  }, [roleId]);

  // 提交保存
  const handleSubmit = async () => {
    // await saveRolePermissions({ roleId, permissions });
  };

  // 动态渲染权限项
  return (
    <div>
      <select 
        value={roleId} 
        onChange={(e) => setRoleId(Number(e.target.value))}
      >
        <option value="0">选择角色</option>
        {/* 动态加载角色选项 */}
      </select>

      {models.map((model) => (
        <div key={model} className="permission-section">
          <h3>{model}</h3>
          {['read', 'update', 'delete'].map((action) => (
            <div key={action} className="action-row">
              <label>
                <input
                  type="checkbox"
                  checked={permissions.some((p) => p.subject === model && p.actions.some(a => a.action === action))}
                  // onChange={(e) => handleActionToggle(model, action, e.target.checked)}
                />
                {action}
              </label>

              {/* 字段选择（仅当操作允许时显示） */}
              {action === 'read' || action === 'update' ? (
                <FieldSelector
                  model={model}
                  action={action}
                  // selectedFields={getSelectedFields(model, action)}
                  // onSelect={(fields) => handleFieldSelect(model, action, fields)}
                />
              ) : null}
            </div>
          ))}
        </div>
      ))}

      <button onClick={handleSubmit}>保存权限</button>
    </div>
  );
}

// 字段选择组件
const FieldSelector = ({ model, action, selectedFields, onSelect }) => {
  const [availableFields] = useState(() => {
    // 根据模型获取字段列表（可来自 API）
    return model === 'Article' ? ['title', 'content', 'status'] : [];
  });

  return (
    <div className="field-selector">
      {availableFields.map((field) => (
        <label key={field}>
          <input
            type="checkbox"
            checked={selectedFields?.includes(field)}
            onChange={(e) => {
              const newFields = e.target.checked
                ? [...(selectedFields || []), field]
                : (selectedFields || []).filter(f => f !== field);
              onSelect(newFields);
            }}
          />
          {field}
        </label>
      ))}
    </div>
  );
};