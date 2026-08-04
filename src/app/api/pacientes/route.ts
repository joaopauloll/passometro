import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/pacientes — lista todos os pacientes (com filtros opcionais)
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status') || 'INTERNADO'
    const busca = searchParams.get('busca') || ''
    const leito = searchParams.get('leito') || ''
    const cirurgiao = searchParams.get('cirurgiao') || ''
    const subespecialidade = searchParams.get('subespecialidade') || ''
    const tipoStatus = searchParams.get('tipoStatus') || ''
    const infeccao = searchParams.get('infeccao')
    const altaHoje = searchParams.get('altaHoje')
    const aguardandoRisco = searchParams.get('aguardandoRisco')
    const aguardandoCirurgia = searchParams.get('aguardandoCirurgia')

    const where: Record<string, unknown> = {
        status,
        ...(busca && {
            OR: [
                { nome: { contains: busca } },
                { diagnostico: { contains: busca } },
                { registroHospitalar: { contains: busca } },
            ],
        }),
        ...(leito && { leito: { contains: leito } }),
        ...(cirurgiao && { cirurgioes: { contains: cirurgiao } }),
        ...(subespecialidade && { subespecialidade }),
        ...(tipoStatus && { tipoStatus }),
        ...(infeccao === 'true' && { temInfeccao: true }),
        ...(aguardandoCirurgia === 'true' && { tipoStatus: 'PRE_OPERATORIO' }),
    }

    const pacientes = await prisma.paciente.findMany({
        where,
        include: {
            pendencias: {
                where: { concluida: false },
                orderBy: { createdAt: 'desc' },
            },
            cirurgias: { orderBy: { dataCirurgia: 'desc' } },
            evolucoes: {
                orderBy: { data: 'desc' },
                take: 1,
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    // Filtros client-side (baseados em dados relacionados)
    let resultado = pacientes
    if (altaHoje === 'true') {
        resultado = resultado.filter((p) => p.evolucoes[0]?.altaHoje === true)
    }
    if (aguardandoRisco === 'true') {
        resultado = resultado.filter((p) =>
            p.pendencias.some((pe) => pe.tipo === 'RISCO_CIRURGICO' && !pe.concluida)
        )
    }

    return NextResponse.json(resultado)
}

// POST /api/pacientes — cria novo paciente
export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    try {
        const body = await req.json()

        const { cirurgias: cirurgiasData, ...pacienteData } = body

        const paciente = await prisma.paciente.create({
            data: {
                nome: pacienteData.nome,
                leito: pacienteData.leito,
                registroHospitalar: pacienteData.registroHospitalar,
                dataInternacao: new Date(pacienteData.dataInternacao),
                diagnostico: pacienteData.diagnostico,
                cid: pacienteData.cid || null,
                subespecialidade: pacienteData.subespecialidade || null,
                cirurgioes: JSON.stringify(pacienteData.cirurgioes || []),
                status: 'INTERNADO',
                tipoStatus: pacienteData.tipoStatus || 'PRE_OPERATORIO',
                comorbidades: pacienteData.comorbidades || null,
                medicacoes: pacienteData.medicacoes || null,
                alergias: pacienteData.alergias || null,
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
                ...(cirurgiasData?.length && {
                    cirurgias: {
                        create: cirurgiasData.map((c: {
                            nomeCirurgia: string
                            cirurgiao: string
                            dataCirurgia: string
                            hospitalExterno?: string
                        }) => ({
                            nomeCirurgia: c.nomeCirurgia,
                            cirurgiao: c.cirurgiao,
                            dataCirurgia: new Date(c.dataCirurgia),
                            hospitalExterno: c.hospitalExterno || null,
                        })),
                    },
                }),
            },
            include: { cirurgias: true },
        })

        return NextResponse.json(paciente, { status: 201 })
    } catch (err) {
        console.error('[POST /api/pacientes]', err)
        return NextResponse.json({ error: 'Erro ao criar paciente' }, { status: 500 })
    }
}
