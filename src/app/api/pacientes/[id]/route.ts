import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { sincronizarPendenciasRisco } from '@/lib/sincronizar-pendencias'

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
                historiaDoencaAtual: pacienteData.historiaDoencaAtual || pacienteData.traumaMecanismo || null,
                houveTrauma: Boolean(pacienteData.houveTrauma ?? pacienteData.traumaData),
                dataNascimento: pacienteData.dataNascimento ? new Date(pacienteData.dataNascimento) : null,
                temInfeccao: Boolean(pacienteData.temInfeccao),
                compSolturaAssetica: Boolean(pacienteData.compSolturaAssetica),
                compLuxacao: Boolean(pacienteData.compLuxacao),
                compFalhaImplante: Boolean(pacienteData.compFalhaImplante),
                compPseudoartrose: Boolean(pacienteData.compPseudoartrose),
                compOutro: pacienteData.compOutro || null,
                traumaMecanismo: pacienteData.traumaMecanismo || null,
                traumaData: pacienteData.traumaData ? new Date(pacienteData.traumaData) : null,
                traumaTempo: pacienteData.traumaTempo || null,
                // Novos campos
                cpf: pacienteData.cpf || null,
                comorbidadesJson: pacienteData.comorbidadesJson || null,
                funcaoRenal: pacienteData.funcaoRenal || null,
                prevCirurgiasOrto: Boolean(pacienteData.prevCirurgiasOrto),
                prevCirurgiasJson: pacienteData.prevCirurgiasJson || null,
                temAlergia: Boolean(pacienteData.temAlergia),
                medicamentosJson: pacienteData.medicamentosJson || null,
                hemoglobinaAdm: pacienteData.hemoglobinaAdm ?? null,
                plaquetasAdm: pacienteData.plaquetasAdm ?? null,
                inrAdm: pacienteData.inrAdm ?? null,
                pps: pacienteData.pps ?? null,
                infeccaoJson: pacienteData.infeccaoJson || null,
                altaOrtopediaData: pacienteData.altaOrtopediaData ? new Date(pacienteData.altaOrtopediaData) : null,
                altaHospitalarData: pacienteData.altaHospitalarData ? new Date(pacienteData.altaHospitalarData) : null,
                previsaoAltaOrto: pacienteData.previsaoAltaOrto || null,
                clinicaMedico: pacienteData.clinicaMedico || null,
                aguardaClinica: Boolean(pacienteData.aguardaClinica),
                riscoJson: pacienteData.riscoJson || null,
                ecocardiogramaData: pacienteData.ecocardiogramaData
                    ? new Date(pacienteData.ecocardiogramaData)
                    : null,

                ecocardiogramaResultado: pacienteData.ecocardiogramaResultado || null,

                ecgData: pacienteData.ecgData
                    ? new Date(pacienteData.ecgData)
                    : null,

                ecgResultado: pacienteData.ecgResultado || null,
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
                        diagnostico?: string
                        cid?: string
                        intercorrencia?: boolean
                        intercorrenciaDesc?: string
                    }) => ({
                        pacienteId: id,
                        nomeCirurgia: c.nomeCirurgia,
                        cirurgiao: c.cirurgiao,
                        dataCirurgia: new Date(c.dataCirurgia),
                        hospitalExterno: c.hospitalExterno || null,
                        diagnostico: c.diagnostico || null,
                        cid: c.cid || null,
                        intercorrencia: Boolean(c.intercorrencia),
                        intercorrenciaDesc: c.intercorrenciaDesc || null,
                    })),
                })
            }
        }

        await sincronizarPendenciasRisco(paciente)

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
