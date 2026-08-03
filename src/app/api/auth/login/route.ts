import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { signToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 })
        }

        const adminUsername = process.env.ADMIN_USERNAME || 'admin'
        const adminPassword = process.env.ADMIN_PASSWORD || ''

        // Comparação resistente a timing attack
        let valid = false
        try {
            valid =
                timingSafeEqual(Buffer.from(username), Buffer.from(adminUsername)) &&
                timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword))
        } catch {
            // timingSafeEqual lança se os buffers têm tamanhos diferentes
            valid = false
        }

        if (!valid) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
        }

        const token = await signToken({ sub: 'admin', role: 'admin' })

        // Audit log
        await prisma.auditLog.create({
            data: {
                acao: 'LOGIN',
                ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            },
        })

        const response = NextResponse.json({ ok: true })
        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 12, // 12 horas
            path: '/',
        })

        return response
    } catch (err) {
        console.error('[LOGIN]', err)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
