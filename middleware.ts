import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJWT } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login"

  // Get the token from the cookies
  const token = request.cookies.get("auth-token")?.value || ""

  // If the path is public and the user is logged in, redirect to dashboard
  if (isPublicPath && token) {
    try {
      await verifyJWT(token)
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } catch (error) {
      // Token is invalid, let them access the public path
    }
  }

  // If the path is not public and the user is not logged in, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is not public and the user is logged in, verify the token
  if (!isPublicPath && token) {
    try {
      await verifyJWT(token)
      return NextResponse.next()
    } catch (error) {
      // Token is invalid, redirect to login
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
