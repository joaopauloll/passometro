"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PendenciasTab from "@/components/pendencias/PendenciasTab";
import EvolucoesList from "@/components/evolucao/EvolucoesList";
import EvolucaoForm from "@/components/evolucao/EvolucaoForm";
import ExamesImagemTab from "@/components/pacientes/ExamesImagemTab";
import {
  gerarPrescricaoPDF,
  gerarAtestadoPDF,
  gerarAtestadoAcompanhantePDF,
  gerarLaudoPDF,
  gerarSolicitacaoFisioterapiaPDF,
  carregarLogoBase64,
  type PacienteParaPDF,
  type ConfiguracaoPDF,
} from "@/lib/pdfUtils";
import AltaTab from "./AltaTab";

// ─── Types ──────────────────────────────────────────────────────────────────

type Evolucao = {
  id: string;
  data: string;
  textoGerado: string | null;
  altaHoje: boolean | null;
  altaPrevista: boolean | null;
  hemoglobina: number | null;
  plaquetas: number | null;
  inr: number | null;
  leucocitos: number | null;
  pcr: number | null;
  vhs: number | null;
  creatinina: number | null;
  ureia: number | null;
  pendencias: {
    id: string;
    descricao: string;
    tipo: string;
    concluida: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
};

type Cirurgia = {
  id: string;
  nomeCirurgia: string;
  cirurgiao: string;
  dataCirurgia: string;
  hospitalExterno: string | null;
};
type Parecer = {
  id: string;
  especialidade: string;
  data: string;
  descricao: string;
  medico: string | null;
};
type Foto = {
  id: string;
  tipo: string;
  url: string;
  dataFoto: string | null;
  descricao: string | null;
};
type Pendencia = {
  id: string;
  descricao: string;
  tipo: string;
  concluida: boolean;
  createdAt: string;
  updatedAt: string;
};
type Cultura = {
  id: string;
  dataColeta: string;
  sitio: string;
  resultado: string | null;
  dataResult: string | null;
};

export type ExameImagem = {
  id: string;
  tipoExame: string;
  sitio: string;
  lateralidade: string;
  achados: string | null;
  laudo: string | null;
  hospitalOrigem: string;
  data: string;
};

type Paciente = {
  id: string;
  nome: string;
  leito: string;
  registroHospitalar: string;
  cpf: string | null;
  dataInternacao: string;
  dataNascimento: string | null;
  diagnostico: string;
  cid: string | null;
  subespecialidade: string | null;
  cirurgioes: string;
  tipoStatus: string;
  status: string;
  comorbidades: string | null;
  comorbidadesJson: string | null;
  medicacoes: string | null;
  medicamentosJson?: string | null;
  alergias: string | null;
  temInfeccao: boolean;
  temAlergia: boolean;
  traumaMecanismo: string | null;
  traumaData: string | null;
  traumaTempo: string | null;
  pps: number | null;
  funcaoRenal: string | null;
  infeccaoJson: string | null;
  riscoJson: string | null;
  aguardaClinica: boolean;
  clinicaMedico: string | null;
  compSolturaAssetica: boolean;
  compLuxacao: boolean;
  compFalhaImplante: boolean;
  compPseudoartrose: boolean;
  compOutro: string | null;
};

type Props = {
  paciente: Paciente;
  evolucoes: Evolucao[];
  cirurgias: Cirurgia[];
  pareceres: Parecer[];
  fotos: Foto[];
  pendencias: Pendencia[];
  culturas: Cultura[];
  examesImagem: ExameImagem[];
  diasInternado: number;
  idadePaciente: number | null;
  cirurgioesList: string[];
};

type Tab =
  | "resumo"
  | "evolucoes"
  | "cirurgias"
  | "pareceres"
  | "laboratorio"
  | "imagens"
  | "alta"
  | "pendencias";

const TABS: { id: Tab; label: string; count?: (p: Props) => number }[] = [
  { id: "resumo", label: "Resumo" },
  { id: "evolucoes", label: "Evoluções", count: (p) => p.evolucoes.length },
  { id: "cirurgias", label: "Cirurgias", count: (p) => p.cirurgias.length },
  { id: "pareceres", label: "Pareceres", count: (p) => p.pareceres.length },
  { id: "laboratorio", label: "Laboratório" },
  {
    id: "imagens",
    label: "Exames de Imagem",
    count: (p) => p.examesImagem.length + p.fotos.length,
  },
  { id: "alta", label: "Alta" },
  {
    id: "pendencias",
    label: "Pendências",
    count: (p) => p.pendencias.filter((x) => !x.concluida).length,
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PacienteDetailTabs(props: Props) {
  const {
    paciente,
    evolucoes,
    cirurgias,
    pareceres,
    fotos,
    pendencias,
    culturas,
    examesImagem,
    diasInternado,
    idadePaciente,
    cirurgioesList,
  } = props;
  const [tab, setTab] = useState<Tab>("resumo");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-slate-200 mb-5 -mx-1 px-1">
        {TABS.map((t) => {
          const count = t.count?.(props);
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {t.label}
              {count != null && count > 0 && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    tab === t.id
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "resumo" && <ResumoTab {...props} />}
      {tab === "evolucoes" && (
        <EvolucaoTab
          evolucoes={evolucoes}
          pacienteId={paciente.id}
          paciente={paciente}
          idadePaciente={idadePaciente}
        />
      )}
      {tab === "cirurgias" && (
        <CirurgiasTab cirurgias={cirurgias} pacienteId={paciente.id} />
      )}
      {tab === "pareceres" && (
        <ParecerTab pareceres={pareceres} pacienteId={paciente.id} />
      )}
      {tab === "laboratorio" && (
        <LaboratorioTab
          evolucoes={evolucoes}
          culturas={culturas}
          pacienteId={paciente.id}
        />
      )}
      {tab === "imagens" && (
        <ExamesImagemTab
          examesIniciais={examesImagem}
          fotosIniciais={fotos}
          pacienteId={paciente.id}
          evolucoes={evolucoes}
        />
      )}
      {tab === "alta" && <AltaAba paciente={paciente} cirurgias={cirurgias} />}
      {tab === "pendencias" && (
        <PendenciasTab pendencias={pendencias} pacienteId={paciente.id} />
      )}
    </div>
  );
}

// ─── Resumo Tab ──────────────────────────────────────────────────────────────

type ComorbidadesResumo = Record<string, boolean | string | undefined>;

function parseJsonSafe<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function calcularDpo(dataCirurgia: string | null | undefined): number | null {
  if (!dataCirurgia) return null;

  const diff = Math.floor(
    (new Date().getTime() - new Date(dataCirurgia).getTime()) / 86_400_000,
  );

  return diff >= 0 ? diff : null;
}

function formatarValorSimNao(value: unknown): string {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  return "—";
}

function ResumoSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ResumoTab({ paciente, evolucoes, cirurgias, cirurgioesList }: Props) {
  const ultimaEvolucao = evolucoes[0] ?? null;
  const ultimaCirurgia = cirurgias[0] ?? null;
  const dpo = calcularDpo(ultimaCirurgia?.dataCirurgia);

  const comorbidadesData = parseJsonSafe<ComorbidadesResumo>(
    paciente.comorbidadesJson,
    {},
  );

  const comorbidadeLabels: Record<string, string> = {
    has: "HAS",
    dm2: "DM2",
    tabagismo: "Tabagismo",
    etilismo: "Etilismo",
    avc: "AVC prévio",
    iam: "IAM prévio",
    drc: "DRC",
    osteoporose: "Osteoporose",
    obesidade: "Obesidade",
    demencia: "Demência",
    hipercolesterolemia: "Hipercolesterolemia",
    hipotireoidismo: "Hipotireoidismo",
    hipertireoidismo: "Hipertireoidismo",
    cancer: "Câncer",
    artrose: "Artrose",
    doencaAutoimune: "Doença autoimune",
  };

  const comorbidades = Object.entries(comorbidadeLabels)
    .filter(([key]) => comorbidadesData[key] === true)
    .map(([, label]) => label);

  const outrosComorbidade =
    typeof comorbidadesData.outros === "string"
      ? comorbidadesData.outros.trim()
      : "";

  if (outrosComorbidade) {
    comorbidades.push(outrosComorbidade);
  }

  if (comorbidades.length === 0 && paciente.comorbidades?.trim()) {
    comorbidades.push(paciente.comorbidades.trim());
  }

  const infeccao = parseJsonSafe<Record<string, unknown>>(
    paciente.infeccaoJson,
    {},
  );

  const risco = parseJsonSafe<Record<string, unknown>>(paciente.riscoJson, {});

  const temDadosRisco =
    Object.keys(risco).length > 0 ||
    paciente.aguardaClinica ||
    !!paciente.clinicaMedico;

  const temDadosInfeccao =
    paciente.temInfeccao || Object.keys(infeccao).length > 0;

  const complicacoes: string[] = [];

  if (paciente.compSolturaAssetica) complicacoes.push("Soltura asséptica");
  if (paciente.compLuxacao) complicacoes.push("Luxação");
  if (paciente.compFalhaImplante) complicacoes.push("Falha do implante");
  if (paciente.compPseudoartrose) complicacoes.push("Pseudoartrose");

  if (paciente.compOutro?.trim()) {
    complicacoes.push(paciente.compOutro.trim());
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ResumoSection title="Diagnóstico atual" className="lg:col-span-2">
        <div className="space-y-3">
          <div>
            <p className="text-base font-semibold text-slate-900 leading-relaxed">
              {paciente.diagnostico || "Não informado"}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
              {paciente.cid && (
                <span>
                  CID:{" "}
                  <strong className="text-slate-700">{paciente.cid}</strong>
                </span>
              )}

              {paciente.subespecialidade && (
                <span>
                  Subespecialidade:{" "}
                  <strong className="text-slate-700">
                    {paciente.subespecialidade}
                  </strong>
                </span>
              )}

              <span>
                Situação:{" "}
                <strong className="text-slate-700">
                  {paciente.tipoStatus === "POS_OPERATORIO"
                    ? "Pós-operatório"
                    : "Pré-operatório"}
                </strong>
              </span>
            </div>
          </div>

          {cirurgioesList.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Cirurgião(ões)
              </p>
              <p className="text-sm text-slate-700">
                {cirurgioesList.join(", ")}
              </p>
            </div>
          )}
        </div>
      </ResumoSection>

      <ResumoSection title="História clínica">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Comorbidades
            </p>

            {comorbidades.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {comorbidades.map((comorbidade) => (
                  <span
                    key={comorbidade}
                    className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {comorbidade}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Nenhuma comorbidade registrada.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
              <p className="text-xs text-slate-400">PPS</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {paciente.pps != null ? `${paciente.pps}%` : "—"}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
              <p className="text-xs text-slate-400">Função renal</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {paciente.funcaoRenal === "REDUZIDA"
                  ? "Reduzida"
                  : paciente.funcaoRenal === "NORMAL"
                    ? "Normal"
                    : "—"}
              </p>
            </div>
          </div>

          {paciente.medicacoes?.trim() && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Medicações
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {paciente.medicacoes}
              </p>
            </div>
          )}
        </div>
      </ResumoSection>

      {paciente.traumaMecanismo && (
        <ResumoSection title="Contexto do trauma">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">Mecanismo</p>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {paciente.traumaMecanismo}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {paciente.traumaData && (
                <div>
                  <p className="text-xs text-slate-400">Data</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {format(new Date(paciente.traumaData), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}

              {paciente.traumaTempo && (
                <div>
                  <p className="text-xs text-slate-400">Tempo de trauma</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {paciente.traumaTempo}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ResumoSection>
      )}

      {ultimaCirurgia && (
        <ResumoSection title="Situação cirúrgica">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {ultimaCirurgia.nomeCirurgia}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {format(new Date(ultimaCirurgia.dataCirurgia), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
                {ultimaCirurgia.hospitalExterno
                  ? ` · ${ultimaCirurgia.hospitalExterno}`
                  : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <p className="text-xs text-slate-400">Cirurgião</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {ultimaCirurgia.cirurgiao || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">DPO</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {dpo != null ? `${dpo}º DPO` : "—"}
                </p>
              </div>
            </div>
          </div>
        </ResumoSection>
      )}

      {temDadosRisco && (
        <ResumoSection title="Avaliação clínica">
          <div className="space-y-3">
            {Object.keys(risco).length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400">Risco cirúrgico</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {typeof risco.nivel === "string" && risco.nivel
                      ? risco.nivel
                      : "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Concluído</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {formatarValorSimNao(risco.concluido)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Cardiologista</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {typeof risco.cardiologista === "string" &&
                    risco.cardiologista
                      ? risco.cardiologista
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Indica UTI</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {formatarValorSimNao(risco.indicaUTI)}
                  </p>
                </div>
              </div>
            )}

            {paciente.aguardaClinica && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Aguardando Clínica Médica
                </p>
                {paciente.clinicaMedico && (
                  <p className="text-sm text-amber-900 mt-0.5">
                    Médico: {paciente.clinicaMedico}
                  </p>
                )}
              </div>
            )}
          </div>
        </ResumoSection>
      )}

      {temDadosInfeccao && (
        <ResumoSection title="Infecção">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">Febre</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatarValorSimNao(infeccao.febre)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Antibiótico</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {typeof infeccao.antibiotico === "string" &&
                  infeccao.antibiotico
                    ? infeccao.antibiotico
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Início</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {typeof infeccao.inicio === "string" && infeccao.inicio
                    ? infeccao.inicio
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Dreno</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatarValorSimNao(infeccao.dreno)}
                </p>
              </div>
            </div>

            {typeof infeccao.culturasResult === "string" &&
              infeccao.culturasResult && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                    Culturas
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {infeccao.culturasResult}
                  </p>
                </div>
              )}
          </div>
        </ResumoSection>
      )}

      {complicacoes.length > 0 && (
        <ResumoSection title="Complicações">
          <div className="space-y-2">
            {complicacoes.map((complicacao) => (
              <div
                key={complicacao}
                className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-red-800">
                  {complicacao}
                </p>
              </div>
            ))}
          </div>
        </ResumoSection>
      )}

      {ultimaEvolucao?.textoGerado && (
        <ResumoSection
          title={`Última evolução — ${format(
            new Date(ultimaEvolucao.data),
            "dd/MM/yyyy",
            { locale: ptBR },
          )}`}
          className="lg:col-span-2"
        >
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {ultimaEvolucao.textoGerado}
          </p>
        </ResumoSection>
      )}
    </div>
  );
}

// ─── Evoluções Tab ────────────────────────────────────────────────────────────

function EvolucaoTab({
  evolucoes,
  pacienteId,
  paciente,
  idadePaciente,
}: {
  evolucoes: Evolucao[];
  pacienteId: string;
  paciente: Paciente;
  idadePaciente: number | null;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            Evoluções clínicas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registre a evolução do dia e acompanhe o histórico do paciente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? "Fechar formulário" : "+ Nova evolução"}
        </button>
      </div>
      {showForm && (
        <EvolucaoForm
          pacienteId={pacienteId}
          isPosOperatorio={paciente.tipoStatus === "POS_OPERATORIO"}
          idadePaciente={idadePaciente}
          nomePaciente={paciente.nome}
        />
      )}
      <EvolucoesList evolucoes={evolucoes} pacienteId={pacienteId} />
    </div>
  );
}

// ─── Cirurgias Tab ────────────────────────────────────────────────────────────

function CirurgiasTab({
  cirurgias,
  pacienteId,
}: {
  cirurgias: Cirurgia[];
  pacienteId: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link
          href={`/pacientes/${pacienteId}/editar`}
          className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Adicionar cirurgia (via Editar)
        </Link>
      </div>
      {cirurgias.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          Nenhuma cirurgia registrada.
        </p>
      ) : (
        <div className="space-y-3">
          {cirurgias.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3 px-4">
                <p className="font-semibold text-slate-900">{c.nomeCirurgia}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Dr. {c.cirurgiao} ·{" "}
                  {format(new Date(c.dataCirurgia), "dd/MM/yyyy")}
                  {c.hospitalExterno && ` · ${c.hospitalExterno}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pareceres Tab ────────────────────────────────────────────────────────────

function ParecerTab({
  pareceres: iniciais,
  pacienteId,
}: {
  pareceres: Parecer[];
  pacienteId: string;
}) {
  const [pareceres, setPareceres] = useState(iniciais);
  const [form, setForm] = useState({
    especialidade: "",
    data: new Date().toISOString().split("T")[0],
    descricao: "",
    medico: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (!form.especialidade || !form.descricao) return;
    setSaving(true);
    const res = await fetch(`/api/pacientes/${pacienteId}/pareceres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const novo = await res.json();
      setPareceres([{ ...novo, data: novo.data }, ...pareceres]);
      setForm({
        especialidade: "",
        data: new Date().toISOString().split("T")[0],
        descricao: "",
        medico: "",
      });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function remover(id: string) {
    if (!confirm("Remover este parecer?")) return;
    await fetch(`/api/pacientes/${pacienteId}/pareceres?parecerId=${id}`, {
      method: "DELETE",
    });
    setPareceres((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Novo Parecer
        </button>
      </div>

      {showForm && (
        <Card className="border-blue-200">
          <CardContent className="py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Especialidade *
                </label>
                <input
                  value={form.especialidade}
                  onChange={(e) =>
                    setForm({ ...form, especialidade: e.target.value })
                  }
                  placeholder="Ex: Cardiologia"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500 block mb-1">
                  Médico parecerista
                </label>
                <input
                  value={form.medico}
                  onChange={(e) => setForm({ ...form, medico: e.target.value })}
                  placeholder="Dr(a). nome"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500 block mb-1">
                  Descrição *
                </label>
                <textarea
                  rows={4}
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  placeholder="Resumo do parecer…"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={saving}
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {pareceres.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          Nenhum parecer registrado.
        </p>
      ) : (
        <div className="space-y-3">
          {pareceres.map((p) => (
            <Card key={p.id} className="group">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {p.especialidade}
                      </span>
                      <span className="text-xs text-slate-500">
                        {format(new Date(p.data), "dd/MM/yyyy")}
                      </span>
                      {p.medico && (
                        <span className="text-xs text-slate-500">
                          · Dr(a). {p.medico}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">
                      {p.descricao}
                    </p>
                  </div>
                  <button
                    onClick={() => remover(p.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Laboratório Tab ──────────────────────────────────────────────────────────

function LaboratorioTab({
  evolucoes,
  culturas: iniciais,
  pacienteId,
}: {
  evolucoes: Evolucao[];
  culturas: Cultura[];
  pacienteId: string;
}) {
  const [culturas, setCulturas] = useState(iniciais);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formCultura, setFormCultura] = useState({
    dataColeta: "",
    sitio: "",
    resultado: "",
    dataResult: "",
  });

  const comLabs = evolucoes.filter(
    (e) =>
      e.hemoglobina != null ||
      e.plaquetas != null ||
      e.inr != null ||
      e.leucocitos != null ||
      e.pcr != null ||
      e.vhs != null ||
      e.creatinina != null ||
      e.ureia != null,
  );

  const alerta = (v: number | null, min: number, max: number) => {
    if (v == null) return "text-slate-500";
    if (v < min || v > max) return "text-red-600 font-bold";
    return "text-green-700";
  };

  async function salvarCultura() {
    if (!formCultura.dataColeta || !formCultura.sitio) return;
    setSaving(true);
    const res = await fetch(`/api/pacientes/${pacienteId}/culturas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formCultura),
    });
    if (res.ok) {
      const nova = await res.json();
      setCulturas([
        { ...nova, dataColeta: nova.dataColeta, dataResult: nova.dataResult },
        ...culturas,
      ]);
      setFormCultura({
        dataColeta: "",
        sitio: "",
        resultado: "",
        dataResult: "",
      });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function removerCultura(id: string) {
    await fetch(`/api/pacientes/${pacienteId}/culturas?culturaId=${id}`, {
      method: "DELETE",
    });
    setCulturas((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Exames laboratoriais */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Exames laboratoriais
        </h3>
        {comLabs.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">
            Nenhum resultado laboratorial registrado nas evoluções.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    Data
                  </th>
                  {[
                    ["Hb", "12–16"],
                    ["Plt", "150–400k"],
                    ["INR", "0.8–1.2"],
                    ["Leuc", "4–11k"],
                    ["PCR", "<5"],
                    ["VHS", "<20"],
                    ["Creat", "0.7–1.2"],
                    ["Ureia", "15–40"],
                  ].map(([h, ref]) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap"
                    >
                      {h}
                      <br />
                      <span className="text-[10px] font-normal text-slate-400">
                        {ref}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comLabs.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 text-xs font-medium text-slate-700">
                      {format(new Date(e.data), "dd/MM")}
                    </td>
                    <td
                      className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.hemoglobina, 12, 16)}`}
                    >
                      {e.hemoglobina ?? "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.plaquetas, 150, 400)}`}
                    >
                      {e.plaquetas ?? "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.inr, 0.8, 1.2)}`}
                    >
                      {e.inr ?? "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.leucocitos, 4, 11)}`}
                    >
                      {e.leucocitos ?? "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.pcr, 0, 5)}`}
                    >
                      {e.pcr ?? "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.vhs, 0, 20)}`}
                    >
                      {e.vhs ?? "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.creatinina, 0.7, 1.2)}`}
                    >
                      {e.creatinina ?? "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-center text-xs font-mono ${alerta(e.ureia, 15, 40)}`}
                    >
                      {e.ureia ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Culturas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Culturas</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            + Nova Cultura
          </button>
        </div>

        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Data da coleta *
                </label>
                <input
                  type="date"
                  value={formCultura.dataColeta}
                  onChange={(e) =>
                    setFormCultura({
                      ...formCultura,
                      dataColeta: e.target.value,
                    })
                  }
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Sítio coletado *
                </label>
                <input
                  value={formCultura.sitio}
                  onChange={(e) =>
                    setFormCultura({ ...formCultura, sitio: e.target.value })
                  }
                  placeholder="Ex: Hemocultura, Urocultura, Swab de ferida"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Data do resultado
                </label>
                <input
                  type="date"
                  value={formCultura.dataResult}
                  onChange={(e) =>
                    setFormCultura({
                      ...formCultura,
                      dataResult: e.target.value,
                    })
                  }
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Resultado
                </label>
                <input
                  value={formCultura.resultado}
                  onChange={(e) =>
                    setFormCultura({
                      ...formCultura,
                      resultado: e.target.value,
                    })
                  }
                  placeholder="Ex: S. aureus MRSA, Negativo"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvarCultura}
                disabled={saving}
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {culturas.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">
            Nenhuma cultura registrada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    Coleta
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    Sítio
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    Resultado
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    Data resultado
                  </th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {culturas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 hover:bg-slate-50 group"
                  >
                    <td className="px-3 py-2 text-xs font-medium text-slate-700">
                      {format(new Date(c.dataColeta), "dd/MM/yyyy")}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {c.sitio}
                    </td>
                    <td
                      className={`px-3 py-2 text-xs font-medium ${c.resultado ? (c.resultado.toLowerCase().includes("negat") ? "text-green-700" : "text-red-700") : "text-slate-400"}`}
                    >
                      {c.resultado || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {c.dataResult
                        ? format(new Date(c.dataResult), "dd/MM/yyyy")
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removerCultura(c.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Alta Tab ────────────────────────────────────────────────────────────────

function AltaAba({
  paciente,
  cirurgias,
}: {
  paciente: Paciente;
  cirurgias: Cirurgia[];
}) {
  return (
    <div className="space-y-6">
      <AltaTab paciente={paciente} cirurgias={cirurgias} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Relatório */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              📄 Relatório Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">
              Gera um relatório completo do paciente contendo identificação,
              diagnóstico, histórico, cirurgias, exames e evolução clínica.
            </p>
            <Link
              href={`/pacientes/${paciente.id}/relatorio`}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ⬇ Gerar Relatório
            </Link>
          </CardContent>
        </Card>

        {/* Calendário */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              📅 Calendário do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">
              Gera um calendário com os principais eventos da internação,
              incluindo cirurgias, evoluções e demais registros do paciente.
            </p>
            <Link
              href={`/pacientes/${paciente.id}/calendario`}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ⬇ Gerar Calendário
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
