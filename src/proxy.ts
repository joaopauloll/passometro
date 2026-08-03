import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Permite caminhos públicos
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    const session = await getSessionFromRequest(req)

    if (!session) {
        const loginUrl = new URL('/login', req.url)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
