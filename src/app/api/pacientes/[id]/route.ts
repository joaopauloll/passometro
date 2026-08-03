import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/pacientes/[id]
export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params

    const paciente = await prisma.paciente.findUnique({
        where: { id },
        include: {
            cirurgias: { orderBy: { dataCirurgia: 'desc' } },
            evolucoes: { orderBy: { data: 'desc' } },
            pendencias: {
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

    return NextResponse.json(paciente)
}

// PUT /api/pacientes/[id]
export async function PUT(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params

    try {
        const body = await req.json()
        const { cirurgias: cirurgiasData, ...pacienteData } = body

        const paciente = await prisma.paciente.update({
            where: { id },
            data: {
                nome: pacienteData.nome,
                leito: pacienteData.leito,
                registroHospitalar: pacienteData.registroHospitalar,
                dataInternacao: new Date(pacienteData.dataInternacao),
                diagnostico: pacienteData.diagnostico,
                cid: pacienteData.cid || null,
                subespecialidade: pacienteData.subespecialidade || null,
                cirurgioes: JSON.stringify(pacienteData.cirurgioes || []),
                status: pacienteData.status || 'INTERNADO',
                tipoStatus: pacienteData.tipoStatus || 'PRE_OPERATORIO',
                comorbidades: pacienteData.comorbidades || null,
                medicacoes: pacienteData.medicacoes || null,
                alergias: pacienteData.alergias || null,
                dataNascimento: pacienteData.dataNascimento ? new Date(pacienteData.dataNascimento) : null,
                temInfeccao: Boolean(pacienteData.temInfeccao),
            },
        })

        // Recria as cirurgias se enviadas
        if (cirurgiasData !== undefined) {
            await prisma.cirurgia.deleteMany({ where: { pacienteId: id } })
            if (cirurgiasData.length > 0) {
                await prisma.cirurgia.createMany({
                    data: cirurgiasData.map((c: {
                        nomeCirurgia: string
                        cirurgiao: string
                        dataCirurgia: string
                        hospitalExterno?: string
                    }) => ({
                        pacienteId: id,
                        nomeCirurgia: c.nomeCirurgia,
                        cirurgiao: c.cirurgiao,
                        dataCirurgia: new Date(c.dataCirurgia),
                        hospitalExterno: c.hospitalExterno || null,
                    })),
                })
            }
        }

        return NextResponse.json(paciente)
    } catch (err) {
        console.error('[PUT /api/pacientes/[id]]', err)
        return NextResponse.json({ error: 'Erro ao atualizar paciente' }, { status: 500 })
    }
}

// DELETE /api/pacientes/[id] — arquiva (muda status) em vez de deletar
export async function DELETE(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const { searchParams } = req.nextUrl
    const novoStatus = searchParams.get('status') || 'ALTA_HOSPITALAR'

    const paciente = await prisma.paciente.update({
        where: { id },
        data: { status: novoStatus },
    })

    return NextResponse.json(paciente)
}
