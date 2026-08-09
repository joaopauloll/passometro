import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const modelos = await prisma.modeloAlta.findMany({
            orderBy: [{ especialidade: 'asc' }, { cirurgiao: 'asc' }],
        });
        return NextResponse.json(modelos);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar modelos' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const data = {
            especialidade: body.especialidade,
            cirurgiao: body.cirurgiao,
            nomeCirurgia: body.nomeCirurgia,
            recomendacoesJson: JSON.stringify(body.recomendacoes || {}),
            comoTrocarCurativo: body.comoTrocarCurativo,
            sinaisAlarme: body.sinaisAlarme,
            retornoDias: body.retornoDias ? parseInt(body.retornoDias) : 30,
            retornoTelefone: body.retornoTelefone,
            retornoEndereco: body.retornoEndereco,
            retornoCep: body.retornoCep,
            prescricaoMedicamentos: JSON.stringify(body.medicamentosSelecionados || []),
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
