'use client';

import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import RoleForm from '../role-form';
import { createRoleAction } from '@/actions/role';

const RoleFormModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <Button type="primary" onClick={showModal}>创建角色弹窗</Button>
      <Modal title="创建角色" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <RoleForm action={createRoleAction} />
      </Modal>
    </div>
  );
};

export default RoleFormModal;
