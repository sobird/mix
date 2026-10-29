// @vitest-environment node
import { sequelize } from '@/lib/sequelize';

import { GET } from './route';

afterEach(() => {
  vi.restoreAllMocks();
});

it('reports ok when the database answers', async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({ status: 'ok', db: 'up' });
});
it('reports 503 when the database is down', async () => {
  vi.spyOn(sequelize, 'authenticate').mockRejectedValueOnce(new Error('down'));
  const response = await GET();
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toMatchObject({ status: 'error', db: 'down' });
});
