'use client';

// 用useServerAction代替useActionState，因为useActionState在react19中才有
import React from 'react';

import { updateName3 } from './actions';

function UpdateName3() {
  const [state, submitAction, isPending] = React.useActionState(updateName3, { error: null });

  return (
    <form action={submitAction}>
      <input type="text" name="name" disabled={isPending} />
      {state.error && (
      <span>
        Failed:
        {state.error}
      </span>
      )}
      <button type="submit">submit</button>
    </form>
  );
}

export default UpdateName3;
