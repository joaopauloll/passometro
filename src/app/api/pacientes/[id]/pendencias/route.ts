import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/pacientes/[id]/pendencias
export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params

    const pendencias = await prisma.pendencia.findMany({
        where: { pacienteId: id },
        orderBy: [{ concluida: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(pendencias)
}

// PATCH /api/pacientes/[id]/pendencias — resolve uma pendência
export async function PATCH(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    await params // ensure params is awaited

    try {
        const { pendenciaId, concluida } = await req.json()

        const pendencia = await prisma.pendencia.update({
            where: { id: pendenciaId },
            data: { concluida: Boolean(concluida) },
        })

        return NextResponse.json(pendencia)
    } catch (err) {
        console.error('[PATCH /api/pacientes/[id]/pendencias]', err)
        return NextResponse.json({ error: 'Erro ao atualizar pendência' }, { status: 500 })
    }
}

// POST /api/pacientes/[id]/pendencias — cria pendência manual
export async function POST(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params

    try {
        const { descricao, tipo } = await req.json()

        const pendencia = await prisma.pendencia.create({
            data: {
                pacienteId: id,
                descricao,
                tipo: tipo || 'OUTRO',
                concluida: false,
            },
        })

        return NextResponse.json(pendencia, { status: 201 })
    } catch (err) {
        console.error('[POST /api/pacientes/[id]/pendencias]', err)
        return NextResponse.json({ error: 'Erro ao criar pendência' }, { status: 500 })
    }
}
