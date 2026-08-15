import { formatDate } from "@/lib/examesConstants";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import RelatorioCopiarButton from "@/components/relatorio/RelatorioCopiarButton";
import DownloadPDFButton from "@/components/shared/DownloadPDFButton";

type Params = { params: Promise<{ id: string }> };

export default async function RelatorioAltaPage({ params }: Params) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { id } = await params;

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      cirurgias: { orderBy: { dataCirurgia: "asc" } },
      evolucoes: { orderBy: { data: "desc" } },
      fotos: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!paciente) notFound();

  const cirurgioes: string[] = (() => {
    try {
      return JSON.parse(paciente.cirurgioes);
    } catch {
      return [];
    }
  })();

  const ultimaEvolucao = paciente.evolucoes[0];
  const dataNascimento = paciente.dataNascimento;

  let idadeStr = "";
  if (dataNascimento) {
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    idadeStr = `${idade} anos`;
  }

  // Gera o relatório
  const linhas: string[] = [];

  linhas.push("RELATÓRIO MÉDICO DE ALTA HOSPITALAR");
  linhas.push("");
  linhas.push(`Data: ${format(new Date(), "dd/MM/yyyy")}`);
  linhas.push("");
  linhas.push("IDENTIFICAÇÃO");
  linhas.push(`Nome: ${paciente.nome}`);
  if (idadeStr) linhas.push(`Idade: ${idadeStr}`);
  linhas.push(`Registro hospitalar: ${paciente.registroHospitalar}`);
  linhas.push(
    `Data de internação: ${format(new Date(paciente.dataInternacao), "dd/MM/yyyy")}`,
  );
  linhas.push("");
  linhas.push("DIAGNÓSTICO");
  linhas.push(
    paciente.diagnostico + (paciente.cid ? ` (${paciente.cid})` : ""),
  );
  linhas.push("");

  if (paciente.comorbidades) {
    linhas.push("ANTECEDENTES / COMORBIDADES");
    linhas.push(paciente.comorbidades);
    linhas.push("");
  }

  if (paciente.alergias) {
    linhas.push("ALERGIAS");
    linhas.push(paciente.alergias);
    linhas.push("");
  }

  if (paciente.cirurgias.length > 0) {
    linhas.push("CIRURGIAS REALIZADAS");
    for (const c of paciente.cirurgias) {
      linhas.push(
        `• ${c.nomeCirurgia} — ${formatDate(c.dataCirurgia.toISOString())} — Dr(a). ${c.cirurgiao}${c.hospitalExterno ? ` (${c.hospitalExterno})` : ""}`,
      );
    }
    linhas.push("");
  }

  if (paciente.evolucoes.length > 0) {
    linhas.push("EVOLUÇÃO DO INTERNAMENTO");
    const totalDias = Math.round(
      (new Date().getTime() - new Date(paciente.dataInternacao).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    linhas.push(
      `Paciente internado há ${totalDias} dias, evoluindo para alta hospitalar.`,
    );
    if (ultimaEvolucao?.textoGerado) {
      linhas.push("Última evolução:");
      linhas.push(ultimaEvolucao.textoGerado);
    }
    linhas.push("");
  }

  linhas.push("CONDIÇÃO NA ALTA");
  if (ultimaEvolucao) {
    const condicoes: string[] = [];
    if (ultimaEvolucao.estavel === true)
      condicoes.push("estável hemodinamicamente");
    if (ultimaEvolucao.semDor === true || ultimaEvolucao.dorControlada === true)
      condicoes.push("dor controlada");
    if (ultimaEvolucao.febre === false) condicoes.push("afebril");
    if (condicoes.length > 0) {
      linhas.push(
        `Paciente recebeu alta em bom estado geral, ${condicoes.join(", ")}.`,
      );
    } else {
      linhas.push("Paciente em condições de receber alta hospitalar.");
    }
  }
  linhas.push("");

  if (paciente.medicacoes) {
    linhas.push("MEDICAÇÕES DE USO CONTÍNUO");
    linhas.push(paciente.medicacoes);
    linhas.push("");
  }

  linhas.push("RECOMENDAÇÕES DE ALTA");
  linhas.push("• Seguimento ambulatorial conforme agendamento");
  linhas.push(
    "• Retornar em caso de febre, piora da dor ou alteração no curativo",
  );
  if (paciente.temInfeccao) {
    linhas.push("• Manter antibioticoterapia conforme prescrição");
  }
  linhas.push("");

  if (cirurgioes.length > 0) {
    linhas.push(
      `Cirurgião responsável: Dr(a). ${cirurgioes.join(", Dr(a). ")}`,
    );
  }

  const textoRelatorio = linhas.join("\n");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/pacientes/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            ← {paciente.nome}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Relatório Médico de Alta
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Texto gerado automaticamente — revise antes de usar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RelatorioCopiarButton texto={textoRelatorio} />
          <DownloadPDFButton
            nomeArquivo={`relatorio-${paciente.nome.replace(/\s+/g, "-")}`}
            texto={textoRelatorio}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
          {textoRelatorio}
        </pre>
      </div>

      {/* Fotos separadas por tipo */}
      {paciente.fotos.length > 0 && (
        <div className="space-y-6">
          {(["RADIOGRAFIA", "LESAO_PELE"] as const).map((tipo) => {
            const fotos = paciente.fotos.filter((f) => f.tipo === tipo);
            if (fotos.length === 0) return null;
            return (
              <div
                key={tipo}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  {tipo === "RADIOGRAFIA"
                    ? "🩻 Radiografias"
                    : "🩹 Lesões de pele"}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {fotos.map((f) => (
                    <div key={f.id} className="space-y-1">
                      <img
                        src={f.url}
                        alt={f.descricao || tipo}
                        className="w-full rounded-lg border border-slate-200 object-cover"
                      />
                      {f.dataFoto && (
                        <p className="text-xs text-slate-500 text-center">
                          {format(f.dataFoto, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                      {f.descricao && (
                        <p className="text-xs text-slate-400 text-center truncate">
                          {f.descricao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        Este relatório é gerado automaticamente com base nos dados cadastrados.
        Revise e complemente conforme necessário antes de assinar.
      </p>
    </div>
  );
}
