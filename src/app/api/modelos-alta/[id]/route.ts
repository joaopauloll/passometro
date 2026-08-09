import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT: Atualiza um modelo existente
export async function PUT(
    request: Request,
    // No Next.js 15, params é uma Promise, então tipamos assim para não dar erro
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // AWAIT no params! Isso resolve o `id: undefined`
        const resolvedParams = await context.params;
        const idParam = resolvedParams.id;

        const body = await request.json();

        // Garantia dupla: Tiramos o ID do body para o Prisma não reclamar
        const { id, ...dataToUpdate } = body;

        const formatedId = isNaN(Number(idParam)) ? idParam : Number(idParam);

        const modeloAtualizado = await prisma.modeloAlta.update({
            where: { id: formatedId as any },
            data: dataToUpdate,
        });

        return NextResponse.json(modeloAtualizado);
    } catch (error: any) {
        console.error("Erro no PUT /api/modelos-alta/[id]:", error);
        return NextResponse.json({ error: error.message || "Erro ao atualizar" }, { status: 500 });
    }
}

// DELETE: Remove um modelo
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await context.params;
        const idParam = resolvedParams.id;

        const formatedId = isNaN(Number(idParam)) ? idParam : Number(idParam);

        await prisma.modeloAlta.delete({
            where: { id: formatedId as any },
        });

        return NextResponse.json({ message: "Deletado com sucesso" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Erro ao deletar" }, { status: 500 });
    }
}