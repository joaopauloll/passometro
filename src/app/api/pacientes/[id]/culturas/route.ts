import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { id } = await params
    const culturas = await prisma.cultura.findMany({
        where: { pacienteId: id },
        orderBy: { dataColeta: 'desc' },
    })
    return NextResponse.json(culturas)
}

export async function POST(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { id } = await params
    const { dataColeta, sitio, resultado, dataResult } = await req.json()
    const cultura = await prisma.cultura.create({
        data: {
            pacienteId: id,
            dataColeta: new Date(dataColeta),
            sitio,
            resultado: resultado || null,
            dataResult: dataResult ? new Date(dataResult) : null,
        },
    })
    return NextResponse.json(cultura, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { searchParams } = req.nextUrl
    const culturaId = searchParams.get('culturaId')
    if (!culturaId) return NextResponse.json({ error: 'culturaId obrigatório' }, { status: 400 })
    await prisma.cultura.delete({ where: { id: culturaId } })
    return NextResponse.json({ ok: true })
}
