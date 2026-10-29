import { redirect } from 'next/navigation';

import DashboardLayout from './layout';

vi.mock('next/navigation', () => ({
  redirect: vi.fn<() => never>(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));
vi.mock('@/services/auth', () => ({
  getSessionUserId: vi.fn<() => Promise<number | null>>().mockResolvedValue(null),
}));

it('redirects guests to signin', async () => {
  await expect(DashboardLayout({ children: null })).rejects.toThrow('NEXT_REDIRECT');
  expect(redirect).toHaveBeenCalledWith('/signin');
});
