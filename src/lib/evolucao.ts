import type { EvolucaoFormData, PendenciaParaGerar, TipoPendencia } from '@/types'

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Gera o texto corrido de evolução a partir dos dados do formulário.
 */
export function gerarTextoEvolucao(
    dados: EvolucaoFormData,
    isPosOperatorio: boolean,
    idadePaciente?: number
): string {
    const partes: string[] = []

    // ── Estado geral ────────────────────────────────────────
    const eg: string[] = []
    if (dados.estavel === true) eg.push('estável')
    else if (dados.estavel === false) eg.push('instável')
    if (dados.febre === false) eg.push('afebril')
    else if (dados.febre === true) eg.push('febril')

    if (dados.semDor === true) eg.push('sem dor')
    else if (dados.dorControlada === true) eg.push('dor controlada')
    else if (dados.dorControlada === false) eg.push('com dor de difícil controle')

    if (eg.length > 0) {
        const qualidadeEstado = dados.estavel === false ? 'regular' : 'bom'
        partes.push(`Paciente em ${qualidadeEstado} estado geral, ${eg.join(', ')}.`)
    }

    // ── Eliminações ─────────────────────────────────────────
    const elim: string[] = []
    if (dados.diurese === 'espontanea') elim.push('diurese espontânea')
    else if (dados.diurese === 'svd') elim.push('diurese por SVD')
    else if (dados.diurese === 'anurico') elim.push('anúrico')

    if (dados.ultimaEvacuacao) elim.push(`última evacuação há ${dados.ultimaEvacuacao}`)

    if (elim.length > 0) partes.push(capitalize(elim.join(', ')) + '.')

    // ── Exame físico ─────────────────────────────────────────
    const preservados: string[] = []
    const alterados: string[] = []

    if (dados.perfusaoPreservada === true) preservados.push('perfusão distal')
    else if (dados.perfusaoPreservada === false) alterados.push('perfusão distal comprometida')

    if (dados.sensibilidadePreservada === true) preservados.push('sensibilidade')
    else if (dados.sensibilidadePreservada === false) alterados.push('sensibilidade alterada')

    if (dados.movimentoPreservado === true) preservados.push('mobilidade')
    else if (dados.movimentoPreservado === false) alterados.push('mobilidade comprometida')

    if (preservados.length > 0) {
        partes.push(`${capitalize(preservados.join(', '))} preservada(s).`)
    }
    if (alterados.length > 0) {
        partes.push(`Atenção: ${alterados.join(', ')}.`)
    }

    // ── Imobilização ─────────────────────────────────────────
    if (dados.usaGesso === true && dados.qualGesso) {
        partes.push(`Em uso de ${dados.qualGesso}.`)
    } else if (dados.usaGesso === false) {
        partes.push('Sem imobilização com gesso.')
    }

    // ── Curativo ─────────────────────────────────────────────
    if (dados.possuiCurativo === true) {
        if (dados.curativoLimpo === true && !dados.secrecaoInfecciosa && !dados.secrecaoSanguinolenta) {
            partes.push('Curativo limpo, sem sinais de infecção.')
        } else {
            const problemas: string[] = []
            if (dados.secrecaoInfecciosa === true) problemas.push('secreção infecciosa')
            if (dados.secrecaoSanguinolenta === true) problemas.push('secreção sanguinolenta')
            if (problemas.length > 0) {
                partes.push(`Curativo com ${problemas.join(' e ')}, com sinais de infecção local.`)
            } else {
                partes.push('Curativo com alterações.')
            }
        }
    } else if (dados.possuiCurativo === false) {
        partes.push('Sem curativo.')
    }

    // ── RX pós-operatório ────────────────────────────────────
    if (isPosOperatorio) {
        if (dados.rxPosOpRealizado === true) {
            if (dados.rxSatisfatorio === true) {
                const enviado = dados.rxEnviadoCirurgiao ? ' e enviado ao cirurgião' : ''
                partes.push(`RX pós-operatório satisfatório${enviado}.`)
            } else if (dados.rxSatisfatorio === false) {
                partes.push('RX pós-operatório realizado — resultado insatisfatório, necessita reavaliação.')
            }
        } else if (dados.rxPosOpRealizado === false) {
            partes.push('RX pós-operatório pendente.')
        }
    }

    // ── Laboratórios ─────────────────────────────────────────
    const labAlterados: string[] = []
    if (dados.hemoglobina != null && dados.hemoglobina < 10) {
        labAlterados.push(`hemoglobina ${dados.hemoglobina} g/dL (baixa)`)
    }
    if (dados.plaquetas != null && dados.plaquetas < 100) {
        labAlterados.push(`plaquetas ${dados.plaquetas} mil/µL (baixas)`)
    }
    if (dados.inr != null && dados.inr > 1.5) {
        labAlterados.push(`INR ${dados.inr} (elevado)`)
    }
    if (labAlterados.length > 0) {
        partes.push(`Laboratório com alterações: ${labAlterados.join(', ')}.`)
    }

    // ── Cardiovascular ───────────────────────────────────────
    if (idadePaciente && idadePaciente >= 55) {
        if (dados.cardiologistaLiberou === true) {
            partes.push('Risco cardiovascular concluído, cardiologista liberou para cirurgia.')
        } else if (dados.cardioPendente === true) {
            partes.push('Aguardando avaliação de risco cardiovascular.')
        }
        if (dados.necessitaUTI === true) {
            partes.push('Necessita UTI pós-operatória conforme avaliação cardiológica.')
        }
    }

    // ── Clínica médica ───────────────────────────────────────
    if (dados.acompClinico === true) {
        const nome = dados.nomeClinico ? ` com Dr(a). ${dados.nomeClinico}` : ''
        partes.push(`Mantém seguimento da clínica médica${nome}.`)
    } else if (dados.acompClinico === false) {
        partes.push('Sem acompanhamento da clínica médica. Necessário realizar prescrição clínica.')
    }

    // ── Observações livres ───────────────────────────────────
    if (dados.observacoes) {
        partes.push(dados.observacoes)
    }

    // ── Conclusão ────────────────────────────────────────────
    const temAlteracao =
        dados.estavel === false ||
        dados.febre === true ||
        dados.dorControlada === false ||
        alterados.length > 0 ||
        dados.secrecaoInfecciosa === true ||
        labAlterados.length > 0

    if (!temAlteracao) {
        partes.push('Sem novas intercorrências.')
    }

    return partes.join(' ')
}

/**
 * Gera a lista de pendências automáticas a partir dos dados da evolução.
 */
export function gerarPendencias(
    dados: EvolucaoFormData,
    isPosOperatorio: boolean,
    idadePaciente?: number
): PendenciaParaGerar[] {
    const pendencias: PendenciaParaGerar[] = []

    // RX pós-op
    if (isPosOperatorio && dados.rxPosOpRealizado === false) {
        pendencias.push({ descricao: 'Solicitar RX pós-operatório', tipo: 'RX' as TipoPendencia })
    }
    if (isPosOperatorio && dados.rxSatisfatorio === false) {
        pendencias.push({ descricao: 'RX pós-op insatisfatório — reavaliação necessária', tipo: 'RX' as TipoPendencia })
    }
    if (isPosOperatorio && dados.rxPosOpRealizado === true && dados.rxEnviadoCirurgiao === false) {
        pendencias.push({ descricao: 'Enviar RX pós-operatório ao cirurgião', tipo: 'RX' as TipoPendencia })
    }

    // Risco cardiovascular
    if (idadePaciente && idadePaciente >= 55) {
        if (!dados.cardiologistaLiberou && dados.cardioPendente !== false) {
            pendencias.push({ descricao: 'Solicitar avaliação de risco cardiovascular', tipo: 'RISCO_CIRURGICO' as TipoPendencia })
        }
        if (dados.solicitouEco === true && !dados.ecoReady) {
            pendencias.push({ descricao: 'Aguardando resultado do ecocardiograma', tipo: 'EXAME' as TipoPendencia })
        }
    }

    // Clínica médica
    if (dados.acompClinico === false) {
        pendencias.push({ descricao: 'Realizar prescrição clínica', tipo: 'CLINICA' as TipoPendencia })
    }

    // Infecção
    if (dados.secrecaoInfecciosa === true) {
        pendencias.push({ descricao: 'Avaliar infecção — curativo com secreção infecciosa', tipo: 'INFECTOLOGIA' as TipoPendencia })
    }

    // Alta — checklist
    if (dados.altaHoje === true) {
        if (!dados.chkReceita) pendencias.push({ descricao: 'Receita de alta', tipo: 'ALTA' as TipoPendencia })
        if (!dados.chkRelatorio) pendencias.push({ descricao: 'Relatório médico de alta', tipo: 'ALTA' as TipoPendencia })
        if (!dados.chkOrientacoes) pendencias.push({ descricao: 'Orientações ao paciente', tipo: 'ALTA' as TipoPendencia })
        if (!dados.chkAtestado) pendencias.push({ descricao: 'Atestado médico', tipo: 'ALTA' as TipoPendencia })
        if (!dados.chkRetorno) pendencias.push({ descricao: 'Pedido de retorno ambulatorial', tipo: 'ALTA' as TipoPendencia })
        if (!dados.chkRX) pendencias.push({ descricao: 'Pedido de Raio-X de retorno', tipo: 'ALTA' as TipoPendencia })
    }

    return pendencias
}

/**
 * Retorna a cor do badge para o tipo de pendência.
 */
export function corPendencia(tipo: string): string {
    switch (tipo) {
        case 'ALTA': return 'bg-green-100 text-green-800 border-green-200'
        case 'RX': return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'RISCO_CIRURGICO': return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'INFECTOLOGIA': return 'bg-red-100 text-red-800 border-red-200'
        case 'EXAME': return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'CLINICA': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}
