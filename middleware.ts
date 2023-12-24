import type { NextFetchEvent } from 'next/server';
import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { getSession } from 'next-auth/react';

// export const config = {
//   // matcher: ["/profile"],
//   matcher: ['/((?!register|api|login).*)'],
// };

// This function can be marked `async` if using `await` inside
// export function middleware(request: NextRequest, fetchEvent: NextFetchEvent) {
//   console.log(request);

//   // return NextResponse.next({
//   //   request: {
//   //     test: 123,
//   //   },
//   // })

//   if (request.nextUrl.pathname.startsWith('/api')) {
//     // return NextResponse.rewrite(new URL('/about-2', request.url))

//     // return response;
//   }
// }

export default withAuth(
  (request: NextRequestWithAuth, fetchEvent: NextFetchEvent) => {
    //
    console.log(request.nextauth);
  },
  {
    callbacks: {
      async authorized({ req, token }) {
        const session = await getSession({
          req: {
            headers: {
              cookie: req.cookies.toString(),
            },
          },
        });
        return !!session;
      },
    },
  },
);

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  matcher: ['/dashboard'],
};
