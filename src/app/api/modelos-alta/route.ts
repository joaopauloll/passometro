import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

function texto(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null
}

function inteiro(value: unknown, fallback: number): number {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export async function GET(request: NextRequest) {
    const session = await getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    try {
        const modelos = await prisma.modeloAlta.findMany({
            orderBy: [{ especialidade: 'asc' }, { cirurgiao: 'asc' }],
        });
        return NextResponse.json(modelos);
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar modelos' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    try {
        const body = await request.json();

        const especialidade = texto(body.especialidade)
        const cirurgiao = texto(body.cirurgiao)
        const nomeCirurgia = texto(body.nomeCirurgia)
        if (!especialidade || !cirurgiao || !nomeCirurgia) {
            return NextResponse.json({ error: 'Especialidade, cirurgião e cirurgia são obrigatórios' }, { status: 400 })
        }

        const data = {
            especialidade,
            cirurgiao,
            nomeCirurgia,
            recomendacoesJson: JSON.stringify(body.recomendacoes ?? parseJson(body.recomendacoesJson, {})),
            comoTrocarCurativo: body.comoTrocarCurativo,
            sinaisAlarme: body.sinaisAlarme,
            retornoDias: inteiro(body.retornoDias, 30),
            retornoTelefone: texto(body.retornoTelefone),
            retornoEndereco: texto(body.retornoEndereco),
            retornoCep: texto(body.retornoCep),
            prescricaoMedicamentos: JSON.stringify(body.medicamentosSelecionados ?? parseJson(body.prescricaoMedicamentos, [])),
            prescricaoTexto: body.prescricaoTexto,
            orteseTipo: body.orteseTipo,
            orteseInstrucoes: body.orteseInstrucoes,
            laudoTexto: body.laudoTexto,
            atestadoTexto: body.atestadoTexto,
        };

        const modelo = await prisma.modeloAlta.create({ data });
        return NextResponse.json(modelo);
    } catch (error) {
        console.error('Erro ao salvar modelo:', error);
        return NextResponse.json({ error: 'Erro ao criar modelo' }, { status: 500 });
    }
}

function parseJson(value: unknown, fallback: unknown) {
    if (typeof value !== 'string') return value ?? fallback
    try { return JSON.parse(value) } catch { return fallback }
}
