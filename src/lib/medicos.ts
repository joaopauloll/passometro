// Catálogo completo de médicos com CRM e especialidade

export type Medico = {
    nome: string
    nome_completo: string
    crm: string
    especialidade: string
    teot: string | null
}

export const MEDICOS: Medico[] = [
    {
        nome: 'Hermann Gomes',
        nome_completo: 'Dr. Hermann Gomes',
        crm: '4843',
        especialidade: 'Ortopedia e Traumatologia | Cirurgia do Quadril',
        teot: null,
    },
    {
        nome: 'Fernando Claudino',
        nome_completo: 'Dr. Fernando Claudino',
        crm: '7076',
        especialidade: 'Ortopedia e Traumatologia | Cirurgia do Quadril',
        teot: null,
    },
    {
        nome: 'Thales Assunção',
        nome_completo: 'Dr. Thales Assunção',
        crm: '9356',
        especialidade: 'Ortopedia e Traumatologia | Cirurgia do Joelho',
        teot: null,
    },
    {
        nome: 'Marcos Rêgo',
        nome_completo: 'Dr. Marcos Rêgo',
        crm: '5621',
        especialidade: 'Ortopedia e Traumatologia | Cirurgia do Ombro',
        teot: null,
    },
    {
        nome: 'Felipe Jader',
        nome_completo: 'Dr. Felipe Jader Coelho Pereira',
        crm: '10458',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia do Joelho | Ultrassonografia musculoesquelética | Medicina da Dor',
        teot: '18009',
    },
    {
        nome: 'Filippi Ranieri',
        nome_completo: 'Dr. Filippi Ranieri',
        crm: '6963',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia do Pé e Tornozelo',
        teot: null,
    },
    {
        nome: 'Raniere Nicacio',
        nome_completo: 'Dr. Raniere Nicácio',
        crm: '7517',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia do Joelho',
        teot: null,
    },
    {
        nome: 'Guilherme Maia',
        nome_completo: 'Dr. Guilherme Maia',
        crm: '8036',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia do Pé e Tornozelo | Ortopedia Pediátrica',
        teot: null,
    },
    {
        nome: 'Helio Rubens',
        nome_completo: 'Dr. Hélio Rubens',
        crm: '5500',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia da Mão e Microcirurgia',
        teot: null,
    },
    {
        nome: 'Wilson Alves',
        nome_completo: 'Dr. Wilson Alves',
        crm: '7970',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia da Mão',
        teot: null,
    },
    {
        nome: 'Thiago Araruna',
        nome_completo: 'Dr. Thiago Araruna',
        crm: '6619',
        especialidade:
            'Ortopedia e Traumatologia | Trauma',
        teot: null,
    },
    {
        nome: 'Djalma Carlos',
        nome_completo: 'Dr. Djalma Carlos',
        crm: '2795',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia do Quadril',
        teot: null,
    },
    {
        nome: 'Fábio Fagundes',
        nome_completo: 'Dr. Fábio Fagundes',
        crm: '8416',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia da Coluna',
        teot: null,
    },
    {
        nome: 'Marcelo Cabral Fagundes Rêgo',
        nome_completo: 'Dr. Marcelo Cabral Fagundes Rêgo',
        crm: '4884',
        especialidade: 'Ortopedia e Traumatologia',
        teot: null,
    },
    {
        nome: 'Marcio Cabral Fagundes Rêgo',
        nome_completo: 'Dr. Márcio Cabral Fagundes Rêgo',
        crm: '6574',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia do Joelho | Membro SBRATE | Membro SBCJ',
        teot: '12506',
    },
    {
        nome: 'Bruno Medeiros',
        nome_completo: 'Dr. Bruno Medeiros',
        crm: '—',
        especialidade:
            'Ortopedia e Traumatologia | Cirurgia do Ombro',
        teot: null,
    },
]

export function medicoByNome(nome: string | null | undefined): Medico | null {
    if (!nome) return null

    // Correspondência exata primeiro
    const exact = MEDICOS.find(
        (m) =>
            m.nome === nome ||
            m.nome_completo === nome
    )

    if (exact) return exact

    // Correspondência parcial
    const lower = nome.toLowerCase()

    return (
        MEDICOS.find(
            (m) =>
                m.nome.toLowerCase().includes(lower) ||
                lower.includes(m.nome.toLowerCase()) ||
                m.nome_completo.toLowerCase().includes(lower)
        ) ?? null
    )
}

export function assinaturaDocumento(
    nomeCirurgiao: string | null | undefined
): Medico {
    const med = medicoByNome(nomeCirurgiao)

    if (!med) {
        return {
            nome_completo: nomeCirurgiao || 'Médico responsável',
            especialidade: 'Ortopedia e Traumatologia',
            crm: '—',
            teot: null,
            nome: nomeCirurgiao || 'Médico responsável',
        }
    }

    return med
}