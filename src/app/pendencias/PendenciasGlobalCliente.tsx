"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { WHATSAPP_CIRURGIOES } from "@/lib/cirurgioes";

type PacienteInfo = {
  id: string;
  nome: string;
  leito: string;
  diagnostico: string;
  cirurgioes: string;
  subespecialidade: string | null;
  status: string;
};

type Pendencia = {
  id: string;
  descricao: string;
  tipo: string;
  concluida: boolean;
  createdAt: string;
  paciente: PacienteInfo;
};

type Props = { pendencias: Pendencia[] };

const TIPO_LABELS: Record<string, string> = {
  RISCO_CIRURGICO: "Risco Cirúrgico",
  INFECTOLOGIA: "Infectologia",
  ALTA: "Alta",
  EXAME: "Exame",
  CLINICA: "Clínica",
  RX: "Raio-X", // Adicionado caso prefira usar esta chave no lugar de 'RX'
  CULTURA: "Cultura",
  MEDICAMENTOS: "Medicamentos",
  RECEITA: "Receita",
  DOCUMENTO: "Documento",
  RETORNO: "Retorno",
  OUTRO: "Outro",
};

const TIPO_CORES: Record<string, string> = {
  RISCO_CIRURGICO: "bg-orange-100 text-orange-700 border-orange-200",
  INFECTOLOGIA: "bg-red-100 text-red-700 border-red-200",
  ALTA: "bg-green-100 text-green-700 border-green-200",
  EXAME: "bg-blue-100 text-blue-700 border-blue-200",
  CLINICA: "bg-purple-100 text-purple-700 border-purple-200",
  RX: "bg-yellow-100 text-yellow-700 border-yellow-200",
  OUTRO: "bg-slate-100 text-slate-700 border-slate-200",
};

function buildWhatsAppMsg(
  paciente: PacienteInfo,
  pendencias: Pendencia[],
): string {
  const cirurgioes: string[] = (() => {
    try {
      return JSON.parse(paciente.cirurgioes);
    } catch {
      return [];
    }
  })();
  const lista = pendencias
    .map((p) => `- ${p.descricao} (${TIPO_LABELS[p.tipo] ?? p.tipo})`)
    .join("\n");
  return `Olá Dr(a). ${cirurgioes[0] ?? ""},\n\nAtualização sobre o paciente *${paciente.nome}*, leito ${paciente.leito}.\n\nDiagnóstico: ${paciente.diagnostico}\n\nPendências abertas:\n${lista}\n\nPodemos discutir a conduta? Obrigado(a).`;
}

export default function PendenciasGlobalCliente({
  pendencias: iniciais,
}: Props) {
  const [pendencias, setPendencias] = useState(iniciais);
  const [filtroConcluida, setFiltroConcluida] = useState<"ativas" | "todas">(
    "ativas",
  );
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos");
  const [busca, setBusca] = useState("");
  const [whatsappModal, setWhatsappModal] = useState<{
    paciente: PacienteInfo;
    pends: Pendencia[];
  } | null>(null);
  const [whatsappTel, setWhatsappTel] = useState("");

  async function resolver(id: string, concluida: boolean) {
    const res = await fetch("/api/pendencias", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendenciaId: id, concluida }),
    });
    if (res.ok) {
      setPendencias((prev) =>
        prev.map((p) => (p.id === id ? { ...p, concluida } : p)),
      );
    }
  }

  const filtradas = useMemo(() => {
    const buscaL = busca.toLowerCase();
    return pendencias.filter((p) => {
      if (filtroConcluida === "ativas" && p.concluida) return false;
      if (filtroTipo !== "Todos" && p.tipo !== filtroTipo) return false;
      if (
        busca &&
        !p.paciente.nome.toLowerCase().includes(buscaL) &&
        !p.descricao.toLowerCase().includes(buscaL)
      )
        return false;
      return true;
    });
  }, [pendencias, filtroConcluida, filtroTipo, busca]);

  // Agrupar por paciente
  const porPaciente = useMemo(() => {
    const map = new Map<
      string,
      { paciente: PacienteInfo; pends: Pendencia[] }
    >();
    for (const p of filtradas) {
      if (!map.has(p.paciente.id))
        map.set(p.paciente.id, { paciente: p.paciente, pends: [] });
      map.get(p.paciente.id)!.pends.push(p);
    }
    return Array.from(map.values());
  }, [filtradas]);

  const tipos = ["Todos", ...Object.keys(TIPO_LABELS)];
  const ativas = pendencias.filter((p) => !p.concluida).length;

  function abrirWhatsApp(pac: PacienteInfo, pends: Pendencia[]) {
    const cirurgioes: string[] = (() => {
      try {
        return JSON.parse(pac.cirurgioes);
      } catch {
        return [];
      }
    })();
    const telefone =
      cirurgioes.length > 0 ? (WHATSAPP_CIRURGIOES[cirurgioes[0]] ?? "") : "";
    setWhatsappTel(telefone);
    setWhatsappModal({ paciente: pac, pends });
  }

  function enviarWhatsApp() {
    if (!whatsappModal) return;
    const msg = buildWhatsAppMsg(whatsappModal.paciente, whatsappModal.pends);
    const tel = whatsappTel.replace(/\D/g, "");
    const url = tel
      ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setWhatsappModal(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Controle de Pendências
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {ativas} pendência{ativas !== 1 ? "s" : ""} ativa
          {ativas !== 1 ? "s" : ""} · {porPaciente.length} paciente(s)
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar paciente ou pendência..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            {(["ativas", "todas"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroConcluida(f)}
                className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  filtroConcluida === f
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "ativas" ? "Ativas" : "Todas"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tipos.map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                filtroTipo === t
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t === "Todos" ? "Todas" : (TIPO_LABELS[t] ?? t)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista por paciente */}
      {porPaciente.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {ativas === 0
            ? "✅ Nenhuma pendência ativa no momento."
            : "Nenhuma pendência encontrada."}
        </div>
      ) : (
        <div className="space-y-4">
          {porPaciente.map(({ paciente, pends }) => {
            const cirurgioes: string[] = (() => {
              try {
                return JSON.parse(paciente.cirurgioes);
              } catch {
                return [];
              }
            })();
            return (
              <div
                key={paciente.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Cabeçalho paciente */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {paciente.nome}
                      </span>
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                        Leito {paciente.leito}
                      </span>
                      {paciente.subespecialidade && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {paciente.subespecialidade}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {paciente.diagnostico}
                      {cirurgioes.length > 0 && ` · Dr. ${cirurgioes[0]}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        abrirWhatsApp(
                          paciente,
                          pends.filter((p) => !p.concluida),
                        )
                      }
                      title="Enviar WhatsApp ao cirurgião"
                      className="inline-flex items-center gap-1 text-xs font-medium bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      📱 WhatsApp
                    </button>
                    <Link
                      href={`/pacientes/${paciente.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Ver paciente
                    </Link>
                  </div>
                </div>

                {/* Lista de pendências */}
                <div className="divide-y divide-slate-100">
                  {pends.map((p) => (
                    <div
                      key={p.id}
                      className={`px-4 py-3 flex items-start gap-3 ${p.concluida ? "opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={p.concluida}
                        onChange={(e) => resolver(p.id, e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${p.concluida ? "line-through text-slate-400" : "text-slate-800"}`}
                        >
                          {p.descricao}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded border flex-shrink-0 ${TIPO_CORES[p.tipo] ?? TIPO_CORES.OUTRO}`}
                      >
                        {TIPO_LABELS[p.tipo] ?? p.tipo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal WhatsApp */}
      {whatsappModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Mensagem WhatsApp
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {whatsappModal.paciente.nome} · Leito{" "}
                {whatsappModal.paciente.leito}
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">
                  Número do cirurgião (com DDI, ex: 5511999999999)
                </label>
                <input
                  type="tel"
                  value={whatsappTel}
                  onChange={(e) => setWhatsappTel(e.target.value)}
                  placeholder="5511999999999"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Deixe em branco para abrir WhatsApp Web sem número
                  pré-selecionado.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">
                  Mensagem gerada
                </label>
                <textarea
                  readOnly
                  rows={10}
                  value={buildWhatsAppMsg(
                    whatsappModal.paciente,
                    whatsappModal.pends,
                  )}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 font-mono resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setWhatsappModal(null)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={enviarWhatsApp}
                className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📱 Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
