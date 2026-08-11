"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PacienteCard from "./PacienteCard";
import { Filter, Users, UserPlus } from "lucide-react";

type Paciente = {
  id: string;
  nome: string;
  leito: string;
  registroHospitalar: string;
  dataInternacao: string;
  diagnostico: string;
  cid: string | null;
  cirurgioes: string;
  tipoStatus: string;
  status: string;
  temInfeccao: boolean;
  dataNascimento: string | null;
  pendencias: {
    id: string;
    descricao: string;
    tipo: string;
    concluida: boolean;
  }[];
  evolucoes: {
    id: string;
    altaHoje: boolean | null;
    altaPrevista: boolean | null;
  }[];
  cirurgias: { id: string; dataCirurgia: string; nomeCirurgia: string }[];
};

type Props = {
  contadores: {
    internados: number;
    altaOrtopedia: number;
    altaHospitalar: number;
  };
};

const SUBESPECIALIDADES = [
  "Todas",
  "Quadril",
  "Joelho",
  "Ombro",
  "Cotovelo",
  "Mão e Punho",
  "Pé e Tornozelo",
  "Coluna",
  "Trauma",
  "Oncologia",
  "Pediatria",
  "Tumores",
];

const STATUS_CIRURGICOS = [
  { label: "Todos", value: "" },
  { label: "Pré-Op", value: "PRE_OPERATORIO" },
  { label: "Pós-Op", value: "POS_OPERATORIO" },
];

const FILTROS_ESPECIAIS = [
  { label: "Nenhum", value: "todos" },
  { label: "Com pendências", value: "pendencias" },
  { label: "Infectados", value: "infectados" },
  { label: "Alta hoje", value: "alta-hoje" },
  { label: "Aguardando risco", value: "aguardando-risco" },
  { label: "Aguardando cirurgia", value: "aguardando-cirurgia" },
];

export default function PacienteListaCliente({ contadores }: Props) {
  const [tabAtiva, setTabAtiva] = useState("INTERNADO");
  const [busca, setBusca] = useState("");
  const [filtroLeito, setFiltroLeito] = useState("");
  const [filtroCirurgiao, setFiltroCirurgiao] = useState("");
  const [filtroSubesp, setFiltroSubesp] = useState("");
  const [filtroTipoStatus, setFiltroTipoStatus] = useState("");
  const [filtroEspecial, setFiltroEspecial] = useState("todos");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: tabAtiva,
      busca,
      leito: filtroLeito,
    });
    if (filtroCirurgiao) params.set("cirurgiao", filtroCirurgiao);
    if (filtroSubesp) params.set("subespecialidade", filtroSubesp);
    if (filtroTipoStatus) params.set("tipoStatus", filtroTipoStatus);
    if (filtroEspecial === "infectados") params.set("infeccao", "true");
    if (filtroEspecial === "alta-hoje") params.set("altaHoje", "true");
    if (filtroEspecial === "aguardando-risco")
      params.set("aguardandoRisco", "true");
    if (filtroEspecial === "aguardando-cirurgia")
      params.set("aguardandoCirurgia", "true");

    try {
      const res = await fetch(`/api/pacientes?${params}`);
      const data = await res.json();
      setPacientes(Array.isArray(data) ? data : []);
    } catch {
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [
    tabAtiva,
    busca,
    filtroLeito,
    filtroCirurgiao,
    filtroSubesp,
    filtroTipoStatus,
    filtroEspecial,
  ]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const statusLabel: Record<string, string> = {
    INTERNADO: `Internados (${contadores.internados})`,
    ALTA_ORTOPEDIA: `Alta Orto. (${contadores.altaOrtopedia})`,
    ALTA_HOSPITALAR: `Alta Hosp. (${contadores.altaHospitalar})`,
  };

  const temFiltrosAtivos =
    busca ||
    filtroLeito ||
    filtroCirurgiao ||
    filtroSubesp ||
    filtroTipoStatus ||
    filtroEspecial !== "todos";

  const limparFiltros = () => {
    setBusca("");
    setFiltroLeito("");
    setFiltroCirurgiao("");
    setFiltroSubesp("");
    setFiltroTipoStatus("");
    setFiltroEspecial("todos");
  };

  return (
    <div className="w-full">
      <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
        {/* ── Top Bar: Abas & Botão de Filtro ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl h-auto w-full sm:w-fit grid grid-cols-3 sm:flex">
            {Object.keys(statusLabel).map((s) => (
              <TabsTrigger
                key={s}
                value={s}
                className="rounded-lg text-[11px] sm:text-xs font-semibold py-2 px-3 sm:px-4 text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all"
              >
                {statusLabel[s]}
              </TabsTrigger>
            ))}
          </TabsList>

          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all font-semibold active:scale-95 ${
              mostrarFiltros
                ? "bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700"
                : temFiltrosAtivos
                  ? "bg-blue-50 text-blue-700 border-blue-200/80 shadow-sm hover:bg-blue-100/70"
                  : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <Filter
              className={`w-4 h-4 transition-colors ${
                mostrarFiltros
                  ? "text-white"
                  : temFiltrosAtivos
                    ? "fill-blue-100 text-blue-700"
                    : "text-slate-500"
              }`}
            />
            <span>Filtros</span>
            {temFiltrosAtivos && (
              <span
                className={`flex h-2 w-2 rounded-full ml-1 ${
                  mostrarFiltros ? "bg-white" : "bg-blue-500"
                }`}
              />
            )}
          </button>
        </div>

        {/* ── Painel de Filtros (Padrão Evoluções) ── */}
        <div
          className={`transition-all duration-300 ease-in-out ${mostrarFiltros ? "block" : "hidden"}`}
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6 space-y-5">
            {/* Linha 1: Buscas de Texto Livres */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Buscar paciente, diagnóstico ou registro..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <input
                type="text"
                placeholder="Nº do Leito"
                value={filtroLeito}
                onChange={(e) => setFiltroLeito(e.target.value)}
                className="sm:w-32 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <input
                type="text"
                placeholder="Nome do Cirurgião"
                value={filtroCirurgiao}
                onChange={(e) => setFiltroCirurgiao(e.target.value)}
                className="sm:w-48 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Linha 2: Chips de Subespecialidades */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">
                Subespecialidade:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUBESPECIALIDADES.map((esp) => {
                  const isActive =
                    filtroSubesp === esp ||
                    (esp === "Todas" && filtroSubesp === "");
                  return (
                    <button
                      key={esp}
                      onClick={() =>
                        setFiltroSubesp(esp === "Todas" ? "" : esp)
                      }
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {esp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Linha 3: Chips de Status e Filtros Especiais */}
            <div className="flex flex-col sm:flex-row gap-6 border-t border-slate-100 pt-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">
                  Fase Cirúrgica:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_CIRURGICOS.map((st) => (
                    <button
                      key={st.value}
                      onClick={() => setFiltroTipoStatus(st.value)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        filtroTipoStatus === st.value
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">
                  Filtros Especiais:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FILTROS_ESPECIAIS.map((esp) => (
                    <button
                      key={esp.value}
                      onClick={() => setFiltroEspecial(esp.value)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        filtroEspecial === esp.value
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {esp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Botão de Limpar (Visível apenas quando há filtros) */}
            {temFiltrosAtivos && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={limparFiltros}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline px-2"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Lista de Pacientes ── */}
        {Object.keys(statusLabel).map((s) => (
          <TabsContent key={s} value={s} className="mt-0 outline-none">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-sm font-medium">Buscando pacientes...</p>
              </div>
            ) : pacientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-slate-700 font-semibold text-lg">
                  Nenhum paciente encontrado
                </h3>
                <p className="text-slate-500 text-sm mt-1 mb-5 max-w-sm">
                  {temFiltrosAtivos
                    ? "Tente remover alguns filtros de busca para ver mais resultados."
                    : "A lista está vazia para esta categoria no momento."}
                </p>

                {s === "INTERNADO" && !temFiltrosAtivos && (
                  <Link
                    href="/pacientes/novo"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm active:scale-95 text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Cadastrar novo paciente
                  </Link>
                )}
                {temFiltrosAtivos && (
                  <button
                    onClick={limparFiltros}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pacientes
                  .filter((p) => {
                    if (filtroEspecial === "pendencias")
                      return (
                        p.pendencias.filter((pe) => !pe.concluida).length > 0
                      );
                    return true;
                  })
                  .map((p) => (
                    <PacienteCard
                      key={p.id}
                      paciente={p}
                      onStatusChange={fetchPacientes}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
