/**
 * userServerAction.ts
 *
 * sobird<i@sobird.me> at 2023/12/23 23:27:31 created.
 */
import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';

export default function useServerAction<State, Payload>(
  action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
  initialState: Awaited<State>,
  permalink?: string,
): [State, (payload: Payload) => void, boolean] {
  const [pending, setPending] = useState(false);
  const [state, dispatch] = useFormState(action, initialState, permalink);

  useEffect(() => {
    setPending(false);
  }, [state]);

  return [
    state,
    (payload: Payload) => {
      setPending(true);
      dispatch(payload);
    },
    pending,
  ];
}
