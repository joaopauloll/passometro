// ==========================================
// TIPAGENS / INTERFACES
// ==========================================

export interface OpcaoSelect {
    value: string;
    label: string;
}

export interface HospitalExame {
    id: string;
    nome: string;
    url: string;
    login?: string;
    senha?: string;
}

export interface EstadoCirurgia {
    estado: "sem_data" | "pre_op" | "poi" | "dpo" | "po_tardio";
    dpo: number | null;
    label: string;
}

// ==========================================
// CONSTANTES DE DADOS
// ==========================================

export const CLINICOS: string[] = [
    "Marcus Ferreira",
    "Tais Moura",
    "Tatiana Gonçalves",
    "Heloisa Abdon",
    "Ana Clara Noronha",
];

export const PARECER_ESPECIALIDADES: OpcaoSelect[] = [
    { value: "cardiologia", label: "Cardiologia" },
    { value: "infectologia", label: "Infectologia" },
    { value: "hematologia", label: "Hematologia" },
    { value: "urologia", label: "Urologia" },
    { value: "ortopedia", label: "Ortopedia" },
    { value: "nefrologia", label: "Nefrologia" },
];

export const ORTOPEDIA_SUBESPECIALIDADES: string[] = [
    "Mão",
    "Trauma",
    "Quadril",
    "Ombro",
    "Joelho",
    "Coluna",
    "Pé e Tornozelo",
];

export const HOSPITAIS_EXAMES: HospitalExame[] = [
    {
        id: "memorial",
        nome: "Hospital Memorial",
        url: "https://www.wbsrad.com.br/site/",
        login: "HOSPITALMEMORIAL@EXAME.COM.BR",
        senha: "123456",
    },
    {
        id: "walfredo_gurgel",
        nome: "Hospital Monsenhor Walfredo Gurgel",
        url: "https://app.epacs.com.br/router/login/",
        login: "MEDICOCMT1@GMAIL.COM",
        senha: "medico",
    },
];

export const TIPOS_EXAME: OpcaoSelect[] = [
    { value: "radiografia", label: "Radiografia" },
    { value: "ecg", label: "Eletrocardiograma (ECG)" },
    { value: "ecocardiograma", label: "Ecocardiograma" },
    { value: "tomografia", label: "Tomografia" },
    { value: "ressonancia", label: "Ressonância magnética" },
    { value: "ultrassonografia", label: "Ultrassonografia" },
    { value: "outro", label: "Outro" },
];

export const EXAMES_ALTA_COMPLEXIDADE: string[] = [
    "ecg",
    "ecocardiograma",
    "tomografia",
    "ressonancia",
    "ultrassonografia",
    "outro",
];

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================

/**
 * Formata uma string de data (ex: YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDate(d?: string | null): string {
    if (!d) return "-";

    // Datas clínicas são dias-calendário. Ao receber ISO em UTC do Prisma,
    // preservamos a parte YYYY-MM-DD para não deslocar o dia pelo fuso local.
    const calendarDate = /^\d{4}-\d{2}-\d{2}/.exec(d)?.[0];
    const date = new Date(`${calendarDate ?? d}T00:00:00`);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("pt-BR");
}

/**
 * Retorna a diferença de dias inteiros entre duas datas formato string (YYYY-MM-DD)
 */
export function calcularDiasEntre(dataInicio?: string | null, dataFim?: string | null): number | null {
    if (!dataInicio || !dataFim) return null;

    const inicio = new Date(`${dataInicio}T00:00:00`).getTime();
    const fim = new Date(`${dataFim}T00:00:00`).getTime();
    const diffTime = fim - inicio;

    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna a label do DPO ou null se a cirurgia for no futuro ou não tiver data
 */
export function calcularDPO(dataCirurgia?: string | null): string | null {
    const estado = calcularEstadoCirurgia(dataCirurgia);
    if (estado.estado === "sem_data" || estado.estado === "pre_op") return null;

    return estado.label;
}

/**
 * Retorna o estado de uma cirurgia com base na data:
 * - pré-op (data futura), POI (dia da cirurgia), DPO (1° a 30°), PO tardio (>30 DPO)
 */
export function calcularEstadoCirurgia(dataCirurgia?: string | null): EstadoCirurgia {
    if (!dataCirurgia) return { estado: "sem_data", dpo: null, label: "Sem data" };

    const hoje = new Date().toISOString().slice(0, 10);
    const dias = calcularDiasEntre(dataCirurgia, hoje);

    if (dias === null) return { estado: "sem_data", dpo: null, label: "Sem data" };
    if (dias < 0) return { estado: "pre_op", dpo: null, label: "Pré-operatório" };
    if (dias === 0) return { estado: "poi", dpo: 0, label: "POI" };
    if (dias > 30) return { estado: "po_tardio", dpo: dias, label: `${dias}° DPO (PO tardio)` };

    return { estado: "dpo", dpo: dias, label: `${dias}° DPO` };
}

/**
 * Retorna uma string com o dia de internação hospitalar (DIH).
 * 1° DIH = dia seguinte ao da internação (mesmo padrão do DPO)
 */
export function formatarDIH(dataInternacao?: string | null): string | null {
    const dias = calcularDiasInternacao(dataInternacao);
    if (dias === null) return null;
    if (dias === 0) return "Dia da internação";

    return `${dias}° DIH`;
}

/**
 * Retorna o número de dias de internação. Retorna null se data inválida ou no futuro.
 */
export function calcularDiasInternacao(dataInternacao?: string | null): number | null {
    if (!dataInternacao) return null;

    const hoje = new Date().toISOString().slice(0, 10);
    const dias = calcularDiasEntre(dataInternacao, hoje);

    if (dias === null || dias < 0) return null;
    return dias;
}

/**
 * Retorna o número de dias de trauma (diferença entre data do trauma e hoje).
 */
export function calcularTempoTrauma(dataTrauma?: string | null): number | null {
    if (!dataTrauma) return null;

    const hoje = new Date().toISOString().slice(0, 10);
    return calcularDiasEntre(dataTrauma, hoje);
}

/**
 * Retorna uma string humanizada do tempo de trauma (ex: "há 1 mês e 5 dias")
 */
export function formatarTempoTrauma(dataTrauma?: string | null): string | null {
    const dias = calcularTempoTrauma(dataTrauma);

    if (dias === null) return null;
    if (dias === 0) return "hoje";
    if (dias === 1) return "há 1 dia";
    if (dias < 30) return `há ${dias} dias`;

    const meses = Math.floor(dias / 30);
    const resto = dias % 30;

    const labelMes = meses === 1 ? "mês" : "meses";
    const labelDia = resto === 1 ? "dia" : "dias";

    if (resto === 0) return `há ${meses} ${labelMes}`;

    return `há ${meses} ${labelMes} e ${resto} ${labelDia}`;
}

/**
 * Encontra a label de exibição para o tipo do exame selecionado.
 */
export function labelTipoExame(valor?: string | null): string {
    if (!valor) return "Exame";

    const tipoEncontrado = TIPOS_EXAME.find((x) => x.value === valor);
    return tipoEncontrado ? tipoEncontrado.label : valor;
}