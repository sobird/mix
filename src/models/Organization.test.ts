// @vitest-environment node

import { ValidationError } from 'sequelize';

import { Organization } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createOrganization } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('Organization model', () => {
  it('requires a name', async () => {
    await expect(Organization.create({ name: null } as never)).rejects.toBeInstanceOf(ValidationError);
  });

  it('allows an empty description', async () => {
    const organization = await createOrganization({ name: '演示组织' });

    expect(organization.name).toBe('演示组织');
    expect(organization.description).toBeUndefined();
  });

  it('stores a description', async () => {
    const organization = await createOrganization({ name: '演示组织', description: '用于测试' });

    await organization.reload();
    expect(organization.description).toBe('用于测试');
  });

  it('supports soft delete', async () => {
    const organization = await createOrganization();

    await organization.destroy();

    expect(await Organization.findByPk(organization.id)).toBeNull();
    expect(await Organization.findByPk(organization.id, { paranoid: false })).not.toBeNull();
  });
});
