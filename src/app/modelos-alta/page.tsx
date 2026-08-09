"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Save, FileText, ChevronDown, ChevronRight, Copy, Check, Pill } from "lucide-react";
// Ajuste os imports abaixo para o caminho correto dos seus componentes de UI
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Importe a lista de cirurgiões que criamos na Fase 1
import { TODOS_CIRURGIOES, getEspecialidadePorCirurgiao } from "@/lib/cirurgioes"; 

// --- CONSTANTES ---
const MEDICAMENTOS_ALTA = [
  "Dipirona 1g — 6/6h se dor — via oral",
  "Paracetamol 750mg — 6/6h se dor (alergia à dipirona) — via oral",
  "Tramadol 50mg — 1 cp 8/8h se dor refratária — via oral",
  "Tamarine geleia — 1 colher de sopa 1x/dia por 10 dias — via oral",
  "Rivaroxabana 10mg — 1 cp ao dia por 15 dias (profilaxia TVP) — via oral",
  "Varfarina 5mg — conforme INR — via oral",
  "Enoxaparina 40mg — 1x/dia SC — via subcutânea",
  "Cefadroxila 500mg — 1 cp 12/12h por 7 dias — via oral",
  "Amoxicilina + Clavulanato 875mg — 1 cp 12/12h por 7 dias — via oral",
  "Metformina 850mg — 1 cp 8/8h — via oral",
  "Omeprazol 20mg — 1 cp ao dia — via oral",
  "Losartana 50mg — 1 cp ao dia — via oral",
  "Anlodipino 5mg — 1 cp ao dia — via oral",
  "Varredor intestinal (laxante) — conforme necessidade — via oral",
];

const ORTESE_OPCOES = [
  { value: "Nenhuma", label: "Nenhuma" },
  { value: "Robofoot", label: "Robofoot" },
  { value: "Brace longo", label: "Brace longo" },
  { value: "Tipoia", label: "Tipoia" },
  { value: "Outra", label: "Outra" },
];

const PRESCRICAO_PADRAO = `Analgesia: Dipirona 1g 6/6h se dor, ou Paracetamol 750mg 6/6h se alergia à dipirona — via oral
Tramadol 50mg — 10 comprimidos (1 cp de 8/8h se dor refratária à dipirona ou paracetamol) — via oral
Tamarine geleia — 1 colher de sopa 1x/dia por 10 dias — via oral
Rivaroxabana 10mg — 1 comprimido ao dia por 15 dias (profilaxia para trombose) — via oral
Cefadroxila 500mg — 1 comprimido de 12/12h por 7 dias — via oral`;

const TROCAR_CURATIVO_PADRAO = `Diariamente: lavar com água e sabão neutro, secar bem com gaze, passar álcool 70% líquido e refazer com gaze e micropore. De preferência com profissional da saúde.`;

const SINAIS_ALARME_PADRAO = `Se sinais de alarme (febre, dor que não melhora com analgésicos simples, inchado, extremidades arroxeadas, saída de secreção esverdeada pela ferida, ou outros sinais de alarme) buscar um pronto socorro.`;

const LAUDO_PADRAO = `LAUDO MÉDICO\n\nPaciente: [NOME] — CPF: [CPF]\nHistória do trauma: [HISTÓRIA] (data: [DATA_TRAUMA])\nData da internação: [DATA_INTERNACAO]\nDiagnóstico: [DIAGNOSTICO] (CID-10: [CID])\nData da cirurgia: [DATA_CIRURGIA]\nProcedimento: [NOME_CIRURGIA]\nCirurgião: [CIRURGIAO]\nData da alta da ortopedia: [DATA_ALTA]\nTempo de afastamento necessário: [TEMPO_AFASTAMENTO]`;

const ATESTADO_PADRAO = `ATESTADO MÉDICO\n\nCID: Z75.0 (Acompanhamento de pessoa doente internada)\n\n_____________________________________ (nome) esteve hoje acompanhando paciente internada nessa unidade hospitalar para tratamento cirúrgico.\n\nData: _____/_____/______`;

// --- COMPONENTE PRINCIPAL ---
export default function ModelosAltaPage() {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<any>(null);
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});
  const [copiado, setCopiado] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/modelos-alta");
      const data = await res.json();
      setModelos(data);
    } catch (error) {
      console.error("Erro ao carregar modelos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const novoModelo = () => {
    setEditando({
      nomeCirurgia: "",
      cirurgiao: "",
      especialidade: "",
      recomendacoes: {
        pode_pisar: false,
        carga_tipo: "total",
        pode_dobrar_joelho: false,
        pode_sentar: false,
        pode_trocar_curativo: true,
        pode_retirar_suturas: true,
        pode_deitar_lado: false,
        pode_fisioterapia: true,
        fisioterapia_recomendacoes: "",
        ortese_outra: "", // campo auxiliar
      },
      comoTrocarCurativo: TROCAR_CURATIVO_PADRAO,
      sinaisAlarme: SINAIS_ALARME_PADRAO,
      retornoDias: 30,
      retornoTelefone: "",
      retornoEndereco: "Ambulatório do Hospital",
      retornoCep: "",
      prescricaoTexto: PRESCRICAO_PADRAO,
      medicamentosSelecionados: [],
      orteseTipo: "Nenhuma",
      orteseInstrucoes: "",
      laudoTexto: LAUDO_PADRAO,
      atestadoTexto: ATESTADO_PADRAO,
    });
  };

  const editar = (m: any) => {
    // 1. Pegamos os nomes exatos que vêm do banco de dados (Prisma)
    let rec = m.recomendacoesJson; 
    let meds = m.prescricaoMedicamentos;

    // 2. Convertemos de String (Texto) para Objetos do Javascript
    if (typeof rec === "string") {
      try { rec = JSON.parse(rec); } catch (e) { rec = {}; }
    }
    if (typeof meds === "string") {
      try { meds = JSON.parse(meds); } catch (e) { meds = []; }
    }

    // 3. Garantimos que não fiquem nulos
    if (!rec || typeof rec !== "object") rec = {};
    if (!meds || !Array.isArray(meds)) meds = [];

    // 4. Passamos para o estado com os nomes que a tela do React usa
    setEditando({ 
      ...m, 
      recomendacoes: rec, 
      medicamentosSelecionados: meds 
    });
  };

  const salvar = async () => {
    if (!editando.nomeCirurgia || !editando.cirurgiao) {
      alert("Preencha o nome da cirurgia e o cirurgião!");
      return;
    }

    // 1. Criamos uma cópia dos dados da tela
    const payload = { ...editando };

    // 2. Convertendo os objetos/arrays para o formato String JSON que o Prisma espera
    payload.recomendacoesJson = JSON.stringify(payload.recomendacoes || {});
    payload.prescricaoMedicamentos = JSON.stringify(payload.medicamentosSelecionados || []);

    // 3. Removemos os campos da interface que não existem no banco de dados
    delete payload.recomendacoes;
    delete payload.medicamentosSelecionados;
    delete payload.createdAt;
    delete payload.updatedAt;
    
    const method = payload.id ? "PUT" : "POST";
    const url = payload.id ? `/api/modelos-alta/${payload.id}` : "/api/modelos-alta";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Enviamos o payload limpo!
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errJson = JSON.parse(errorText);
          alert("Erro ao salvar: " + (errJson.error || "Erro desconhecido"));
        } catch {
          console.error("Erro do servidor (HTML):", errorText);
          alert(`Erro no servidor ao salvar. Verifique o console.`);
        }
        return;
      }

      setEditando(null);
      carregar(); // Recarrega a lista
    } catch (error) {
      console.error("Erro de conexão", error);
      alert("Erro de conexão ao tentar salvar.");
    }
  };
  const remover = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este modelo?")) return;
    try {
      await fetch(`/api/modelos-alta/${id}`, { method: "DELETE" });
      carregar();
    } catch (error) {
      console.error("Erro ao remover", error);
    }
  };

  const copiarModelo = (m: any) => {
    const texto = gerarDocumentoAlta(m);
    navigator.clipboard.writeText(texto);
    setCopiado(m.id);
    setTimeout(() => setCopiado(null), 2000);
  };

  // Agrupa por especialidade
  const porEspecialidade = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    modelos.forEach((m: any) => {
      const esp = m.especialidade || "Geral";
      if (!grupos[esp]) grupos[esp] = [];
      grupos[esp].push(m);
    });
    return grupos;
  }, [modelos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Modelos de Alta</h1>
          <p className="text-sm text-slate-500">Modelos pré-definidos por cirurgião e tipo de cirurgia</p>
        </div>
        <button onClick={novoModelo} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Novo modelo
        </button>
      </div>

      {Object.keys(porEspecialidade).length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
          <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">Nenhum modelo cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(porEspecialidade).map(([esp, modelosEsp]) => {
            const key = `esp-${esp}`;
            return (
              <div key={esp} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpandido((e) => ({ ...e, [key]: !e[key] }))}
                  className="w-full flex items-center gap-2 px-5 py-4 hover:bg-slate-50"
                >
                  {expandido[key] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span className="font-semibold text-slate-800 text-sm">{esp}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{modelosEsp.length}</span>
                </button>
                {expandido[key] && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {modelosEsp.map((m) => (
                      <div key={m.id} className="px-5 py-4 group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 text-sm">{m.nomeCirurgia}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Cirurgião: {m.cirurgiao}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => copiarModelo(m)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200">
                              {copiado === m.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiado === m.id ? "Copiado" : "Copiar"}
                            </button>
                            <button onClick={() => editar(m)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700">
                              <Pencil className="w-3.5 h-3.5" /> Editar
                            </button>
                            <button onClick={() => remover(m.id)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 border border-red-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de edição */}
      {editando && (
        <ModeloEditor modelo={editando} setModelo={setEditando} onSave={salvar} onClose={() => setEditando(null)} />
      )}
    </div>
  );
}

// --- MODAL DE EDIÇÃO ---
function ModeloEditor({ modelo, setModelo, onSave, onClose }: any) {
  const set = (field: string, value: any) => setModelo((m: any) => ({ ...m, [field]: value }));
  const setRec = (field: string, value: any) => setModelo((m: any) => ({ ...m, recomendacoes: { ...m.recomendacoes, [field]: value } }));

  const rec = modelo.recomendacoes || {};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{modelo.id ? "Editar modelo" : "Novo modelo de alta"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Dados básicos */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome da cirurgia *">
              <input className={inputCls} value={modelo.nomeCirurgia} onChange={(e) => set("nomeCirurgia", e.target.value)} placeholder="Ex: Artroscopia de Joelho" />
            </Field>
            
            <Field label="Cirurgião *">
              <Select value={modelo.cirurgiao} onValueChange={(val) => {
                  set("cirurgiao", val);
                  set("especialidade", getEspecialidadePorCirurgiao(val));
              }}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {TODOS_CIRURGIOES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Recomendações (Booleans e pequenos textos) */}
          <Section title="Recomendações e Cuidados">
            <div className="space-y-4">
              <Toggle label="Paciente pode pisar?" value={rec.pode_pisar} onChange={(v) => setRec("pode_pisar", v)} />
              {rec.pode_pisar && (
                <Field label="Tipo de carga permitida">
                  <Select value={rec.carga_tipo || "total"} onValueChange={(v) => setRec("carga_tipo", v)}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Carga total</SelectItem>
                      <SelectItem value="parcial_andador">Parcial com andador</SelectItem>
                      <SelectItem value="parcial_muletas">Parcial com muletas</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Toggle label="Pode dobrar o joelho?" value={rec.pode_dobrar_joelho} onChange={(v) => setRec("pode_dobrar_joelho", v)} />
                <Toggle label="Pode sentar?" value={rec.pode_sentar} onChange={(v) => setRec("pode_sentar", v)} />
                <Toggle label="Pode trocar curativo em casa?" value={rec.pode_trocar_curativo} onChange={(v) => setRec("pode_trocar_curativo", v)} />
                <Toggle label="Retirar suturas no posto?" value={rec.pode_retirar_suturas} onChange={(v) => setRec("pode_retirar_suturas", v)} />
                <Toggle label="Pode deitar de lado?" value={rec.pode_deitar_lado} onChange={(v) => setRec("pode_deitar_lado", v)} />
                <Toggle label="Iniciar fisioterapia?" value={rec.pode_fisioterapia} onChange={(v) => setRec("pode_fisioterapia", v)} />
              </div>

              {rec.pode_fisioterapia && (
                <Field label="Recomendações para a Fisioterapia">
                  <textarea className={textareaCls} rows={2} value={rec.fisioterapia_recomendacoes} onChange={(e) => setRec("fisioterapia_recomendacoes", e.target.value)} placeholder="Protocolos específicos..." />
                </Field>
              )}
            </div>
          </Section>

          {/* Textos Livres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Como trocar o curativo">
              <textarea className={textareaCls} rows={4} value={modelo.comoTrocarCurativo} onChange={(e) => set("comoTrocarCurativo", e.target.value)} />
            </Section>
            <Section title="Sinais de Alarme (Ir ao PS)">
              <textarea className={textareaCls} rows={4} value={modelo.sinaisAlarme} onChange={(e) => set("sinaisAlarme", e.target.value)} />
            </Section>
          </div>

          {/* Retorno */}
          <Section title="Retorno Ambulatorial">
            <div className="grid sm:grid-cols-4 gap-4">
              <Field label="Dias">
                <input type="number" className={inputCls} value={modelo.retornoDias} onChange={(e) => set("retornoDias", Number(e.target.value))} />
              </Field>
              <Field label="Telefone">
                <input className={inputCls} value={modelo.retornoTelefone} onChange={(e) => set("retornoTelefone", e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Local / Endereço">
                  <input className={inputCls} value={modelo.retornoEndereco} onChange={(e) => set("retornoEndereco", e.target.value)} />
                </Field>
              </div>
            </div>
          </Section>

          {/* Prescrição Médica */}
          <Section title="Prescrição Médica">
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-2">Checklist Rápido (Medicações Frequentes):</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
                {MEDICAMENTOS_ALTA.map((med) => {
                  const medicamentos = modelo.medicamentosSelecionados || [];
                  const ativo = medicamentos.includes(med);
                  return (
                    <button
                      key={med} type="button"
                      onClick={() => set("medicamentosSelecionados", ativo ? medicamentos.filter((m: string) => m !== med) : [...medicamentos, med])}
                      className={`text-left text-[11px] p-2 rounded-md border flex gap-2 items-start transition-colors ${
                        ativo ? "bg-blue-50 border-blue-300 text-blue-800" : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                       <div className={`w-3.5 h-3.5 mt-0.5 rounded-sm border flex items-center justify-center shrink-0 ${ativo ? "bg-blue-500 border-blue-500" : "bg-white border-slate-300"}`}>
                        {ativo && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="leading-tight">{med}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <Field label="Prescrição Completa (Texto Livre que sairá no PDF)">
              <textarea className={textareaCls} rows={6} value={modelo.prescricaoTexto} onChange={(e) => set("prescricaoTexto", e.target.value)} />
            </Field>
          </Section>

          {/* Órtese */}
          <Section title="Órtese Pós-operatória">
            <div className="grid sm:grid-cols-2 gap-4 mb-3">
              <Field label="Tipo de Órtese">
                <Select value={modelo.orteseTipo || "Nenhuma"} onValueChange={(val) => set("orteseTipo", val)}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORTESE_OPCOES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              {modelo.orteseTipo === "Outra" && (
                <Field label="Qual?">
                  <input className={inputCls} value={rec.ortese_outra || ""} onChange={(e) => setRec("ortese_outra", e.target.value)} />
                </Field>
              )}
            </div>
            {modelo.orteseTipo !== "Nenhuma" && (
              <Field label="Como usar (Instruções)">
                <textarea className={textareaCls} rows={2} value={modelo.orteseInstrucoes || ""} onChange={(e) => set("orteseInstrucoes", e.target.value)} />
              </Field>
            )}
          </Section>

          {/* Documentos Legais */}
          <div className="grid md:grid-cols-2 gap-4">
            <Section title="Molde do Laudo Médico">
              <textarea className={textareaCls} rows={6} value={modelo.laudoTexto} onChange={(e) => set("laudoTexto", e.target.value)} />
            </Section>
            <Section title="Molde do Atestado Médico">
              <textarea className={textareaCls} rows={6} value={modelo.atestadoTexto} onChange={(e) => set("atestadoTexto", e.target.value)} />
            </Section>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200">Cancelar</button>
          <button onClick={onSave} disabled={!modelo.nomeCirurgia || !modelo.cirurgiao} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" /> Salvar Modelo
          </button>
        </div>
      </div>
    </div>
  );
}

// --- FUNÇÕES UTILITÁRIAS E COMPONENTES MENORES ---

function gerarDocumentoAlta(m: any) {
  const rec = m.recomendacoes || {};
  let doc = `MODELO DE ALTA — ${m.nomeCirurgia}\nCirurgião: ${m.cirurgiao}\n\n`;
  doc += `RECOMENDAÇÕES:\n`;
  doc += `- Pode pisar: ${rec.pode_pisar ? "Sim" : "Não"}${rec.pode_pisar ? ` (${cargaLabel(rec.carga_tipo)})` : ""}\n`;
  doc += `- Pode dobrar o joelho: ${rec.pode_dobrar_joelho ? "Sim" : "Não"}\n`;
  doc += `- Pode sentar: ${rec.pode_sentar ? "Sim" : "Não"}\n`;
  doc += `- Pode trocar o curativo: ${rec.pode_trocar_curativo ? "Sim" : "Não"}\n`;
  doc += `- Pode retirar suturas com 15d no posto: ${rec.pode_retirar_suturas ? "Sim" : "Não (remover no retorno com cirurgião)"}\n`;
  doc += `- Pode deitar de lado: ${rec.pode_deitar_lado ? "Sim" : "Não"}\n`;
  doc += `- Pode fazer fisioterapia: ${rec.pode_fisioterapia ? "Sim" : "Não"}\n`;
  if (rec.fisioterapia_recomendacoes) doc += `  Fisioterapia: ${rec.fisioterapia_recomendacoes}\n`;
  if (m.orteseTipo && m.orteseTipo !== "Nenhuma") {
    doc += `- Órtese: ${m.orteseTipo}${rec.ortese_outra ? ` (${rec.ortese_outra})` : ""}\n`;
    if (m.orteseInstrucoes) doc += `  Instruções: ${m.orteseInstrucoes}\n`;
  }
  doc += `\nCOMO TROCAR O CURATIVO:\n${m.comoTrocarCurativo}\n`;
  doc += `\nSINAIS DE ALARME:\n${m.sinaisAlarme}\n`;
  doc += `\nRETORNO: ${m.retornoDias} dias no ${m.retornoEndereco}. Agendar: ${m.retornoTelefone}.\n`;
  doc += `\n--- PRESCRIÇÃO ---\n${m.prescricaoTexto}\n`;
  return doc;
}

function cargaLabel(c: string) {
  return { total: "Carga total", parcial_andador: "Parcial com andador", parcial_muletas: "Parcial com muletas", nenhuma: "Sem carga" }[c] || "";
}

// Estilos padronizados
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const textareaCls = inputCls + " resize-none font-mono text-xs";

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      {/* O input nativo fica aqui, mas invisível */}
      <input 
        type="checkbox" 
        checked={!!value} // o !! garante que não seja undefined
        onChange={(e) => onChange(e.target.checked)} 
        className="sr-only" 
      />
      
      {/* A nossa caixinha visual customizada */}
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${value ? "bg-red-500 border-red-500" : "bg-white border-slate-300 group-hover:border-slate-400"}`}>
        {value && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      
      <span className="text-sm text-slate-700 select-none">{label}</span>
    </label>
  );
}