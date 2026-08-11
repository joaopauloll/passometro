import { prisma } from '@/lib/prisma'

type PacienteRisco = {
    id: string
    tipoStatus: string
    riscoJson: string | null
    ecocardiogramaData: Date | null
    ecocardiogramaResultado: string | null
    ecgData: Date | null
    ecgResultado: string | null
}

export async function sincronizarPendenciasRisco(
    paciente: PacienteRisco
) {
    // Agora controlamos pela descrição exata para permitir que a 
    // coluna 'tipo' use as chaves genéricas do TIPO_LABELS.
    const DESCRICOES_CONTROLADAS = {
        ECO_SOLICITAR: 'Solicitar ecocardiograma',
        ECO_RESULTADO: 'Registrar resultado do ecocardiograma',
        ECG_SOLICITAR: 'Solicitar ECG',
        ECG_RESULTADO: 'Registrar resultado do ECG',
    } as const

    const descricoesControladasArray = Object.values(DESCRICOES_CONTROLADAS)

    if (paciente.tipoStatus === 'POS_OPERATORIO') {
        await prisma.pendencia.updateMany({
            where: {
                pacienteId: paciente.id,
                descricao: { in: descricoesControladasArray },
                concluida: false,
            },
            data: { concluida: true },
        })
        return
    }

    // 1. Extrair os dados de dentro do riscoJson
    let riscoInfo: any = {}
    if (paciente.riscoJson) {
        try {
            riscoInfo = typeof paciente.riscoJson === 'string'
                ? JSON.parse(paciente.riscoJson)
                : paciente.riscoJson
        } catch (e) {
            console.error('Erro ao fazer parse de riscoJson:', e)
        }
    }

    // 2. Unificar a verificação (Olha na coluna raiz OU dentro do JSON)
    const temEco = paciente.ecocardiogramaData || riscoInfo?.dataEco
    const resEco = paciente.ecocardiogramaResultado || riscoInfo?.resultadoEco || riscoInfo?.resultadoEcocardiograma

    const temEcg = paciente.ecgData || riscoInfo?.dataEcg
    const resEcg = paciente.ecgResultado || riscoInfo?.resultadoEcg

    // ---------------------------------------------------------
    // ECOCARDIOGRAMA
    // ---------------------------------------------------------
    let ecoTipoNecessario: string | null = null
    let ecoDescricao: string | null = null

    if (!temEco) {
        ecoTipoNecessario = 'RISCO_CIRURGICO'
        ecoDescricao = DESCRICOES_CONTROLADAS.ECO_SOLICITAR
    } else if (!resEco || !String(resEco).trim()) {
        ecoTipoNecessario = 'RISCO_CIRURGICO'
        ecoDescricao = DESCRICOES_CONTROLADAS.ECO_RESULTADO
    }

    // ---------------------------------------------------------
    // ECG
    // ---------------------------------------------------------
    let ecgTipoNecessario: string | null = null
    let ecgDescricao: string | null = null

    if (!temEcg) {
        ecgTipoNecessario = 'RISCO_CIRURGICO'
        ecgDescricao = DESCRICOES_CONTROLADAS.ECG_SOLICITAR
    } else if (!resEcg || !String(resEcg).trim()) {
        ecgTipoNecessario = 'RISCO_CIRURGICO'
        ecgDescricao = DESCRICOES_CONTROLADAS.ECG_RESULTADO
    }

    // ---------------------------------------------------------
    // Remove/conclui as pendências que não são mais necessárias
    // ---------------------------------------------------------
    const descricoesNecessarias = [
        ecoDescricao,
        ecgDescricao,
    ].filter(Boolean) as string[]

    const descricoesParaConcluir = descricoesControladasArray.filter(
        (desc) => !descricoesNecessarias.includes(desc)
    )

    if (descricoesParaConcluir.length > 0) {
        await prisma.pendencia.updateMany({
            where: {
                pacienteId: paciente.id,
                descricao: { in: descricoesParaConcluir },
                concluida: false,
            },
            data: { concluida: true },
        })
    }

    // ---------------------------------------------------------
    // Cria a pendência necessária, caso ainda não exista
    // ---------------------------------------------------------
    if (ecoTipoNecessario && ecoDescricao) {
        await criarPendenciaSeNecessaria(
            paciente.id,
            ecoTipoNecessario,
            ecoDescricao
        )
    }

    if (ecgTipoNecessario && ecgDescricao) {
        await criarPendenciaSeNecessaria(
            paciente.id,
            ecgTipoNecessario,
            ecgDescricao
        )
    }
}

async function criarPendenciaSeNecessaria(
    pacienteId: string,
    tipo: string,
    descricao: string
) {
    const existente = await prisma.pendencia.findFirst({
        where: {
            pacienteId,
            tipo,
            descricao, // Verifica a descrição para evitar duplicidade 
            concluida: false,
        },
    })

    if (existente) return

    await prisma.pendencia.create({
        data: {
            pacienteId,
            tipo,
            descricao,
        },
    })
}