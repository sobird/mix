// export { default } from 'next-auth/middleware';

// export const config = {
//   // matcher: ["/profile"],
//   matcher: ['/((?!register|api|login).*)'],
// };

import type { NextRequest, NextFetchEvent } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest, fetchEvent: NextFetchEvent) {
  // console.log('response', request)

  // return NextResponse.next({
  //   request: {
  //     test: 123,
  //   },
  // })

  if (request.nextUrl.pathname.startsWith('/api')) {
    // return NextResponse.rewrite(new URL('/about-2', request.url))

    // return response;
  }
}
