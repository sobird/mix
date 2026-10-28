'use client';

import { updateName2 } from './actions';

function UpdateName2() {
  return (
    <form action={updateName2}>
      <input type="text" name="name" />
      <button type="submit">submit</button>
    </form>
  );
}

export default UpdateName2;
