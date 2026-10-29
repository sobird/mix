import { render, screen } from '@testing-library/react';
import { useActionState } from 'react';

import { ActionStatus } from '@/actions';

import { SignupForm } from './form';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useActionState: vi.fn<typeof actual.useActionState>() };
});

const mockUseActionState = vi.mocked(useActionState);

function mockState(state: ServerActionState) {
  mockUseActionState.mockReturnValue([state, vi.fn<() => void>(), false] as unknown as ReturnType<
    typeof useActionState
  >);
}

describe('SignupForm', () => {
  it('shows the server failure message', () => {
    mockState({ status: ActionStatus.FAILURE, message: '账户已存在' });

    render(<SignupForm />);

    expect(screen.getByText('账户已存在')).toBeInTheDocument();
  });

  it('maps server field errors onto their fields', async () => {
    mockState({ status: ActionStatus.FAILURE, errors: { username: ['用户名已存在'] } as never });

    render(<SignupForm />);

    expect(await screen.findByText('用户名已存在')).toBeInTheDocument();
  });
});
