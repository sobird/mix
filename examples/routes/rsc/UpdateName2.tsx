'use client';

import { updateName2 } from './actions';

function UpdateName2() {
  const action = async (formData: FormData) => {
    await updateName2(formData);
  };

  return (
    <form action={action}>
      <input type="text" name="name" />
      <button type="submit">submit</button>
    </form>
  );
}

export default UpdateName2;
