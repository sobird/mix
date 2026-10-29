import { render, screen } from '@testing-library/react';

import { ActionStatus } from '@/actions';
import useServerAction from '@/hooks/useServerAction';

import { SignupForm } from './form';

vi.mock('@/hooks/useServerAction', () => ({
  default: vi.fn<(...args: unknown[]) => unknown>(),
}));

const mockUseServerAction = vi.mocked(useServerAction);

function mockState(state: ServerActionState) {
  mockUseServerAction.mockReturnValue([state, vi.fn<() => void>(), false] as unknown as ReturnType<
    typeof useServerAction
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
