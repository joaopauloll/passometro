export type MedicamentoSuspensao = {
    codigo: string
    nome: string
    diasSuspensao: number
    obs: string
}

export const MEDICAMENTOS_SUSPENSO: MedicamentoSuspensao[] = [
    { codigo: 'AAS', nome: 'Ácido Acetilsalicílico (AAS/Aspirina)', diasSuspensao: 10, obs: '7-10 dias antes' },
    { codigo: 'CLOPIDOGREL', nome: 'Clopidogrel (Plavix)', diasSuspensao: 7, obs: '5-7 dias antes' },
    { codigo: 'VARFARINA', nome: 'Varfarina (Marevan)', diasSuspensao: 5, obs: '5 dias antes + controle INR' },
    { codigo: 'RIVAROXABANA', nome: 'Rivaroxabana (Xarelto)', diasSuspensao: 3, obs: '2-3 dias antes' },
    { codigo: 'APIXABANA', nome: 'Apixabana (Eliquis)', diasSuspensao: 3, obs: '2-3 dias antes' },
    { codigo: 'DABIGATRANA', nome: 'Dabigatrana (Pradaxa)', diasSuspensao: 3, obs: '2-3 dias antes' },
    { codigo: 'ENOXAPARINA', nome: 'Enoxaparina (Clexane) dose profilática', diasSuspensao: 1, obs: '12-24h antes' },
    { codigo: 'ADALIMUMABE', nome: 'Adalimumabe (Humira)', diasSuspensao: 14, obs: '2 semanas antes' },
    { codigo: 'ETANERCEPTE', nome: 'Etanercepte (Enbrel)', diasSuspensao: 14, obs: '1-2 semanas antes' },
    { codigo: 'INFLIXIMABE', nome: 'Infliximabe (Remicade)', diasSuspensao: 42, obs: '4-6 semanas antes' },
    { codigo: 'SEMAGLUTIDA', nome: 'Semaglutida semanal (Ozempic/Wegovy)', diasSuspensao: 21, obs: '21 dias antes (risco broncoaspiração)' },
    { codigo: 'LIRAGLUTIDA', nome: 'Liraglutida diária (Saxenda/Victoza)', diasSuspensao: 2, obs: '2 dias antes' },
    { codigo: 'ISGLT2', nome: 'Empagliflozina/Dapagliflozina (Jardiance/Forxiga)', diasSuspensao: 4, obs: '3-4 dias antes (cetoacidose)' },
    { codigo: 'METFORMINA', nome: 'Metformina (Glifage)', diasSuspensao: 2, obs: '24-48h antes' },
    { codigo: 'INSULINA', nome: 'Insulina (todas as formulações)', diasSuspensao: 0, obs: 'Ajustar/suspender no dia da cirurgia — ver protocolo' },
    { codigo: 'SINVASTATINA', nome: 'Sinvastatina (Zocor)', diasSuspensao: 0, obs: 'Suspender na internação' },
]

// Medicamentos que conflitam com prescrição de alta
export const MEDICAMENTOS_PRESCRICAO = ['Dipirona', 'Paracetamol', 'Tramadol', 'Rivaroxabana', 'Cefadroxila']

export function verificarAlergiaPrescricao(alergias: string): string[] {
    if (!alergias) return []
    const alergiasLower = alergias.toLowerCase()
    return MEDICAMENTOS_PRESCRICAO.filter(m => alergiasLower.includes(m.toLowerCase()))
}

// Níveis PPS (Palliative Performance Scale)
export const PPS_NIVEIS = [
    { valor: 100, desc: '100% — Ambulante, atividade normal, sem evidência de doença' },
    { valor: 90, desc: '90% — Ambulante, atividade normal, alguma evidência de doença' },
    { valor: 80, desc: '80% — Ambulante, atividade normal com esforço, alguma evidência de doença' },
    { valor: 70, desc: '70% — Ambulante reduzido, incapaz de trabalho normal' },
    { valor: 60, desc: '60% — Ambulante reduzido, incapaz de passatempo/trabalho doméstico, cuidado pessoal independente' },
    { valor: 50, desc: '50% — Principalmente sentado/deitado, incapaz de qualquer trabalho, cuidado pessoal extenso' },
    { valor: 40, desc: '40% — Principalmente acamado, incapaz da maioria das atividades, cuidado pessoal total' },
    { valor: 30, desc: '30% — Totalmente acamado, incapaz de qualquer atividade, cuidado pessoal total' },
    { valor: 20, desc: '20% — Totalmente acamado, incapaz, ingestão mínima' },
    { valor: 10, desc: '10% — Agônico, sem ingestão oral' },
    { valor: 0, desc: '0% — Óbito' },
]

// Medicamentos comuns de uso contínuo (sem necessidade de suspensão)
export const MEDICAMENTOS_COMUNS = [
    'Losartana',
    'Hidroclorotiazida',
    'Anlodipino',
    'Levotiroxina',
    'Omeprazol',
    'Atenolol',
    'Enalapril',
    'Captopril',
    'Sinvastatina',
    'Atorvastatina',
    'Bisoprolol',
    'Furosemida',
    'Espironolactona',
    'Digoxina',
    'Amiodarona',
]

