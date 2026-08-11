import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { differenceInDays, differenceInYears } from "date-fns";
import { Badge } from "@/components/ui/badge";
import AlterarStatusButton from "@/components/pacientes/AlterarStatusButton";
import PacienteDetailTabs from "@/components/pacientes/PacienteDetailTabs";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function PacienteDetailPage({ params }: Params) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { id } = await params;

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      cirurgias: { orderBy: { dataCirurgia: "desc" } },
      evolucoes: {
        orderBy: { data: "desc" },
        include: { pendencias: true },
      },
      pendencias: {
        orderBy: [{ concluida: "asc" }, { createdAt: "desc" }],
      },
      fotos: { orderBy: { createdAt: "asc" } },
      pareceres: { orderBy: { data: "desc" } },
      culturas: { orderBy: { dataColeta: "desc" } },
      examesImagem: { orderBy: { createdAt: "desc" } },
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

  const diasInternado = differenceInDays(
    new Date(),
    new Date(paciente.dataInternacao),
  );

  let idadePaciente: number | null = null;
  if (paciente.dataNascimento) {
    idadePaciente = differenceInYears(
      new Date(),
      new Date(paciente.dataNascimento),
    );
  }

  const statusLabels: Record<string, string> = {
    INTERNADO: "Internado",
    ALTA_ORTOPEDIA: "Alta Ortopedia",
    ALTA_HOSPITALAR: "Alta Hospitalar",
  };
  const statusColors: Record<string, string> = {
    INTERNADO: "bg-blue-100 text-blue-800 border-blue-200",
    ALTA_ORTOPEDIA: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ALTA_HOSPITALAR: "bg-green-100 text-green-800 border-green-200",
  };

  // Serialize dates for client components
  const evolucoesSerialized = paciente.evolucoes.map((e) => ({
    id: e.id,
    data: e.data.toISOString(),
    textoGerado: e.textoGerado,
    altaHoje: e.altaHoje,
    altaPrevista: e.altaPrevista,
    hemoglobina: e.hemoglobina,
    plaquetas: e.plaquetas,
    inr: e.inr,
    leucocitos: e.leucocitos,
    pcr: e.pcr,
    vhs: e.vhs,
    creatinina: e.creatinina,
    ureia: e.ureia,
    pendencias: e.pendencias.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      tipo: p.tipo,
      concluida: p.concluida,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  }));

  const pacienteSerialized = {
    id: paciente.id,
    nome: paciente.nome,
    leito: paciente.leito,
    registroHospitalar: paciente.registroHospitalar,
    cpf: paciente.cpf,
    dataInternacao: paciente.dataInternacao.toISOString(),
    dataNascimento: paciente.dataNascimento?.toISOString() ?? null,
    diagnostico: paciente.diagnostico,
    cid: paciente.cid,
    subespecialidade: paciente.subespecialidade,
    cirurgioes: paciente.cirurgioes,
    tipoStatus: paciente.tipoStatus,
    status: paciente.status,
    comorbidades: paciente.comorbidades,
    medicacoes: paciente.medicacoes,
    alergias: paciente.alergias,
    temInfeccao: paciente.temInfeccao,
    temAlergia: paciente.temAlergia,
    traumaMecanismo: paciente.traumaMecanismo,
    traumaData: paciente.traumaData?.toISOString() ?? null,
    traumaTempo: paciente.traumaTempo,
    pps: paciente.pps,
  };

  return (
    <div className="mx-auto">
      {/* Back */}
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          ← Enfermaria
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">
              {paciente.nome}
            </h1>
            <Badge className={`border ${statusColors[paciente.status]}`}>
              {statusLabels[paciente.status]}
            </Badge>
            {paciente.temInfeccao && (
              <Badge variant="destructive">Infecção</Badge>
            )}
            {paciente.temAlergia && paciente.alergias && (
              <Badge className="bg-red-100 text-red-800 border-red-300 border">
                ⚠ {paciente.alergias}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 flex-wrap">
            <span>
              Leito <strong className="text-slate-700">{paciente.leito}</strong>
            </span>
            <span>·</span>
            <span>
              Reg.{" "}
              <strong className="text-slate-700">
                {paciente.registroHospitalar}
              </strong>
            </span>
            {paciente.cpf && (
              <>
                <span>·</span>
                <span>
                  CPF <strong className="text-slate-700">{paciente.cpf}</strong>
                </span>
              </>
            )}
            <span>·</span>
            <span>
              <strong className="text-slate-700">{diasInternado}</strong>d
              internado
            </span>
            {idadePaciente !== null && (
              <>
                <span>·</span>
                <span>
                  <strong className="text-slate-700">{idadePaciente}</strong>{" "}
                  anos
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <Link
            href={`/pacientes/${id}/editar`}
            className="text-sm border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 px-3 py-1.5 rounded-lg transition-all duration-150 font-medium active:scale-95"
          >
            Editar
          </Link>
          <AlterarStatusButton pacienteId={id} statusAtual={paciente.status} />
        </div>
      </div>

      {/* Tabs */}
      <PacienteDetailTabs
        paciente={pacienteSerialized}
        evolucoes={evolucoesSerialized}
        cirurgias={paciente.cirurgias.map((c) => ({
          id: c.id,
          nomeCirurgia: c.nomeCirurgia,
          cirurgiao: c.cirurgiao,
          dataCirurgia: c.dataCirurgia.toISOString(),
          hospitalExterno: c.hospitalExterno,
        }))}
        pareceres={paciente.pareceres.map((p) => ({
          id: p.id,
          especialidade: p.especialidade,
          data: p.data.toISOString(),
          descricao: p.descricao,
          medico: p.medico,
        }))}
        fotos={paciente.fotos.map((f) => ({
          id: f.id,
          tipo: f.tipo,
          url: f.url,
          dataFoto: f.dataFoto?.toISOString() ?? null,
          descricao: f.descricao,
        }))}
        pendencias={paciente.pendencias.map((p) => ({
          id: p.id,
          descricao: p.descricao,
          tipo: p.tipo,
          concluida: p.concluida,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
        culturas={paciente.culturas.map((c) => ({
          id: c.id,
          dataColeta: c.dataColeta.toISOString(),
          sitio: c.sitio,
          resultado: c.resultado,
          dataResult: c.dataResult?.toISOString() ?? null,
        }))}
        examesImagem={paciente.examesImagem.map((e) => ({
          id: e.id,
          tipo: e.tipo,
          descricao: e.descricao,
          dataRealizacao: e.dataRealizacao?.toISOString() ?? null,
          sitio: e.sitio,
          achados: e.achados,
          linkTipo: e.linkTipo,
          linkUrl: e.linkUrl,
        }))}
        diasInternado={diasInternado}
        idadePaciente={idadePaciente}
        cirurgioesList={cirurgioes}
      />
    </div>
  );
}
