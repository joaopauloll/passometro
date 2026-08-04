import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Upsert to ensure the singleton always exists
    const config = await prisma.configuracao.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', hospitalNome: 'Hospital Memorial' },
        update: {},
    })
    return NextResponse.json(config)
}

export async function PUT(req: NextRequest) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const config = await prisma.configuracao.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', ...body },
        update: body,
    })
    return NextResponse.json(config)
}
