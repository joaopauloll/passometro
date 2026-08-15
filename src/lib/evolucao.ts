import type { EvolucaoFormData, PendenciaParaGerar, TipoPendencia } from '@/types'

export type ContextoTextoEvolucao = {
    paciente?: { diagnostico?: string; cid?: string | null; historiaDoencaAtual?: string | null; dataInternacao?: Date | string }
    cirurgias?: { nomeCirurgia: string; dataCirurgia: Date | string; cirurgiao?: string }[]
    pareceres?: { especialidade: string; data: Date | string; descricao: string; medico?: string | null }[]
    pendencias?: PendenciaParaGerar[]
}

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Gera o texto corrido de evolução a partir dos dados do formulário.
 */
export function gerarTextoEvolucao(
    dados: EvolucaoFormData,
    isPosOperatorio: boolean,
    idadePaciente?: number,
    contexto?: ContextoTextoEvolucao,
): string {
    const partes: string[] = [];

    const formatarData = (valor: Date | string) =>
        new Date(valor).toLocaleDateString("pt-BR");

    const capitalize = (texto: string) =>
        texto.charAt(0).toUpperCase() + texto.slice(1);

    const hoje = new Date();

    /* ================================================================
     * CABEÇALHO
     * ================================================================ */

    const cabecalho: string[] = [];

    if (contexto?.paciente?.dataInternacao) {
        const dias = Math.max(
            0,
            Math.floor(
                (hoje.getTime() -
                    new Date(
                        contexto.paciente.dataInternacao,
                    ).getTime()) /
                86_400_000,
            ),
        );

        cabecalho.push(`${dias}º DIH`);
    }

    const ultimaCirurgia = contexto?.cirurgias?.[0];

    if (isPosOperatorio && ultimaCirurgia) {
        const dias = Math.max(
            0,
            Math.floor(
                (hoje.getTime() -
                    new Date(
                        ultimaCirurgia.dataCirurgia,
                    ).getTime()) /
                86_400_000,
            ),
        );

        cabecalho.push(`${dias}º DPO`);
    }

    if (
        cabecalho.length ||
        contexto?.paciente?.diagnostico
    ) {
        partes.push(
            `${cabecalho.join(", ")}${cabecalho.length ? ", " : ""
            }em ${isPosOperatorio
                ? "pós-operatório"
                : "pré-operatório"
            } de ${contexto?.paciente?.diagnostico ||
            "diagnóstico não informado"
            }${contexto?.paciente?.cid
                ? ` (CID ${contexto.paciente.cid})`
                : ""
            }.`,
        );
    }

    /* ================================================================
     * CIRURGIAS
     * ================================================================ */

    if (contexto?.cirurgias?.length) {
        partes.push(
            `Cirurgias:\n${contexto.cirurgias
                .map(
                    (cirurgia) =>
                        `(${formatarData(
                            cirurgia.dataCirurgia,
                        )}) ${cirurgia.nomeCirurgia}.`,
                )
                .join("\n")}`,
        );
    }

    /* ================================================================
     * HDA
     * ================================================================ */

    if (contexto?.paciente?.historiaDoencaAtual) {
        partes.push(
            `HDA:\n${contexto.paciente.historiaDoencaAtual}`,
        );
    }

    /* ================================================================
     * ESTADO GERAL + ELIMINAÇÕES
     * ================================================================ */

    const estadoGeral: string[] = [];

    if (dados.estavel === true) {
        estadoGeral.push("estável");
    } else if (dados.estavel === false) {
        estadoGeral.push("instável");
    }

    if (dados.febre === false) {
        estadoGeral.push("afebril");
    } else if (dados.febre === true) {
        estadoGeral.push("febril");
    }

    if (dados.semDor === true) {
        estadoGeral.push("sem dor");
    } else if (dados.dorControlada === true) {
        estadoGeral.push("dor controlada");
    } else if (dados.dorControlada === false) {
        estadoGeral.push("com dor de difícil controle");
    }

    const eliminacoes: string[] = [];

    if (dados.diurese === "espontanea") {
        eliminacoes.push("diurese espontânea");
    } else if (dados.diurese === "svd") {
        eliminacoes.push("diurese por SVD");
    } else if (dados.diurese === "anurico") {
        eliminacoes.push("anúrico");
    }

    if (dados.ultimaEvacuacao) {
        eliminacoes.push(
            `última evacuação ${dados.ultimaEvacuacao}`,
        );
    }

    const evolucaoItens = [
        ...estadoGeral,
        ...eliminacoes,
    ];

    if (evolucaoItens.length > 0) {
        const qualidadeEstado =
            dados.estavel === false
                ? "regular"
                : "bom";

        partes.push(
            `Evolução:\nPaciente em ${qualidadeEstado} estado geral, ${evolucaoItens.join(
                ", ",
            )}.`,
        );
    }

    /* ================================================================
     * EXAME FÍSICO + IMOBILIZAÇÃO + CURATIVO + PÓS-OP
     * ================================================================ */

    const exameFisicoItens: string[] = [];
    const alteracoesFisicas: string[] = [];

    // Exame físico
    if (dados.perfusaoPreservada === true) {
        exameFisicoItens.push("perfusão distal");
    } else if (dados.perfusaoPreservada === false) {
        alteracoesFisicas.push(
            "perfusão distal comprometida",
        );
    }

    if (dados.sensibilidadePreservada === true) {
        exameFisicoItens.push("sensibilidade");
    } else if (
        dados.sensibilidadePreservada === false
    ) {
        alteracoesFisicas.push(
            "sensibilidade alterada",
        );
    }

    if (dados.movimentoPreservado === true) {
        exameFisicoItens.push("mobilidade");
    } else if (dados.movimentoPreservado === false) {
        alteracoesFisicas.push(
            "mobilidade comprometida",
        );
    }

    if (exameFisicoItens.length > 0) {
        exameFisicoItens[
            exameFisicoItens.length - 1
        ] = `${exameFisicoItens[
        exameFisicoItens.length - 1
        ]} preservada(s)`;
    }

    // Imobilização
    if (dados.usaGesso === true && dados.qualGesso) {
        exameFisicoItens.push(
            `em uso de ${dados.qualGesso}`,
        );
    } else if (dados.usaGesso === false) {
        exameFisicoItens.push(
            "sem imobilização com gesso",
        );
    }

    // Curativo
    if (dados.possuiCurativo === true) {
        if (
            dados.curativoLimpo === true &&
            !dados.secrecaoInfecciosa &&
            !dados.secrecaoSanguinolenta
        ) {
            exameFisicoItens.push(
                "curativo limpo, sem sinais de infecção",
            );
        } else {
            const problemas: string[] = [];

            if (dados.secrecaoInfecciosa === true) {
                problemas.push("secreção infecciosa");
            }

            if (dados.secrecaoSanguinolenta === true) {
                problemas.push("secreção sanguinolenta");
            }

            if (problemas.length > 0) {
                exameFisicoItens.push(
                    `curativo com ${problemas.join(
                        " e ",
                    )}`,
                );
            } else {
                exameFisicoItens.push(
                    "curativo com alterações",
                );
            }
        }
    } else if (dados.possuiCurativo === false) {
        exameFisicoItens.push("sem curativo");
    }

    // RX pós-operatório
    if (isPosOperatorio) {
        if (dados.rxPosOpRealizado === true) {
            if (dados.rxSatisfatorio === true) {
                const enviado = dados.rxEnviadoCirurgiao
                    ? " e enviado ao cirurgião"
                    : "";

                exameFisicoItens.push(
                    `RX pós-operatório satisfatório${enviado}`,
                );
            } else if (
                dados.rxSatisfatorio === false
            ) {
                exameFisicoItens.push(
                    "RX pós-operatório realizado, com resultado insatisfatório, necessitando reavaliação",
                );
            }
        } else if (
            dados.rxPosOpRealizado === false
        ) {
            exameFisicoItens.push(
                "RX pós-operatório pendente",
            );
        }

        // Neurológico pós-op
        if (
            dados.deficitPrevio === true &&
            dados.deficitNeurol
        ) {
            const mapDeficit: Record<
                string,
                string
            > = {
                melhorou:
                    "déficit neurológico pré-operatório com melhora no pós-operatório",
                igual:
                    "déficit neurológico pré-operatório sem alteração",
                piorou:
                    "piora do déficit neurológico em relação ao pré-operatório, necessitando avaliação",
            };

            const texto =
                mapDeficit[dados.deficitNeurol];

            if (texto) {
                exameFisicoItens.push(texto);
            }
        } else if (
            dados.deficitPrevio === false
        ) {
            const neurol: string[] = [];

            if (dados.movPosOp === true) {
                neurol.push("movimento");
            }

            if (dados.sensPosOp === true) {
                neurol.push("sensibilidade");
            }

            if (neurol.length > 0) {
                exameFisicoItens.push(
                    `${neurol.join(
                        " e ",
                    )} preservados no pós-operatório`,
                );
            }
        }
    }

    if (exameFisicoItens.length > 0) {
        partes.push(
            `Exame físico:\n${capitalize(
                exameFisicoItens.join(", "),
            )}.`,
        );
    }

    if (alteracoesFisicas.length > 0) {
        partes.push(
            `Atenção: ${alteracoesFisicas.join(
                ", ",
            )}.`,
        );
    }

    /* ================================================================
     * OUTRAS LESÕES
     * ================================================================ */

    if (
        dados.outrasLesoes &&
        dados.outrasLesoes.length > 0
    ) {
        const lesoes =
            dados.outrasLesoes.filter(
                (l) => l.osso,
            );

        if (lesoes.length > 0) {
            const desc = lesoes
                .map(
                    (l) =>
                        `${l.osso}${l.lado
                            ? ` (${l.lado})`
                            : ""
                        }`,
                )
                .join(", ");

            partes.push(
                `Dor em ${desc} sem radiografia prévia — solicitadas incidências para avaliação.`,
            );
        }
    }

    /* ================================================================
     * LABORATÓRIOS
     * ================================================================ */

    const labAlterados: string[] = [];

    if (
        dados.hemoglobina != null &&
        dados.hemoglobina < 10
    ) {
        labAlterados.push(
            `hemoglobina ${dados.hemoglobina} g/dL (baixa)`,
        );
    }

    if (
        dados.plaquetas != null &&
        dados.plaquetas < 100
    ) {
        labAlterados.push(
            `plaquetas ${dados.plaquetas} mil/µL (baixas)`,
        );
    }

    if (
        dados.inr != null &&
        dados.inr > 1.5
    ) {
        labAlterados.push(
            `INR ${dados.inr} (elevado)`,
        );
    }

    const labs = [
        dados.hemoglobina != null &&
        `* Hemoglobina: ${dados.hemoglobina} g/dL`,
        dados.plaquetas != null &&
        `* Plaquetas: ${dados.plaquetas}`,
        dados.inr != null &&
        `* INR: ${dados.inr}`,
        dados.leucocitos != null &&
        `* Leucócitos: ${dados.leucocitos}`,
        dados.pcr != null &&
        `* PCR: ${dados.pcr}`,
        dados.vhs != null &&
        `* VHS: ${dados.vhs}`,
        dados.creatinina != null &&
        `* Creatinina: ${dados.creatinina}`,
        dados.ureia != null &&
        `* Ureia: ${dados.ureia}`,
    ].filter(Boolean);

    if (labs.length) {
        partes.push(
            `Laboratórios:\n${labs.join(
                "\n",
            )}`,
        );
    } else if (
        labAlterados.length > 0
    ) {
        partes.push(
            `Laboratório com alterações: ${labAlterados.join(
                ", ",
            )}.`,
        );
    }

    /* ================================================================
     * INFECÇÃO ORTOPÉDICA
     * ================================================================ */

    const infecAlterados: string[] = [];

    if (
        dados.leucocitos != null &&
        dados.leucocitos > 11
    ) {
        infecAlterados.push(
            `leucócitos ${dados.leucocitos} mil/µL`,
        );
    }

    if (
        dados.pcr != null &&
        dados.pcr > 10
    ) {
        infecAlterados.push(
            `PCR ${dados.pcr} mg/L`,
        );
    }

    if (
        dados.vhs != null &&
        dados.vhs > 20
    ) {
        infecAlterados.push(
            `VHS ${dados.vhs} mm/h`,
        );
    }

    if (infecAlterados.length > 0) {
        partes.push(
            `Marcadores infecciosos elevados: ${infecAlterados.join(
                ", ",
            )}.`,
        );
    }

    if (dados.antibioticoAtual) {
        const dia = dados.diaTratamento
            ? ` (${dados.diaTratamento}º dia)`
            : "";

        partes.push(
            `Em uso de ${dados.antibioticoAtual}${dia}.`,
        );
    }

    if (
        dados.infectAvaliado === true &&
        dados.nomeInfectologista
    ) {
        partes.push(
            `Avaliado pela infectologia — Dr(a). ${dados.nomeInfectologista}.`,
        );
    } else if (
        dados.infectAvaliado === false
    ) {
        partes.push(
            "Aguardando avaliação da infectologia.",
        );
    }

    /* ================================================================
     * CARDIOVASCULAR
     * ================================================================ */

    if (
        idadePaciente &&
        idadePaciente >= 55
    ) {
        if (
            dados.cardiologistaLiberou === true
        ) {
            partes.push(
                "Risco cardiovascular concluído, cardiologista liberou para cirurgia.",
            );
        } else if (
            dados.cardioPendente === true
        ) {
            partes.push(
                "Aguardando avaliação de risco cardiovascular.",
            );
        }

        if (dados.necessitaUTI === true) {
            partes.push(
                "Necessita UTI pós-operatória conforme avaliação cardiológica.",
            );
        }
    }

    /* ================================================================
     * CLÍNICA MÉDICA
     * ================================================================ */

    if (dados.acompClinico === true) {
        const nome = dados.nomeClinico
            ? ` com Dr(a). ${dados.nomeClinico}`
            : "";

        partes.push(
            `Mantém seguimento da clínica médica${nome}.`,
        );
    } else if (
        dados.acompClinico === false
    ) {
        partes.push(
            "Sem acompanhamento da clínica médica. Necessário realizar prescrição clínica.",
        );
    }

    /* ================================================================
     * OBSERVAÇÕES
     * ================================================================ */

    if (dados.observacoes) {
        partes.push(
            dados.observacoes,
        );
    }

    /* ================================================================
     * CONCLUSÃO
     * ================================================================ */

    const temAlteracao =
        dados.estavel === false ||
        dados.febre === true ||
        dados.dorControlada === false ||
        alteracoesFisicas.length > 0 ||
        dados.secrecaoInfecciosa === true ||
        labAlterados.length > 0 ||
        infecAlterados.length > 0 ||
        (dados.outrasLesoes &&
            dados.outrasLesoes.filter(
                (l) => l.osso,
            ).length > 0);

    if (!temAlteracao) {
        partes.push(
            "Sem novas intercorrências.",
        );
    }

    /* ================================================================
     * PENDÊNCIAS
     * ================================================================ */

    if (contexto?.pendencias?.length) {
        partes.push(
            `Pendências:\n${contexto.pendencias
                .map(
                    (p) => `* ${p.descricao}`,
                )
                .join("\n")}`,
        );
    }

    /* ================================================================
     * PARECERES
     * ================================================================ */

    if (contexto?.pareceres?.length) {
        partes.push(
            `Pareceres:\n${contexto.pareceres
                .map(
                    (parecer) =>
                        `* ${formatarData(
                            parecer.data,
                        )} — ${parecer.especialidade
                        }${parecer.medico
                            ? ` (${parecer.medico})`
                            : ""
                        }: ${parecer.descricao}`,
                )
                .join("\n")}`,
        );
    }

    return partes
        .filter(Boolean)
        .join("\n\n");
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

    // Outras lesões → RX pendente
    if (dados.outrasLesoes) {
        for (const lesao of dados.outrasLesoes.filter(l => l.osso)) {
            const lado = lesao.lado ? ` ${lesao.lado}` : ''
            const inc = lesao.incidencias ? ` (${lesao.incidencias})` : ''
            pendencias.push({
                descricao: `Solicitar RX — ${lesao.osso}${lado}${inc}`,
                tipo: 'OUTRA_LESAO' as TipoPendencia,
            })
        }
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

    // Infectologia
    if (dados.infectAvaliado === false) {
        pendencias.push({ descricao: 'Solicitar avaliação da infectologia', tipo: 'INFECTOLOGIA' as TipoPendencia })
    }
    if (dados.culturasSolicitadas === true && dados.culturasResultado === false) {
        pendencias.push({ descricao: 'Aguardando resultado das culturas', tipo: 'INFECTOLOGIA' as TipoPendencia })
    }

    // Clínica médica
    if (dados.acompClinico === false) {
        pendencias.push({ descricao: 'Realizar prescrição clínica', tipo: 'CLINICA' as TipoPendencia })
    }

    // Infecção no curativo
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
        case 'RX':
        case 'OUTRA_LESAO': return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'RISCO_CIRURGICO': return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'INFECTOLOGIA': return 'bg-red-100 text-red-800 border-red-200'
        case 'EXAME': return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'CLINICA': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}


