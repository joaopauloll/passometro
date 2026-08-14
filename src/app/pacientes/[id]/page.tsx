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

function parseCirurgioes(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

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

  const cirurgioes = parseCirurgioes(paciente.cirurgioes);

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

  const ultimaCirurgia = paciente.cirurgias[0] ?? null;

  const dpo =
    paciente.tipoStatus === "POS_OPERATORIO" && ultimaCirurgia
      ? differenceInDays(new Date(), new Date(ultimaCirurgia.dataCirurgia))
      : null;

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
    estavel: e.estavel,
    febre: e.febre,
    semDor: e.semDor,
    dorControlada: e.dorControlada,
    diurese: e.diurese,
    ultimaEvacuacao: e.ultimaEvacuacao,
    perfusaoPreservada: e.perfusaoPreservada,
    sensibilidadePreservada: e.sensibilidadePreservada,
    movimentoPreservado: e.movimentoPreservado,
    usaGesso: e.usaGesso,
    qualGesso: e.qualGesso,
    imobilizacaoTipos: e.imobilizacaoTipos
      ? JSON.parse(e.imobilizacaoTipos)
      : [],
    imobilizacaoLateralidade: e.imobilizacaoLateralidade,
    possuiCurativo: e.possuiCurativo,
    curativoLimpo: e.curativoLimpo,
    secrecaoInfecciosa: e.secrecaoInfecciosa,
    secrecaoSanguinolenta: e.secrecaoSanguinolenta,
    curativoLocal: e.curativoLocal,
    curativoLateralidade: e.curativoLateralidade,
    rxPosOpRealizado: e.rxPosOpRealizado,
    rxSatisfatorio: e.rxSatisfatorio,
    rxEnviadoCirurgiao: e.rxEnviadoCirurgiao,
    deficitPrevio: e.deficitPrevio,
    movPosOp: e.movPosOp,
    sensPosOp: e.sensPosOp,
    deficitNeurol: e.deficitNeurol,
    cardioPendente: e.cardioPendente,
    cardiologistaLiberou: e.cardiologistaLiberou,
    solicitouEco: e.solicitouEco,
    ecoReady: e.ecoReady,
    necessitaUTI: e.necessitaUTI,
    culturasSolicitadas: e.culturasSolicitadas,
    culturasResultado: e.culturasResultado,
    infectAvaliado: e.infectAvaliado,
    nomeInfectologista: e.nomeInfectologista,
    antibioticoAtual: e.antibioticoAtual,
    diaTratamento: e.diaTratamento,
    antibioticosPrevios: e.antibioticosPrevios,
    lavCirurgicaRealizada: e.lavCirurgicaRealizada,
    qtdLavagens: e.qtdLavagens,
    retirouImplante: e.retirouImplante,
    outrasLesoes: e.outrasLesoes ? JSON.parse(e.outrasLesoes) : [],
    acompClinico: e.acompClinico,
    nomeClinico: e.nomeClinico,
    sentou: e.sentou,
    iniciouFisioterapia: e.iniciouFisioterapia,
    dreno: e.dreno,
    drenoCm3: e.drenoCm3,
    drenoAspecto: e.drenoAspecto,
    observacoes: e.observacoes,
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
    comorbidadesJson: paciente.comorbidadesJson,
    medicacoes: paciente.medicacoes,
    medicamentosJson: paciente.medicamentosJson,
    alergias: paciente.alergias,
    temInfeccao: paciente.temInfeccao,
    temAlergia: paciente.temAlergia,
    traumaMecanismo: paciente.traumaMecanismo,
    historiaDoencaAtual: paciente.historiaDoencaAtual,
    houveTrauma: paciente.houveTrauma,
    traumaData: paciente.traumaData?.toISOString() ?? null,
    traumaTempo: paciente.traumaTempo,
    pps: paciente.pps,
    funcaoRenal: paciente.funcaoRenal,
    infeccaoJson: paciente.infeccaoJson,
    riscoJson: paciente.riscoJson,
    aguardaClinica: paciente.aguardaClinica,
    clinicaMedico: paciente.clinicaMedico,
    compSolturaAssetica: paciente.compSolturaAssetica,
    compLuxacao: paciente.compLuxacao,
    compFalhaImplante: paciente.compFalhaImplante,
    compPseudoartrose: paciente.compPseudoartrose,
    compOutro: paciente.compOutro,
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

            <Badge
              className={`border ${
                statusColors[paciente.status] ??
                "bg-slate-100 text-slate-800 border-slate-200"
              }`}
            >
              {statusLabels[paciente.status] ?? paciente.status}
            </Badge>

            <Badge
              className={
                paciente.tipoStatus === "POS_OPERATORIO"
                  ? "bg-blue-50 text-blue-700 border-blue-200 border"
                  : "bg-amber-50 text-amber-700 border-amber-200 border"
              }
            >
              {paciente.tipoStatus === "POS_OPERATORIO"
                ? "Pós-operatório"
                : "Pré-operatório"}
            </Badge>

            {dpo !== null && dpo >= 0 && (
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 border">
                {dpo}º DPO
              </Badge>
            )}

            {paciente.aguardaClinica && (
              <Badge className="bg-amber-50 text-amber-800 border-amber-200 border">
                Aguarda Clínica
              </Badge>
            )}

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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
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
          diagnostico: c.diagnostico,
          cid: c.cid,
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
          tipoExame: e.tipoExame,
          sitio: e.sitio,
          lateralidade: e.lateralidade,
          laudo: e.laudo,
          hospitalOrigem: e.hospitalOrigem,
          data: e.data.toISOString(),
        }))}
        diasInternado={diasInternado}
        idadePaciente={idadePaciente}
        cirurgioesList={cirurgioes}
      />
    </div>
  );
}
