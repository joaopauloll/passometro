import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

// PUT: Atualiza um modelo existente
export async function PUT(
    request: NextRequest,
    // No Next.js 15, params é uma Promise, então tipamos assim para não dar erro
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    try {
        // AWAIT no params! Isso resolve o `id: undefined`
        const resolvedParams = await context.params;
        const idParam = resolvedParams.id;

        const body = await request.json();

        // Garantia dupla: Tiramos o ID do body para o Prisma não reclamar
        const modeloId = idParam
        const dataToUpdate = {
            especialidade: body.especialidade,
            cirurgiao: body.cirurgiao,
            nomeCirurgia: body.nomeCirurgia,
            recomendacoesJson: JSON.stringify(body.recomendacoes ?? parseJson(body.recomendacoesJson, {})),
            comoTrocarCurativo: body.comoTrocarCurativo ?? null,
            sinaisAlarme: body.sinaisAlarme ?? null,
            retornoDias: Number.isInteger(Number(body.retornoDias)) ? Number(body.retornoDias) : 30,
            retornoTelefone: body.retornoTelefone ?? null,
            retornoEndereco: body.retornoEndereco ?? null,
            retornoCep: body.retornoCep ?? null,
            prescricaoMedicamentos: JSON.stringify(body.medicamentosSelecionados ?? parseJson(body.prescricaoMedicamentos, [])),
            prescricaoTexto: body.prescricaoTexto ?? null,
            orteseTipo: body.orteseTipo ?? null,
            orteseInstrucoes: body.orteseInstrucoes ?? null,
            laudoTexto: body.laudoTexto ?? null,
            atestadoTexto: body.atestadoTexto ?? null,
        };

        const modeloAtualizado = await prisma.modeloAlta.update({
            where: { id: modeloId },
            data: dataToUpdate,
        });

        return NextResponse.json(modeloAtualizado);
    } catch (error: unknown) {
        console.error("Erro no PUT /api/modelos-alta/[id]:", error);
        const message = error instanceof Error ? error.message : "Erro ao atualizar"
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE: Remove um modelo
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    try {
        const resolvedParams = await context.params;
        const idParam = resolvedParams.id;

        await prisma.modeloAlta.delete({
            where: { id: idParam },
        });

        return NextResponse.json({ message: "Deletado com sucesso" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro ao deletar"
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function parseJson(value: unknown, fallback: unknown) {
    if (typeof value !== "string") return value ?? fallback
    try { return JSON.parse(value) } catch { return fallback }
}