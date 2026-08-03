// Tipos de status do paciente
export type PacienteStatus = 'INTERNADO' | 'ALTA_ORTOPEDIA' | 'ALTA_HOSPITALAR'
export type TipoStatus = 'PRE_OPERATORIO' | 'POS_OPERATORIO'

// Tipos de pendência
export type TipoPendencia =
    | 'RX'
    | 'RISCO_CIRURGICO'
    | 'INFECTOLOGIA'
    | 'ALTA'
    | 'EXAME'
    | 'CLINICA'
    | 'OUTRO'

// Dados do formulário de evolução
export interface EvolucaoFormData {
    // Estado geral
    estavel?: boolean
    febre?: boolean
    semDor?: boolean
    dorControlada?: boolean

    // Eliminações
    diurese?: 'espontanea' | 'svd' | 'anurico'
    ultimaEvacuacao?: string

    // Exame físico
    perfusaoPreservada?: boolean
    sensibilidadePreservada?: boolean
    movimentoPreservado?: boolean

    // Imobilização
    usaGesso?: boolean
    qualGesso?: string

    // Curativo
    possuiCurativo?: boolean
    curativoLimpo?: boolean
    secrecaoInfecciosa?: boolean
    secrecaoSanguinolenta?: boolean

    // Pós-operatório
    rxPosOpRealizado?: boolean
    rxSatisfatorio?: boolean
    rxEnviadoCirurgiao?: boolean

    // Neurológico pós-op
    movPosOp?: boolean
    sensPosOp?: boolean
    deficitNeurol?: 'melhorou' | 'igual' | 'piorou'

    // Cardiovascular
    cardioPendente?: boolean
    cardiologistaLiberou?: boolean
    solicitouEco?: boolean
    ecoReady?: boolean
    riscoConcluido?: boolean
    necessitaUTI?: boolean

    // Laboratórios
    hemoglobina?: number | null
    plaquetas?: number | null
    inr?: number | null

    // Clínica médica
    acompClinico?: boolean
    nomeClinico?: string

    // Alta
    altaPrevista?: boolean
    altaHoje?: boolean
    chkReceita?: boolean
    chkRelatorio?: boolean
    chkOrientacoes?: boolean
    chkAtestado?: boolean
    chkRetorno?: boolean
    chkRX?: boolean

    // Observações
    observacoes?: string
}

export interface PendenciaParaGerar {
    descricao: string
    tipo: TipoPendencia
}
