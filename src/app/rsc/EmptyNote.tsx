'use client';

import { createNote } from './actions';

function EmptyNote() {
  console.log(createNote);
  // {$$typeof: Symbol.for("react.server.reference"), $$id: 'createNote'}
  return <button type="button" onClick={() => { return createNote(); }}>Create Empty Note</button>;
}

export default EmptyNote;
