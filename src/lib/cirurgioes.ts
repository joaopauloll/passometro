export const ESPECIALIDADES: Record<string, string[]> = {
    'Quadril': ['Hermann Gomes', 'Djalma Carlos', 'Fernando Claudino'],
    'Joelho': ['Thales Assunção', 'Felipe Jader', 'Márcio Rêgo', 'Marcelo Rêgo', 'Raniere Nicácio'],
    'Mão e Micro': ['Hélio Rubens', 'Wilson Alves'],
    'Ombro': ['Marcos Rêgo', 'Bruno Medeiros', 'Armando'],
    'Pé e Tornozelo': ['Filippi Ranieri', 'Guilherme Maia'],
    'Infantil': ['Guilherme Maia', 'Tábata Alcântara'],
    'Oncológica': ['Heitor Maia'],
    'Coluna': ['Fábio Fagundes'],
    'Trauma': ['Thiago Araruna'],
}

// Preencher com números reais (formato: 5511999999999)
export const WHATSAPP_CIRURGIOES: Record<string, string> = {
    'Hermann Gomes': '',
    'Djalma Carlos': '',
    'Fernando Claudino': '',
    'Thales Assunção': '',
    'Felipe Jader': '',
    'Márcio Rêgo': '',
    'Marcelo Rêgo': '',
    'Raniere Nicácio': '',
    'Hélio Rubens': '',
    'Wilson Alves': '',
    'Marcos Rêgo': '',
    'Bruno Medeiros': '',
    'Armando': '',
    'Filippi Ranieri': '',
    'Guilherme Maia': '',
    'Tábata Alcântara': '',
    'Heitor Maia': '',
    'Fábio Fagundes': '',
    'Thiago Araruna': '',
}

export const TODOS_CIRURGIOES = Object.values(ESPECIALIDADES).flat()

export function getEspecialidadePorCirurgiao(nome: string): string {
    const nomeNorm = nome.toLowerCase()
    for (const [esp, lista] of Object.entries(ESPECIALIDADES)) {
        if (lista.some(c => c.toLowerCase().includes(nomeNorm) || nomeNorm.includes(c.toLowerCase()))) {
            return esp
        }
    }
    return 'Sem Especialidade'
}
