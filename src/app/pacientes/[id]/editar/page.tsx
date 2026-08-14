import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import PacienteForm from "@/components/pacientes/PacienteForm";
import { MEDICAMENTOS_COMUNS } from "@/lib/medicamentos";

type Params = { params: Promise<{ id: string }> };

export default async function EditarPacientePage({ params }: Params) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { id } = await params;

  // Relações gerenciadas pelas abas (pareceres, culturas, fotos e exames de
  // imagem) não são carregadas no formulário de edição.
  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      cirurgias: true,
    },
  });

  if (!paciente) notFound();

  const cirurgioes: string[] = (() => {
    try {
      const nomes = JSON.parse(paciente.cirurgioes);
      return Array.isArray(nomes)
        ? nomes.filter((nome): nome is string => typeof nome === "string")
        : [""];
    } catch {
      return [""];
    }
  })();

  const medicamentosSalvos = paciente.medicacoes
    ? paciente.medicacoes
        .split(",")
        .map((med) => med.trim())
        .filter(Boolean)
    : [];

  const medicamentosComuns = medicamentosSalvos.filter((med) =>
    MEDICAMENTOS_COMUNS.includes(med),
  );

  const medicamentosOutros = medicamentosSalvos
    .filter((med) => !MEDICAMENTOS_COMUNS.includes(med))
    .join(", ");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/pacientes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          ← {paciente.nome}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Editar Paciente
        </h1>
      </div>

      <PacienteForm
        modo="editar"
        inicial={{
          id,
          nome: paciente.nome,
          leito: paciente.leito,
          registroHospitalar: paciente.registroHospitalar,
          cpf: paciente.cpf || "",
          dataInternacao: paciente.dataInternacao.toISOString(),
          dataNascimento: paciente.dataNascimento?.toISOString() || "",
          diagnostico: paciente.diagnostico,
          cid: paciente.cid || "",
          subespecialidade: paciente.subespecialidade || "",
          cirurgioes,
          tipoStatus: paciente.tipoStatus,

          comorbidades: paciente.comorbidades || "",
          comorbidadesJson: paciente.comorbidadesJson ?? undefined,
          funcaoRenal: paciente.funcaoRenal,

          prevCirurgiasOrto: paciente.prevCirurgiasOrto,
          prevCirurgiasJson: paciente.prevCirurgiasJson ?? undefined,

          medicacoes: paciente.medicacoes || "",
          medicamentosJson: paciente.medicamentosJson ?? undefined,

          medicamentosComuns,
          medicamentosOutros,

          temAlergia: paciente.temAlergia,
          alergias: paciente.alergias || "",

          hemoglobinaAdm:
            paciente.hemoglobinaAdm != null
              ? String(paciente.hemoglobinaAdm)
              : undefined,

          plaquetasAdm:
            paciente.plaquetasAdm != null
              ? String(paciente.plaquetasAdm)
              : undefined,

          inrAdm: paciente.inrAdm != null ? String(paciente.inrAdm) : undefined,

          pps: paciente.pps != null ? String(paciente.pps) : undefined,

          temInfeccao: paciente.temInfeccao,
          infeccaoJson: paciente.infeccaoJson ?? undefined,

          altaOrtopediaData: paciente.altaOrtopediaData?.toISOString() ?? "",

          altaHospitalarData: paciente.altaHospitalarData?.toISOString() ?? "",

          previsaoAltaOrto: paciente.previsaoAltaOrto ?? "",
          clinicaMedico: paciente.clinicaMedico ?? "",
          aguardaClinica: paciente.aguardaClinica,

          riscoJson: paciente.riscoJson ?? undefined,

          compSolturaAssetica: paciente.compSolturaAssetica,
          compLuxacao: paciente.compLuxacao,
          compFalhaImplante: paciente.compFalhaImplante,
          compPseudoartrose: paciente.compPseudoartrose,
          compOutro: paciente.compOutro || "",

          traumaMecanismo: paciente.traumaMecanismo || "",
          historiaDoencaAtual:
            paciente.historiaDoencaAtual || paciente.traumaMecanismo || "",
          houveTrauma: paciente.houveTrauma || Boolean(paciente.traumaData),
          traumaData: paciente.traumaData?.toISOString() || "",
          traumaTempo: paciente.traumaTempo || "",

          cirurgias: paciente.cirurgias.map((c) => ({
            nomeCirurgia: c.nomeCirurgia,
            cirurgiao: c.cirurgiao,
            dataCirurgia: c.dataCirurgia.toISOString().split("T")[0],
            hospitalExterno: c.hospitalExterno || "",
            diagnostico: c.diagnostico || "",
            cid: c.cid || "",
            intercorrencia: c.intercorrencia,
            intercorrenciaDesc: c.intercorrenciaDesc || "",
          })),
        }}
      />
    </div>
  );
}
