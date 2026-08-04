import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { id } = await params
    const pareceres = await prisma.parecer.findMany({
        where: { pacienteId: id },
        orderBy: { data: 'desc' },
    })
    return NextResponse.json(pareceres)
}

export async function POST(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { id } = await params
    const { especialidade, data, descricao, medico } = await req.json()
    const parecer = await prisma.parecer.create({
        data: { pacienteId: id, especialidade, data: new Date(data), descricao, medico: medico || null },
    })
    return NextResponse.json(parecer, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { searchParams } = req.nextUrl
    const parecerId = searchParams.get('parecerId')
    if (!parecerId) return NextResponse.json({ error: 'parecerId obrigatório' }, { status: 400 })
    await prisma.parecer.delete({ where: { id: parecerId } })
    return NextResponse.json({ ok: true })
}
