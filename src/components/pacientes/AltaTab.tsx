"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Pill,
  Stethoscope,
  Activity,
  Download,
  Loader2,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Ajuste o caminho se necessário

// IMPORTANTE: Ajuste o caminho dos seus componentes de página de impressão
import {
  PAGE_STYLE,
  CartaoRetornoPage,
  PrescricaoPage,
  OrientacoesPage,
  ReceitaControlePage,
  FisioterapiaPage,
  LaudoPage,
  AtestadoAcompanhantePage,
  RelatorioINSSPage,
} from "@/components/alta/AltaPages";

const MEDS_PADRAO = [
  "Dipirona 1g — 1 cp de 6/6h se dor — via oral",
  "Paracetamol 750mg — 1 cp de 6/6h se dor (alergia à dipirona) — via oral",
  "Paco 500mg+30mg — 1 cp de 8/8h se dor refratária — via oral",
  "Tramadol 50mg — 1 cp de 8/8h se dor refratária — via oral",
  "Rivaroxabana 10mg — 1 cp 1x/dia por 15 dias — via oral",
  "Rivaroxabana 10mg — 1 cp 1x/dia por 30 dias — via oral",
  "Enoxaparina 40mg — 1x/dia SC — via subcutânea",
  "Cefadroxila 500mg — 1 cp de 12/12h por 7 dias — via oral",
  "Cefalexina 500mg — 1 cp de 6/6h por 10 dias — via oral",
  "Pantoprazol 20mg — 1 cp pela manhã por 30 dias — via oral",
  "Tamarine geléia — 1 colher 1x/dia se constipação — via oral",
  "Noripurum Fólico — 1 cp 2x/dia por 30 dias — via oral",
];

const MEDS_CONTROLE = [
  "cefadroxila",
  "cefalexina",
  "amoxicilina",
  "azitromicina",
  "ciprofloxacino",
  "levofloxacino",
  "clindamicina",
  "sulfametoxazol",
  "trimetoprima",
  "metronidazol",
  "penicilina",
  "vancomicina",
  "gentamicina",
  "tramadol",
  "codeína",
  "morfina",
  "oxicodona",
  "fentanil",
  "metadona",
  "diazepam",
  "clonazepam",
  "lorazepam",
  "noripurum",
];

const MEDS_RECEITA_SEPARADA = [
  "ecoxe",
  "etoricoxibe",
  "revange",
  "celecoxibe",
  "parecoxibe",
];

function isControle(texto: string) {
  const t = (texto || "").toLowerCase();
  return MEDS_CONTROLE.some((m) => t.includes(m));
}

function isReceitaSeparada(texto: string) {
  const t = (texto || "").toLowerCase();
  return MEDS_RECEITA_SEPARADA.some((m) => t.includes(m));
}

function calcQuantidade(texto: string) {
  const t = (texto || "").toLowerCase();
  const diasMatch = t.match(/por\s+(\d+)\s+dias?/);
  if (diasMatch) {
    const dias = parseInt(diasMatch[1]);
    let perDay = 1;
    const freqMatch = t.match(/(\d+)\/(\d+)h/);
    if (freqMatch) {
      perDay = Math.ceil(24 / parseInt(freqMatch[2]));
    } else if (
      t.includes("2x/dia") ||
      t.includes("2x ao dia") ||
      t.includes("2vezes")
    ) {
      perDay = 2;
    } else if (t.includes("3x/dia") || t.includes("3x ao dia")) {
      perDay = 3;
    }
    return `${dias * perDay} cp`;
  }
  return "1 caixa";
}

function gerarLaudo(cirurgia: any, paciente: any, evolucoes: any[] = []) {
  const ultimaEvolucao = evolucoes[0];
  const cirurgiaTexto = cirurgia?.nome_cirurgia || "procedimento cirúrgico";
  const dataCirurgia = cirurgia?.data_cirurgia
    ? ` em ${new Date(cirurgia.data_cirurgia).toLocaleDateString("pt-BR")}`
    : "";

  return `${paciente?.nome || "Paciente"} apresentou evolução clínica compatível com o procedimento realizado, permanecendo hemodinamicamente estável, afebril, com dor controlada por analgesia prescrita, aceitando dieta, com ferida operatória em boas condições, sem sinais de infecção ou outras complicações clínicas ou cirúrgicas durante a internação.\n\nFoi submetido(a) a ${cirurgiaTexto}${dataCirurgia}.${ultimaEvolucao?.textoGerado ? `\n\nÚltima evolução registrada:\n${ultimaEvolucao.textoGerado}` : ""}\n\nNo momento da avaliação, o(a) paciente apresenta condições clínicas compatíveis com a fase pós-operatória esperada para o procedimento realizado, encontrando-se em acompanhamento ambulatorial.`;
}

function gerarRelatorioINSS(
  cirurgia: any,
  paciente: any,
  evolucoes: any[] = [],
) {
  const ultimaEvolucao = evolucoes[0];
  const diagnostico =
    cirurgia?.diagnostico || paciente?.diagnostico || "não informado";
  const cid = cirurgia?.cid || paciente?.cid;
  const dataCirurgia = cirurgia?.data_cirurgia
    ? new Date(cirurgia.data_cirurgia).toLocaleDateString("pt-BR")
    : "não informada";
  const dataInternacao = paciente?.data_internacao
    ? new Date(paciente.data_internacao).toLocaleDateString("pt-BR")
    : "não informada";

  return `RELATÓRIO MÉDICO\n\nPaciente: ${paciente?.nome || "não informado"}\n\nDiagnóstico: ${diagnostico}${cid ? ` (CID-10: ${cid})` : ""}.\nData da internação: ${dataInternacao}.\nTratamento realizado: ${cirurgia?.nome_cirurgia || "procedimento cirúrgico"}, em ${dataCirurgia}.\n\nO(a) paciente encontra-se em acompanhamento médico após tratamento ortopédico, necessitando manter seguimento clínico e ambulatorial, conforme evolução e orientações da equipe assistente.\n\n${ultimaEvolucao?.textoGerado ? `Dados clínicos recentes:\n${ultimaEvolucao.textoGerado}\n\n` : ""}Este relatório foi elaborado com base nos registros disponíveis no prontuário.`;
}

async function carregarImagemComoDataUrl(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

async function aguardarImagens(element: HTMLElement) {
  await Promise.all(
    Array.from(element.querySelectorAll("img")).map(async (image) => {
      if (image.complete) {
        if (typeof image.decode === "function") {
          try {
            await image.decode();
          } catch {
            /* imagem opcional */
          }
        }
        return;
      }
      await new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value ?? fallback) as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizarModeloAlta(modelo: any) {
  const recomendacoesJson = parseJson<unknown>(modelo.recomendacoesJson, {});
  const medicamentosJson = parseJson<unknown>(
    modelo.prescricaoMedicamentos,
    [],
  );
  const recomendacoes =
    recomendacoesJson &&
    typeof recomendacoesJson === "object" &&
    !Array.isArray(recomendacoesJson)
      ? recomendacoesJson
      : {};
  const medicamentos = Array.isArray(medicamentosJson) ? medicamentosJson : [];

  return {
    ...modelo,
    ...recomendacoes,
    nome_cirurgia: modelo.nomeCirurgia,
    prescricao_medicamentos: medicamentos.filter(
      (med): med is string => typeof med === "string",
    ),
    trocar_curativo_como: modelo.comoTrocarCurativo,
    sinais_alarme: modelo.sinaisAlarme,
    retorno_dias: modelo.retornoDias,
    retorno_telefone: modelo.retornoTelefone,
    retorno_endereco: modelo.retornoEndereco,
    retorno_cep: modelo.retornoCep,
    ortese_tipo: modelo.orteseTipo,
    ortese_instrucoes: modelo.orteseInstrucoes,
  };
}

// Estilos padronizados dos inputs (Design System do seu projeto)
const inputCls =
  "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all";
const textareaCls = `${inputCls} resize-none`;

export default function AltaTab({
  paciente,
  cirurgias = [],
  evolucoes = [],
}: {
  paciente: any;
  cirurgias?: any[];
  evolucoes?: any[];
}) {
  const cirurgiasAlta = useMemo(
    () =>
      cirurgias.map((cirurgia) => ({
        ...cirurgia,
        nome_cirurgia: cirurgia.nome_cirurgia ?? cirurgia.nomeCirurgia,
        data_cirurgia: cirurgia.data_cirurgia ?? cirurgia.dataCirurgia,
      })),
    [cirurgias],
  );
  const pacienteAlta = {
    ...paciente,
    data_internacao: paciente.data_internacao ?? paciente.dataInternacao,
  };
  const [config, setConfig] = useState<any>(null);
  const [modelos, setModelos] = useState<any[]>([]);
  const [modeloId, setModeloId] = useState<string>("");
  const [cirurgiaId, setCirurgiaId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  const [meds, setMeds] = useState<any[]>([]);
  const [rxRetorno, setRxRetorno] = useState(true);
  const [rxQual, setRxQual] = useState("");
  const [fisioSessoes, setFisioSessoes] = useState(20);
  const [fisioIndicacao, setFisioIndicacao] = useState("");
  const [laudo, setLaudo] = useState("");
  const [relatorioINSS, setRelatorioINSS] = useState("");
  const [gerandoINSS, setGerandoINSS] = useState(false);
  const [diasAfastamento, setDiasAfastamento] = useState(90);
  const [exames, setExames] = useState<any[]>([]);
  const [novoMed, setNovoMed] = useState("");

  const [docFlags, setDocFlags] = useState({
    cartao: true,
    prescricao: true,
    orientacoes: true,
    receitas_especiais: true,
    fisioterapia: true,
    laudo: false,
    acompanhante: false,
    relatorio_inss: false,
  });

  const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const cirurgia =
    cirurgiasAlta.find((c) => c.id === cirurgiaId) || cirurgiasAlta[0];
  const hoje = new Date().toLocaleDateString("pt-BR");
  const modelo = modelos.find((m) => m.id === modeloId);

  const medsEspeciais = meds.filter((m) => m.controle || m.receita_separada);
  const medsPrincipais = meds.filter((m) => !m.controle && !m.receita_separada);

  const aplicarModelo = (modeloAlta: any) => {
    setModeloId(modeloAlta.id);
    setMeds(
      modeloAlta.prescricao_medicamentos.map((texto: string, idx: number) => ({
        texto,
        controle: isControle(texto),
        receita_separada: isReceitaSeparada(texto),
        quantidade: calcQuantidade(texto),
        alternativa: idx === 1 && texto.toLowerCase().includes("alergia"),
      })),
    );
    setFisioIndicacao(
      modeloAlta.pode_fisioterapia
        ? modeloAlta.fisioterapia_recomendacoes || ""
        : "",
    );
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Substituindo o Promise.all do Supabase pelas rotas da API local
        const [resConfig, resModelos, resExames] = await Promise.all([
          fetch("/api/configuracoes").then((res) => res.json()),
          fetch("/api/modelos-alta").then((res) => res.json()),
          fetch(`/api/pacientes/${paciente.id}/exames-imagem`).then((res) =>
            res.json(),
          ),
        ]);

        const mods = Array.isArray(resModelos)
          ? resModelos.map(normalizarModeloAlta)
          : [];

        const configAtual = resConfig || {};
        const logoBase64 = configAtual.hospitalLogotipoUrl
          ? await carregarImagemComoDataUrl(configAtual.hospitalLogotipoUrl)
          : undefined;
        setConfig({ ...configAtual, hospitalLogotipoBase64: logoBase64 });
        setModelos(mods);

        // Filtra os exames que possuem laudo (conforme sua lógica original)
        const examesComLaudo = (resExames || []).filter((e: any) => e.laudo);
        setExames(examesComLaudo);

        const cir0 = cirurgiasAlta[0];
        if (cirurgiasAlta.length > 0) setCirurgiaId(cirurgiasAlta[0].id);

        const match = cir0
          ? mods.find(
              (m: any) =>
                m.nome_cirurgia === cir0.nome_cirurgia &&
                m.cirurgiao === cir0.cirurgiao,
            ) ||
            mods.find((m: any) => m.nome_cirurgia === cir0.nome_cirurgia) ||
            mods.find((m: any) => m.cirurgiao === cir0?.cirurgiao)
          : null;

        if (match) {
          aplicarModelo(match);
        }
        setLaudo(gerarLaudo(cir0, pacienteAlta, evolucoes));
        setRelatorioINSS(gerarRelatorioINSS(cir0, pacienteAlta, evolucoes));
      } catch (error) {
        console.error("Erro ao carregar dados da alta:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [paciente.id, cirurgiasAlta, evolucoes]);

  const onCirurgiaChange = (id: string) => {
    setCirurgiaId(id);
    const cir = cirurgiasAlta.find((c) => c.id === id);
    if (!cir) return;
    setLaudo(gerarLaudo(cir, pacienteAlta, evolucoes));
    setRelatorioINSS(gerarRelatorioINSS(cir, pacienteAlta, evolucoes));

    const match =
      modelos.find(
        (m) =>
          m.nome_cirurgia === cir.nome_cirurgia &&
          m.cirurgiao === cir.cirurgiao,
      ) ||
      modelos.find((m) => m.nome_cirurgia === cir.nome_cirurgia) ||
      modelos.find((m) => m.cirurgiao === cir.cirurgiao);

    if (match) {
      aplicarModelo(match);
    }
  };

  const onModeloChange = (id: string) => {
    setModeloId(id);
    const m = modelos.find((x) => x.id === id);
    if (!m) return;
    aplicarModelo(m);
  };

  // Funções de controle dos medicamentos
  const addMed = (texto: string) => {
    if (!texto.trim()) return;
    setMeds((prev) => [
      ...prev,
      {
        texto: texto.trim(),
        controle: isControle(texto),
        receita_separada: isReceitaSeparada(texto),
        quantidade: calcQuantidade(texto),
        alternativa: false,
      },
    ]);
    setNovoMed("");
  };
  const removeMed = (idx: number) =>
    setMeds((prev) => prev.filter((_, i) => i !== idx));
  const editMed = (idx: number, texto: string) =>
    setMeds((prev) =>
      prev.map((m, i) =>
        i === idx
          ? {
              ...m,
              texto,
              controle: isControle(texto),
              receita_separada: isReceitaSeparada(texto),
            }
          : m,
      ),
    );
  const toggleControle = (idx: number) =>
    setMeds((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, controle: !m.controle } : m)),
    );
  const toggleReceitaSeparada = (idx: number) =>
    setMeds((prev) =>
      prev.map((m, i) =>
        i === idx ? { ...m, receita_separada: !m.receita_separada } : m,
      ),
    );
  const editQuantidade = (idx: number, q: string) =>
    setMeds((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, quantidade: q } : m)),
    );
  const toggleAlternativa = (idx: number) =>
    setMeds((prev) =>
      prev.map((m, i) =>
        i === idx ? { ...m, alternativa: !m.alternativa } : m,
      ),
    );

  const gerarPDF = async () => {
    setGerando(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const orderedKeys = [
        "cartao",
        "prescricao",
        "orientacoes",
        "receitas_especiais",
        "fisioterapia",
        "laudo",
        "acompanhante",
        "relatorio_inss",
      ];
      const activeKeys = orderedKeys.filter((k) => {
        if (!docFlags[k as keyof typeof docFlags]) return false;
        if (k === "orientacoes") return !!modelo;
        if (k === "receitas_especiais") return medsEspeciais.length > 0;
        if (k === "fisioterapia") return !!modelo?.pode_fisioterapia;
        return true;
      });

      const expandedKeys = activeKeys.flatMap((k) =>
        k === "receitas_especiais"
          ? medsEspeciais.flatMap((_, idx) => [
              `receita_especial_${idx}_1`,
              `receita_especial_${idx}_2`,
            ])
          : [k],
      );

      let first = true;
      for (const key of expandedKeys) {
        const el = pageRefs.current[key];
        if (!el) continue;
        await aguardarImagens(el);
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const imgData = canvas.toDataURL("image/png");
        if (!first) pdf.addPage();

        let imgWidth = pdfWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;
        if (imgHeight > pdfHeight) {
          const ratio = pdfHeight / imgHeight;
          imgWidth *= ratio;
          imgHeight = pdfHeight;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        first = false;
      }
      pdf.save(`alta_${paciente.nome?.replace(/\s+/g, "_") || "paciente"}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setGerando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Alergia */}
      {(paciente.temAlergia || paciente.alergias) && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-bold text-red-700">
              ALERTA DE ALERGIA
            </span>
          </div>
          <p className="text-sm text-red-600">
            Verificar antes de emitir prescrição:{" "}
            <span className="font-semibold">
              {paciente.alergias || "Alergia não especificada"}
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Seleção de Cirurgia e Modelo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                🩺 Dados do Procedimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cirurgiasAlta.length > 1 && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">
                    Cirurgia para esta alta
                  </label>
                  <select
                    className={inputCls}
                    value={cirurgiaId || ""}
                    onChange={(e) => onCirurgiaChange(e.target.value)}
                  >
                    {cirurgiasAlta.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome_cirurgia}{" "}
                        {c.lateralidade && c.lateralidade !== "nao_aplicavel"
                          ? `(${c.lateralidade})`
                          : ""}{" "}
                        — {c.cirurgiao || "Sem cirurgião"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">
                  Modelo do cirurgião
                </label>
                <select
                  className={inputCls}
                  value={modeloId || ""}
                  onChange={(e) => onModeloChange(e.target.value)}
                >
                  <option value="">Selecione um modelo...</option>
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome_cirurgia} — {m.cirurgiao}
                    </option>
                  ))}
                </select>
              </div>

              {modelo && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 grid grid-cols-2 gap-2">
                  <span>
                    <strong>Pode pisar:</strong>{" "}
                    {modelo.pode_pisar ? "Sim" : "Não"}
                  </span>
                  <span>
                    <strong>Fisioterapia:</strong>{" "}
                    {modelo.pode_fisioterapia ? "Sim" : "Não"}
                  </span>
                  <span>
                    <strong>Retorno:</strong> {modelo.retorno_dias || 30} dias
                  </span>
                  {modelo.ortese_tipo &&
                    modelo.ortese_tipo.toLowerCase() !== "nenhuma" && (
                      <span>
                        <strong>Órtese:</strong> {modelo.ortese_tipo}
                      </span>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* RX no retorno */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rxRetorno}
                  onChange={(e) => setRxRetorno(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Realizar radiografias no retorno
                </span>
              </label>
              {rxRetorno && (
                <input
                  className={inputCls}
                  value={rxQual || ""}
                  onChange={(e) => setRxQual(e.target.value)}
                  placeholder="Quais RX? Ex: AP de bacia + perfil de quadril"
                />
              )}
            </CardContent>
          </Card>

          {/* Fisioterapia */}
          {modelo?.pode_fisioterapia && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> Solicitação de
                  Fisioterapia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Sessões
                  </label>
                  <input
                    type="number"
                    className={`${inputCls} w-24`}
                    value={fisioSessoes || ""}
                    onChange={(e) => setFisioSessoes(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Indicação (IC)
                  </label>
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={fisioIndicacao || ""}
                    onChange={(e) => setFisioIndicacao(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Prescrição */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-500" /> Prescrição (Editável)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {meds.map((med, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        className={inputCls}
                        value={med.texto || ""}
                        onChange={(e) => editMed(i, e.target.value)}
                        placeholder="Medicamento — posologia — via"
                      />
                      <button
                        onClick={() => removeMed(i)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        value={med.quantidade || ""}
                        onChange={(e) => editQuantidade(i, e.target.value)}
                        placeholder="Qtde"
                      />
                      <button
                        onClick={() => toggleControle(i)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${med.controle ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                        title="Receita de controle especial"
                      >
                        RC
                      </button>
                      <button
                        onClick={() => toggleReceitaSeparada(i)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${med.receita_separada ? "bg-purple-100 border-purple-300 text-purple-800" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                        title="Receita separada (2 vias)"
                      >
                        RS
                      </button>
                      <button
                        onClick={() => toggleAlternativa(i)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${med.alternativa ? "bg-blue-100 border-blue-300 text-blue-800" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                        title="Alternativa (OU)"
                      >
                        OU
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <details className="group">
                <summary className="text-xs font-medium text-blue-600 cursor-pointer hover:text-blue-700 list-none flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar medicação padrão
                </summary>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MEDS_PADRAO.filter(
                    (m) => !meds.some((x) => x.texto === m),
                  ).map((m) => (
                    <button
                      key={m}
                      onClick={() => addMed(m)}
                      className="text-left text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition-colors truncate"
                    >
                      {m.split(" — ")[0]}
                    </button>
                  ))}
                </div>
              </details>

              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={novoMed || ""}
                  onChange={(e) => setNovoMed(e.target.value)}
                  placeholder="Adicionar medicação personalizada..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMed(novoMed);
                    }
                  }}
                />
                <button
                  onClick={() => addMed(novoMed)}
                  className="px-4 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {medsEspeciais.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">
                      Receituários especiais automáticos ({medsEspeciais.length}
                      )
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medsEspeciais.map((m, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold border ${m.receita_separada ? "bg-purple-100 border-purple-200 text-purple-800" : "bg-amber-100 border-amber-200 text-amber-800"}`}
                      >
                        {m.receita_separada ? "RS" : "RC"} ·{" "}
                        {m.texto.split(" — ")[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Laudo Médico */}
      <Card>
        <CardContent className="pt-6">
          <label className="flex items-center gap-2.5 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={docFlags.laudo}
              onChange={(e) =>
                setDocFlags((prev) => ({ ...prev, laudo: e.target.checked }))
              }
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-500" /> Incluir Laudo
              Médico
            </span>
          </label>

          {docFlags.laudo && (
            <div className="space-y-4 ml-7 pl-4 border-l-2 border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Dias de afastamento
                </label>
                <input
                  type="number"
                  className={`${inputCls} w-32`}
                  value={diasAfastamento || ""}
                  onChange={(e) => setDiasAfastamento(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Evolução pós-operatória (editável)
                </label>
                <textarea
                  className={textareaCls}
                  rows={5}
                  value={laudo || ""}
                  onChange={(e) => setLaudo(e.target.value)}
                />
              </div>

              {exames.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-bold text-blue-800 mb-2">
                    Exames com laudo no prontuário:
                  </p>
                  {exames.map((ex, i) => (
                    <div key={i} className="text-xs text-blue-900 mt-1">
                      <strong>
                        {ex.tipo_exame} — {ex.sitio}
                      </strong>
                      : {ex.laudo?.slice(0, 100)}
                      {ex.laudo?.length > 100 ? "..." : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relatório previdenciário */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Relatório para fins previdenciários (INSS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">
            Texto inicial baseado no diagnóstico, cirurgia e última evolução.
            Revise antes de emitir.
          </p>
          <textarea
            className={textareaCls}
            rows={8}
            value={relatorioINSS}
            onChange={(e) => setRelatorioINSS(e.target.value)}
          />
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={docFlags.relatorio_inss}
                onChange={(e) =>
                  setDocFlags((prev) => ({
                    ...prev,
                    relatorio_inss: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Incluir relatório INSS no PDF completo
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Geração de Documentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            📄 Documentos no PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { key: "cartao", label: "Cartão de retorno" },
              { key: "prescricao", label: "Prescrição" },
              { key: "orientacoes", label: "Orientações de alta" },
              {
                key: "receitas_especiais",
                label: `Receitas Especiais (${medsEspeciais.length})`,
              },
              { key: "fisioterapia", label: "Fisioterapia" },
              { key: "laudo", label: "Laudo médico" },
              { key: "acompanhante", label: "Atest. Acompanhante" },
              { key: "relatorio_inss", label: "Relatório INSS" },
            ].map((d) => {
              const disabled =
                (d.key === "receitas_especiais" &&
                  medsEspeciais.length === 0) ||
                (d.key === "fisioterapia" && !modelo?.pode_fisioterapia) ||
                (d.key === "orientacoes" && !modelo);
              return (
                <label
                  key={d.key}
                  className={`flex items-center gap-2 ${disabled ? "opacity-40" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    checked={
                      docFlags[d.key as keyof typeof docFlags] && !disabled
                    }
                    onChange={(e) =>
                      setDocFlags((prev) => ({
                        ...prev,
                        [d.key]: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    disabled={disabled}
                  />
                  <span className="text-sm text-slate-600">{d.label}</span>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={gerarPDF}
              disabled={gerando}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {gerando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {gerando ? "Gerando PDF Completo..." : "Gerar Alta Completa"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Páginas ocultas para renderização do PDF */}
      {/* ATENÇÃO: Você precisa ter esses componentes criados no seu projeto para essa div funcionar */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div
          ref={(el) => {
            if (el) pageRefs.current.cartao = el;
          }}
          style={PAGE_STYLE}
        >
          <CartaoRetornoPage
            config={config}
            paciente={pacienteAlta}
            cirurgia={cirurgia}
            modelo={modelo}
            rxRetorno={rxRetorno}
            rxQual={rxQual}
            data={hoje}
          />
        </div>
        <div
          ref={(el) => {
            if (el) pageRefs.current.prescricao = el;
          }}
          style={PAGE_STYLE}
        >
          <PrescricaoPage
            config={config}
            paciente={pacienteAlta}
            cirurgia={cirurgia}
            meds={medsPrincipais}
            data={hoje}
          />
        </div>
        {modelo && (
          <div
            ref={(el) => {
              if (el) pageRefs.current.orientacoes = el;
            }}
            style={PAGE_STYLE}
          >
            <OrientacoesPage
              config={config}
              paciente={pacienteAlta}
              cirurgia={cirurgia}
              modelo={modelo}
              data={hoje}
            />
          </div>
        )}
        {medsEspeciais.map((med, idx) => (
          <React.Fragment key={`re_${idx}`}>
            <div
              ref={(el) => {
                if (el) pageRefs.current[`receita_especial_${idx}_1`] = el;
              }}
              style={PAGE_STYLE}
            >
              <ReceitaControlePage
                config={config}
                paciente={pacienteAlta}
                cirurgia={cirurgia}
                medsControle={[med]}
                data={hoje}
                via={1}
              />
            </div>
            <div
              ref={(el) => {
                if (el) pageRefs.current[`receita_especial_${idx}_2`] = el;
              }}
              style={PAGE_STYLE}
            >
              <ReceitaControlePage
                config={config}
                paciente={pacienteAlta}
                cirurgia={cirurgia}
                medsControle={[med]}
                data={hoje}
                via={2}
              />
            </div>
          </React.Fragment>
        ))}
        {modelo?.pode_fisioterapia && (
          <div
            ref={(el) => {
              if (el) pageRefs.current.fisioterapia = el;
            }}
            style={PAGE_STYLE}
          >
            <FisioterapiaPage
              config={config}
              paciente={pacienteAlta}
              cirurgia={cirurgia}
              sessoes={fisioSessoes}
              indicacao={fisioIndicacao}
              data={hoje}
            />
          </div>
        )}
        <div
          ref={(el) => {
            if (el) pageRefs.current.laudo = el;
          }}
          style={PAGE_STYLE}
        >
          <LaudoPage
            config={config}
            paciente={pacienteAlta}
            cirurgia={cirurgia}
            laudo={laudo}
            diasAfastamento={diasAfastamento}
            data={hoje}
          />
        </div>
        <div
          ref={(el) => {
            if (el) pageRefs.current.acompanhante = el;
          }}
          style={PAGE_STYLE}
        >
          <AtestadoAcompanhantePage
            config={config}
            paciente={pacienteAlta}
            cirurgia={cirurgia}
            data={hoje}
          />
        </div>
        {docFlags.relatorio_inss && relatorioINSS && (
          <div
            ref={(el) => {
              if (el) pageRefs.current.relatorio_inss = el;
            }}
            style={PAGE_STYLE}
          >
            <RelatorioINSSPage
              config={config}
              paciente={pacienteAlta}
              cirurgia={cirurgia}
              relatorio={relatorioINSS}
              data={hoje}
            />
          </div>
        )}
      </div>
    </div>
  );
}
