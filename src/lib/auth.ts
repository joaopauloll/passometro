import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const COOKIE_NAME = 'passometro_session'

export async function signToken(payload: Record<string, unknown>) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('12h')
        .sign(SECRET)
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET)
        return payload
    } catch {
        return null
    }
}

export async function getSessionFromCookies() {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyToken(token)
}

export async function getSessionFromRequest(req: NextRequest) {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyToken(token)
}

export { COOKIE_NAME }
