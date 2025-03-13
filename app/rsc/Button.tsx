'use client';

export default function Button({ onClick }) {
  // {$$typeof: Symbol.for("react.server.reference"), $$id: 'createNoteAction'}
  return <button type="button" onClick={() => { return onClick(); }}>Create Empty Note</button>;
}
