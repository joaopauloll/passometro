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
    const infeccao = searchParams.get('infeccao')
    const altaHoje = searchParams.get('altaHoje')

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
        ...(infeccao === 'true' && { temInfeccao: true }),
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

    // Filtro de alta hoje (baseado na última evolução)
    let resultado = pacientes
    if (altaHoje === 'true') {
        resultado = pacientes.filter((p) => p.evolucoes[0]?.altaHoje === true)
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
