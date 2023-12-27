import { NextResponse, type NextFetchEvent } from 'next/server';
import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware';

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
  async (request: NextRequestWithAuth, fetchEvent: NextFetchEvent) => {
    const { nextauth } = request;
    console.log('nextauth', nextauth);

    // return NextResponse.json({
    //   message: 'ok',
    // }, {
    //   status: 402,
    // });

    return NextResponse.next({
      // headers: {
      //   nextauth,
      // },
    });
  },
  {
    callbacks: {
      async authorized({ req, token }) {
        const { cookies } = req;
        // 从数据库获取session信息
        // const session = await getSession({
        //   req: {
        //     headers: {
        //       cookie: cookies.toString(),
        //     },
        //   },
        // });
        const sessionToken = cookies.get('next-auth.session-token');
        return !!sessionToken;
      },
    },
  },
);

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  matcher: ['/dashboard/:path*'],
};
