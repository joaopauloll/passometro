import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/evolucoes — retorna todas as evoluções com dados do paciente
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const pacienteId = searchParams.get('pacienteId') || undefined

    const evolucoes = await prisma.evolucao.findMany({
        where: pacienteId ? { pacienteId } : undefined,
        orderBy: { data: 'desc' },
        include: {
            paciente: {
                select: {
                    id: true,
                    nome: true,
                    leito: true,
                    diagnostico: true,
                    cid: true,
                    cirurgioes: true,
                    subespecialidade: true,
                    status: true,
                    tipoStatus: true,
                    dataInternacao: true,
                },
            },
        },
    })

    return NextResponse.json(evolucoes)
}
