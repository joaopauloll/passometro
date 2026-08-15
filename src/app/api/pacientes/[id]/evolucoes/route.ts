import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { gerarTextoEvolucao, gerarPendencias } from '@/lib/evolucao'
import type { EvolucaoFormData } from '@/types'

type Params = { params: Promise<{ id: string }> }

// GET /api/pacientes/[id]/evolucoes
export async function GET(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params

    const evolucoes = await prisma.evolucao.findMany({
        where: { pacienteId: id },
        include: { pendencias: true },
        orderBy: { data: 'desc' },
    })

    return NextResponse.json(evolucoes)
}

// POST /api/pacientes/[id]/evolucoes
export async function POST(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params

    try {
        const paciente = await prisma.paciente.findUnique({
            where: { id },
            include: { cirurgias: { orderBy: { dataCirurgia: 'desc' } }, pareceres: { orderBy: { data: 'desc' } }, },
        })
        if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

        const dados: EvolucaoFormData = await req.json()
        const isPosOp = paciente.tipoStatus === 'POS_OPERATORIO'

        if (dados.somenteLaboratorio && dados.dataExame) {
            const dataExame = new Date(`${dados.dataExame}T00:00:00`)
            const proximoDia = new Date(dataExame)
            proximoDia.setDate(proximoDia.getDate() + 1)
            const laboratorios = {
                dataExame,
                hemoglobina: dados.hemoglobina ?? null,
                plaquetas: dados.plaquetas ?? null,
                inr: dados.inr ?? null,
                leucocitos: dados.leucocitos ?? null,
                pcr: dados.pcr ?? null,
                vhs: dados.vhs ?? null,
                creatinina: dados.creatinina ?? null,
                ureia: dados.ureia ?? null,
            }
            const existente = await prisma.evolucao.findFirst({
                where: { pacienteId: id, data: { gte: dataExame, lt: proximoDia } },
                orderBy: { createdAt: 'desc' },
            })
            const evolucao = existente
                ? await prisma.evolucao.update({ where: { id: existente.id }, data: laboratorios })
                : await prisma.evolucao.create({
                    data: {
                        pacienteId: id,
                        data: dataExame,
                        estavel: true,
                        febre: false,
                        semDor: true,
                        dorControlada: true,
                        diurese: 'espontanea',
                        perfusaoPreservada: true,
                        sensibilidadePreservada: true,
                        movimentoPreservado: true,
                        acompClinico: true,
                        textoGerado: 'Exames laboratoriais registrados.',
                        ...laboratorios,
                    },
                })
            return NextResponse.json(evolucao, { status: existente ? 200 : 201 })
        }

        // Calcula idade
        let idadePaciente: number | undefined
        if (paciente.dataNascimento) {
            const hoje = new Date()
            const nasc = new Date(paciente.dataNascimento)
            idadePaciente = hoje.getFullYear() - nasc.getFullYear()
            const m = hoje.getMonth() - nasc.getMonth()
            if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
                idadePaciente--
            }
        }

        // Gera texto automático
        const textoGerado = gerarTextoEvolucao(dados, isPosOp, idadePaciente, {
            paciente: { diagnostico: paciente.diagnostico, cid: paciente.cid, historiaDoencaAtual: paciente.historiaDoencaAtual, dataInternacao: paciente.dataInternacao },
            cirurgias: paciente.cirurgias,
            pareceres: paciente.pareceres,
            pendencias: dados.pendenciasSelecionadas,
        })

        // Cria evolução
        const evolucao = await prisma.evolucao.create({
            data: {
                pacienteId: id,
                estavel: dados.estavel ?? null,
                febre: dados.febre ?? null,
                semDor: dados.semDor ?? null,
                dorControlada: dados.dorControlada ?? null,
                diurese: dados.diurese ?? null,
                ultimaEvacuacao: dados.ultimaEvacuacao ?? null,
                perfusaoPreservada: dados.perfusaoPreservada ?? null,
                sensibilidadePreservada: dados.sensibilidadePreservada ?? null,
                movimentoPreservado: dados.movimentoPreservado ?? null,
                usaGesso: dados.usaGesso ?? null,
                qualGesso: dados.qualGesso ?? null,
                imobilizacaoTipos: dados.imobilizacaoTipos?.length ? JSON.stringify(dados.imobilizacaoTipos) : null,
                imobilizacaoLateralidade: dados.imobilizacaoLateralidade ?? null,
                possuiCurativo: dados.possuiCurativo ?? null,
                curativoLimpo: dados.curativoLimpo ?? null,
                secrecaoInfecciosa: dados.secrecaoInfecciosa ?? null,
                secrecaoSanguinolenta: dados.secrecaoSanguinolenta ?? null,
                curativoLocal: dados.curativoLocal ?? null,
                curativoLateralidade: dados.curativoLateralidade ?? null,
                rxPosOpRealizado: dados.rxPosOpRealizado ?? null,
                rxSatisfatorio: dados.rxSatisfatorio ?? null,
                rxEnviadoCirurgiao: dados.rxEnviadoCirurgiao ?? null,
                deficitPrevio: dados.deficitPrevio ?? null,
                movPosOp: dados.movPosOp ?? null,
                sensPosOp: dados.sensPosOp ?? null,
                deficitNeurol: dados.deficitNeurol ?? null,
                cardioPendente: dados.cardioPendente ?? null,
                cardiologistaLiberou: dados.cardiologistaLiberou ?? null,
                solicitouEco: dados.solicitouEco ?? null,
                ecoReady: dados.ecoReady ?? null,
                riscoConcluido: dados.riscoConcluido ?? null,
                necessitaUTI: dados.necessitaUTI ?? null,
                hemoglobina: dados.hemoglobina ?? null,
                plaquetas: dados.plaquetas ?? null,
                inr: dados.inr ?? null,
                leucocitos: dados.leucocitos ?? null,
                pcr: dados.pcr ?? null,
                vhs: dados.vhs ?? null,
                creatinina: dados.creatinina ?? null,
                ureia: dados.ureia ?? null,
                culturasSolicitadas: dados.culturasSolicitadas ?? null,
                culturasResultado: dados.culturasResultado ?? null,
                infectAvaliado: dados.infectAvaliado ?? null,
                nomeInfectologista: dados.nomeInfectologista ?? null,
                antibioticoAtual: dados.antibioticoAtual ?? null,
                diaTratamento: dados.diaTratamento ?? null,
                antibioticosPrevios: dados.antibioticosPrevios ?? null,
                lavCirurgicaRealizada: dados.lavCirurgicaRealizada ?? null,
                qtdLavagens: dados.qtdLavagens ?? null,
                retirouImplante: dados.retirouImplante ?? null,
                outrasLesoes: dados.outrasLesoes?.length ? JSON.stringify(dados.outrasLesoes) : null,
                acompClinico: dados.acompClinico ?? null,
                nomeClinico: dados.nomeClinico ?? null,
                altaPrevista: dados.altaPrevista ?? null,
                altaPrevistaData: dados.altaPrevistaData ? new Date(dados.altaPrevistaData) : null,
                altaHoje: dados.altaHoje ?? null,
                dataExame: dados.dataExame ? new Date(dados.dataExame) : null,
                chkReceita: dados.chkReceita ?? false,
                chkRelatorio: dados.chkRelatorio ?? false,
                chkOrientacoes: dados.chkOrientacoes ?? false,
                chkAtestado: dados.chkAtestado ?? false,
                chkRetorno: dados.chkRetorno ?? false,
                chkRX: dados.chkRX ?? false,
                sentou: dados.sentou ?? null,
                iniciouFisioterapia: dados.iniciouFisioterapia ?? null,
                dreno: dados.dreno ?? null,
                drenoCm3: dados.drenoCm3 ?? null,
                drenoAspecto: dados.drenoAspecto ?? null,
                observacoes: dados.observacoes ?? null,
                textoGerado,
            },
        })

        // Gera pendências automáticas
        const pendenciasParaGerar = dados.pendenciasSelecionadas ?? gerarPendencias(dados, isPosOp, idadePaciente)
        if (pendenciasParaGerar.length > 0) {
            await prisma.pendencia.createMany({
                data: pendenciasParaGerar.map((p) => ({
                    pacienteId: id,
                    evolucaoId: evolucao.id,
                    descricao: p.descricao,
                    tipo: p.tipo,
                    concluida: false,
                })),
            })
        }

        // Atualiza flag de infecção no paciente
        if (dados.secrecaoInfecciosa === true) {
            await prisma.paciente.update({
                where: { id },
                data: { temInfeccao: true },
            })
        }

        // Atualiza para POS_OPERATORIO se alta hoje
        if (dados.altaHoje === true && paciente.status === 'INTERNADO') {
            // Não muda automaticamente, deixa para o usuário escolher
        }

        const evolucaoComPendencias = await prisma.evolucao.findUnique({
            where: { id: evolucao.id },
            include: { pendencias: true },
        })

        return NextResponse.json(evolucaoComPendencias, { status: 201 })
    } catch (err) {
        console.error('[POST /api/pacientes/[id]/evolucoes]', err)
        return NextResponse.json({ error: 'Erro ao criar evolução' }, { status: 500 })
    }
}
