import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import EvolucaoForm from "@/components/evolucao/EvolucaoForm";
import type { EvolucaoFormData } from "@/types";

type Params = { params: Promise<{ id: string; evolucaoId: string }> };

export default async function EditarEvolucaoPage({ params }: Params) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { id, evolucaoId } = await params;

  const [paciente, evolucao] = await Promise.all([
    prisma.paciente.findUnique({
      where: { id },
      select: { id: true, nome: true, tipoStatus: true, dataNascimento: true },
    }),
    prisma.evolucao.findUnique({ where: { id: evolucaoId } }),
  ]);

  if (!paciente || !evolucao) notFound();

  let outrasLesoes: EvolucaoFormData["outrasLesoes"] = [];
  let imobilizacaoTipos: EvolucaoFormData["imobilizacaoTipos"] = [];
  try {
    outrasLesoes = evolucao.outrasLesoes
      ? JSON.parse(evolucao.outrasLesoes)
      : [];
    imobilizacaoTipos = evolucao.imobilizacaoTipos
      ? JSON.parse(evolucao.imobilizacaoTipos)
      : [];
  } catch {
    outrasLesoes = [];
    imobilizacaoTipos = [];
  }

  const isPosOperatorio = paciente.tipoStatus === "POS_OPERATORIO";

  let idadePaciente: number | null = null;
  if (paciente.dataNascimento) {
    const hoje = new Date();
    const nasc = new Date(paciente.dataNascimento);
    idadePaciente = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idadePaciente--;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/pacientes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          ← {paciente.nome}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Editar Evolução
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {paciente.nome} · Evolução de{" "}
          {evolucao.data.toLocaleDateString("pt-BR")}
        </p>
      </div>

      <EvolucaoForm
        pacienteId={id}
        evolucaoId={evolucaoId}
        initialData={{
          ...evolucao,
          outrasLesoes,
          imobilizacaoTipos,
          imobilizacaoLateralidade:
            evolucao.imobilizacaoLateralidade ?? undefined,
          curativoLateralidade: evolucao.curativoLateralidade ?? undefined,
        }}
        isPosOperatorio={isPosOperatorio}
        idadePaciente={idadePaciente}
        nomePaciente={paciente.nome}
      />
    </div>
  );
}
