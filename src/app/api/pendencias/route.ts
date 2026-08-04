import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/pendencias — retorna todas as pendências (ativas por padrão)
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const todasParam = searchParams.get('todas')
    const soAtivas = todasParam !== 'true'

    const pendencias = await prisma.pendencia.findMany({
        where: soAtivas ? { concluida: false } : undefined,
        orderBy: [{ createdAt: 'asc' }],
        include: {
            paciente: {
                select: {
                    id: true,
                    nome: true,
                    leito: true,
                    diagnostico: true,
                    cirurgioes: true,
                    subespecialidade: true,
                    status: true,
                },
            },
        },
    })

    return NextResponse.json(pendencias)
}

// PATCH /api/pendencias — resolve/reabre uma pendência pelo ID
export async function PATCH(req: NextRequest) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    try {
        const { pendenciaId, concluida } = await req.json()
        if (!pendenciaId) return NextResponse.json({ error: 'pendenciaId obrigatório' }, { status: 400 })

        const pendencia = await prisma.pendencia.update({
            where: { id: pendenciaId },
            data: { concluida: Boolean(concluida) },
        })

        return NextResponse.json(pendencia)
    } catch (err) {
        console.error('[PATCH /api/pendencias]', err)
        return NextResponse.json({ error: 'Erro ao atualizar pendência' }, { status: 500 })
    }
}
