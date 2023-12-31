/**
 * userServerAction.ts
 *
 * sobird<i@sobird.me> at 2023/12/23 23:27:31 created.
 */
import { useTransition } from 'react';
import { useFormState } from 'react-dom';

export default function useServerAction<State, Payload>(
  action: FormServerAction<Payload, State>,
  initialState: Awaited<State>,
  permalink?: string,
): [state: Awaited<State>, dispatch: (payload: Payload) => void, pending: boolean] {
  const [pending, startTransition] = useTransition();
  const [state, dispatch] = useFormState<State, Payload>((preState, payload) => {
    return action(payload, preState);
  }, initialState, permalink);

  return [
    state,
    (payload: Payload) => {
      startTransition(() => { dispatch(payload); });
    },
    pending,
  ];
}
