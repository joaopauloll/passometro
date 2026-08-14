import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { gerarTextoEvolucao } from '@/lib/evolucao'
import type { EvolucaoFormData } from '@/types'

type Params = { params: Promise<{ id: string; evolucaoId: string }> }

// PUT /api/pacientes/[id]/evolucoes/[evolucaoId] — edita uma evolução existente
export async function PUT(req: NextRequest, { params }: Params) {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id, evolucaoId } = await params

    try {
        const paciente = await prisma.paciente.findUnique({ where: { id } })
        if (!paciente) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

        const dados: EvolucaoFormData = await req.json()
        const isPosOp = paciente.tipoStatus === 'POS_OPERATORIO'

        let idadePaciente: number | undefined
        if (paciente.dataNascimento) {
            const hoje = new Date()
            const nasc = new Date(paciente.dataNascimento)
            let idade = hoje.getFullYear() - nasc.getFullYear()
            const m = hoje.getMonth() - nasc.getMonth()
            if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
            idadePaciente = idade
        }

        const textoGerado = gerarTextoEvolucao(dados, isPosOp, idadePaciente)

        const evolucao = await prisma.evolucao.update({
            where: { id: evolucaoId },
            data: {
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
                altaHoje: dados.altaHoje ?? null,
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

        return NextResponse.json(evolucao)
    } catch (err) {
        console.error('[PUT /api/pacientes/[id]/evolucoes/[evolucaoId]]', err)
        return NextResponse.json({ error: 'Erro ao atualizar evolução' }, { status: 500 })
    }
}
