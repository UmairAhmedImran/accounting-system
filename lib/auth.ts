import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { IUser } from "@/models/User"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function signJWT(payload: { id: string; username: string; isAdmin: boolean }) {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 60 * 60 * 24 * 7 // 7 days

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(new TextEncoder().encode(JWT_SECRET))
}

export async function verifyJWT<T>(token: string): Promise<T> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
    return payload as T
  } catch (error) {
    throw new Error("Your token has expired or is invalid")
  }
}

export async function setUserCookie(user: IUser) {
  const token = await signJWT({
    id: (user._id as string), // 👈 see note below
    username: user.username,
    isAdmin: user.isAdmin,
  })

  const cookieStore = await cookies() // 👈 MUST await
  cookieStore.set({
    name: "auth-token",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "strict",
  })
}


export async function removeUserCookie() {
  const cookieStore = await cookies() // 👈 MUST await
  cookieStore.set({
    name: "auth-token",
    value: "",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    sameSite: "strict",
  })
}


export async function getUserFromCookie() {
  const cookieStore = await cookies() // ⬅ await here is required
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  try {
    const payload = await verifyJWT<{
      id: string
      username: string
      isAdmin: boolean
    }>(token)

    return payload
  } catch {
    return null
  }
}

