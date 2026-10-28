'use client';

import { useState, useTransition } from 'react';

import { updateName } from './actions';

function UpdateName() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const submitAction = async () => {
    startTransition(async () => {
      const result = await updateName(name);
      if (result.error) {
        setError(result.error);
      } else {
        setName('');
        setError('');
      }
    });
  };

  return (
    <form action={submitAction}>
      <input type="text" name="name" disabled={isPending} onChange={(e) => { setName(e.target.value); }} />
      {error && (
      <span>
        Failed:
        {error}
      </span>
      )}
      <button type="submit">submit</button>
    </form>
  );
}

export default UpdateName;
