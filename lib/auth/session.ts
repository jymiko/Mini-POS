import { cookies } from 'next/headers'

export interface SessionUser {
  id: string
  username: string
  name: string
  role: string
}

const SESSION_COOKIE_NAME = 'pos_session'

export async function createSession(user: SessionUser) {
  const cookieStore = await cookies()
  const sessionData = JSON.stringify(user)

  cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie) {
    return null
  }

  try {
    const user = JSON.parse(sessionCookie.value) as SessionUser
    return user
  } catch {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}
