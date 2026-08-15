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
    | 'OUTRA_LESAO'
    | 'OUTRO'

export interface OutraLesao {
    osso: string
    lado: string
    incidencias: string
}

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
    imobilizacaoTipos?: string[]
    imobilizacaoLateralidade?: 'direita' | 'esquerda' | 'bilateral'

    // Curativo
    possuiCurativo?: boolean
    curativoLimpo?: boolean
    secrecaoInfecciosa?: boolean
    secrecaoSanguinolenta?: boolean
    curativoLocal?: string
    curativoLateralidade?: 'direita' | 'esquerda' | 'bilateral'

    // Pós-operatório
    rxPosOpRealizado?: boolean
    rxSatisfatorio?: boolean
    rxEnviadoCirurgiao?: boolean

    // Neurológico pós-op
    deficitPrevio?: boolean
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

    // Laboratórios básicos
    hemoglobina?: number | null
    plaquetas?: number | null
    inr?: number | null

    // Infecção ortopédica
    leucocitos?: number | null
    pcr?: number | null
    vhs?: number | null
    creatinina?: number | null
    ureia?: number | null
    culturasSolicitadas?: boolean
    culturasResultado?: boolean
    infectAvaliado?: boolean
    nomeInfectologista?: string
    antibioticoAtual?: string
    diaTratamento?: number | null
    antibioticosPrevios?: string
    lavCirurgicaRealizada?: boolean
    qtdLavagens?: number | null
    retirouImplante?: boolean

    // Outras lesões
    outrasLesoes?: OutraLesao[]

    // Clínica médica
    acompClinico?: boolean
    nomeClinico?: string

    // Alta
    altaPrevista?: boolean
    altaPrevistaData?: string
    altaHoje?: boolean
    chkReceita?: boolean
    chkRelatorio?: boolean
    chkOrientacoes?: boolean
    chkAtestado?: boolean
    chkRetorno?: boolean
    chkRX?: boolean

    // Reabilitação pós-op
    sentou?: boolean
    iniciouFisioterapia?: boolean
    dreno?: boolean
    drenoCm3?: number | null
    drenoAspecto?: string

    // Observações
    observacoes?: string
    dataExame?: string
    pendenciasSelecionadas?: PendenciaParaGerar[]
    somenteLaboratorio?: boolean
}

export interface PendenciaParaGerar {
    descricao: string
    tipo: TipoPendencia
}
