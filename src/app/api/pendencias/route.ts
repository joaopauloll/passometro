import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/pendencias
// Retorna todas as pendências ativas por padrão.
// Use ?todas=true para retornar também as concluídas.
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req)

    if (!session) {
        return NextResponse.json(
            { error: 'Não autorizado' },
            { status: 401 }
        )
    }

    try {
        const { searchParams } = req.nextUrl


        const todasParam = searchParams.get('todas')
        const soAtivas = todasParam !== 'true'

        const pendencias = await prisma.pendencia.findMany({
            where: soAtivas
                ? { concluida: false }
                : undefined,

            orderBy: [
                {
                    createdAt: 'asc',
                },
            ],

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


    } catch (err) {
        console.error('[GET /api/pendencias]', err)


        return NextResponse.json(
            { error: 'Erro ao buscar pendências' },
            { status: 500 }
        )


    }
}

// PATCH /api/pendencias
// Resolve ou reabre uma pendência pelo ID.
export async function PATCH(req: NextRequest) {
    const session = await getSessionFromRequest(req)

    if (!session) {
        return NextResponse.json(
            { error: 'Não autorizado' },
            { status: 401 }
        )
    }

    try {
        const body = await req.json()


        const { pendenciaId, concluida } = body

        if (!pendenciaId) {
            return NextResponse.json(
                { error: 'pendenciaId obrigatório' },
                { status: 400 }
            )
        }

        if (typeof concluida !== 'boolean') {
            return NextResponse.json(
                { error: 'concluida deve ser um booleano' },
                { status: 400 }
            )
        }

        const pendencia = await prisma.pendencia.update({
            where: {
                id: pendenciaId,
            },

            data: {
                concluida,
            },
        })

        return NextResponse.json(pendencia)


    } catch (err) {
        console.error('[PATCH /api/pendencias]', err)


        return NextResponse.json(
            { error: 'Erro ao atualizar pendência' },
            { status: 500 }
        )


    }
}

// DELETE /api/pendencias
// Remove uma pendência pelo ID.
export async function DELETE(req: NextRequest) {
    const session = await getSessionFromRequest(req)

    if (!session) {
        return NextResponse.json(
            { error: 'Não autorizado' },
            { status: 401 }
        )
    }

    try {
        const body = await req.json()


        const { pendenciaId } = body

        if (!pendenciaId) {
            return NextResponse.json(
                { error: 'pendenciaId obrigatório' },
                { status: 400 }
            )
        }

        await prisma.pendencia.delete({
            where: {
                id: pendenciaId,
            },
        })

        return NextResponse.json({
            success: true,
        })


    } catch (err) {
        console.error('[DELETE /api/pendencias]', err)


        return NextResponse.json(
            { error: 'Erro ao remover pendência' },
            { status: 500 }
        )


    }
}
