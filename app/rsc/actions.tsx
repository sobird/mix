'use server';

import { sleep } from '@/utils';

export async function createNote() {
  // mock
  await sleep(500, 'success');
}

// Server Functions with Actions
export async function updateName(name: string) {
  if (!name) {
    return { error: 'Name is required' };
  }
  return sleep(1500, { result: 'success', error: null, name });
}

// Server Functions with Form Actions
export async function updateName2(formData: FormData) {
  const name = formData.get('name');

  if (!name) {
    return { error: 'Name is required' };
  }
  return sleep(1500, { result: 'success', error: null, name });
}

// Server Functions with useActionState
export async function updateName3(state, formData: FormData) {
  const name = formData.get('name');

  if (!name) {
    return { error: 'Name is required' };
  }
  return sleep(1500, { result: 'success', error: null, name });
}
