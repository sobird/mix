'use client';

export default function Button({ onClick }) {
  console.log(onClick);
  // {$$typeof: Symbol.for("react.server.reference"), $$id: 'createNoteAction'}
  return <button type="button" onClick={() => { return onClick(); }}>Create Empty Note</button>;
}
