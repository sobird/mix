import type {
  DefaultSession,
} from 'next-auth';

declare module '@auth/core' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      address: string
      /**
       * By default, TypeScript merges new interface properties and overwrite existing ones.
       * In this case, the default session user properties will be overwritten, with the new one defined above.
       * To keep the default session user properties,
       * you need to add them back into the newly declared interface
       */
    } & DefaultSession['user'] // To keep the default types
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {}

  /**
   * The shape of the account object returned in the OAuth providers' `account` callback,
   * Usually contains information about the provider being used, like OAuth tokens (`access_token`, etc).
   */
  interface Account {}
}
