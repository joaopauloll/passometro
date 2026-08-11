"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { gerarTextoEvolucao, gerarPendencias } from "@/lib/evolucao";
import type { EvolucaoFormData } from "@/types";

type TriOption = "sim" | "nao" | null;
function tri(v: TriOption): boolean | undefined {
  if (v === "sim") return true;
  if (v === "nao") return false;
  return undefined;
}
function fromBool(v: boolean | null | undefined): TriOption {
  if (v === true) return "sim";
  if (v === false) return "nao";
  return null;
}

function TriSwitch({
  label,
  value,
  onChange,
  simLabel = "Sim",
  naoLabel = "Não",
  className = "",
}: {
  label: string;
  value: TriOption;
  onChange: (v: TriOption) => void;
  simLabel?: string;
  naoLabel?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(value === "sim" ? null : "sim")}
          className={`px-3 py-1.5 transition-colors ${value === "sim" ? "bg-green-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
        >
          {simLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(value === "nao" ? null : "nao")}
          className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${value === "nao" ? "bg-red-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
        >
          {naoLabel}
        </button>
      </div>
    </div>
  );
}

type Props = {
  pacienteId: string;
  evolucaoId?: string; // when set, enables edit mode (PUT instead of POST)
  isPosOperatorio: boolean;
  idadePaciente?: number | null;
  nomePaciente: string;
};

export default function EvolucaoForm({
  pacienteId,
  evolucaoId,
  isPosOperatorio,
  idadePaciente,
  nomePaciente,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [textoPreview, setTextoPreview] = useState("");

  // Estado geral
  const [estavel, setEstavel] = useState<TriOption>(null);
  const [febre, setFebre] = useState<TriOption>(null);
  const [semDor, setSemDor] = useState<TriOption>(null);
  const [dorControlada, setDorControlada] = useState<TriOption>(null);

  // Eliminações
  const [diurese, setDiurese] = useState<"espontanea" | "svd" | "anurico" | "">(
    "",
  );
  const [ultimaEvacuacao, setUltimaEvacuacao] = useState("");

  // Exame físico
  const [perfusao, setPerfusao] = useState<TriOption>(null);
  const [sensibilidade, setSensibilidade] = useState<TriOption>(null);
  const [movimento, setMovimento] = useState<TriOption>(null);

  // Imobilização
  const [usaGesso, setUsaGesso] = useState<TriOption>(null);
  const [qualGesso, setQualGesso] = useState("");

  // Curativo
  const [possuiCurativo, setPossuiCurativo] = useState<TriOption>(null);
  const [curativoLimpo, setCurativoLimpo] = useState<TriOption>(null);
  const [secInfecciosa, setSecInfecciosa] = useState<TriOption>(null);
  const [secSanguinolenta, setSecSanguinolenta] = useState<TriOption>(null);
  const [curativoLocal, setCurativoLocal] = useState("");
  const [curativoLateralidade, setCurativoLateralidade] = useState<
    "direita" | "esquerda" | "bilateral" | ""
  >("");

  // Pós-op
  const [rxRealizado, setRxRealizado] = useState<TriOption>(null);
  const [rxSatisfatorio, setRxSatisfatorio] = useState<TriOption>(null);
  const [rxEnviado, setRxEnviado] = useState<TriOption>(null);

  // Reabilitação pós-op
  const [sentou, setSentou] = useState<TriOption>(null);
  const [iniciouFisioterapia, setIniciouFisioterapia] =
    useState<TriOption>(null);
  const [dreno, setDreno] = useState<TriOption>(null);
  const [drenoCm3, setDrenoCm3] = useState("");
  const [drenoAspecto, setDrenoAspecto] = useState("");

  // Imobilização (checkboxes)
  const IMOB_TIPOS = [
    "gesso",
    "tala",
    "tipoia",
    "tração transesquelética",
    "robofoot",
    "brace",
    "outros",
  ] as const;
  const [imobTipos, setImobTipos] = useState<string[]>([]);
  const [imobLateralidade, setImobLateralidade] = useState<
    "direita" | "esquerda" | "bilateral" | ""
  >("");
  const [imobOutros, setImobOutros] = useState("");

  function toggleImob(tipo: string) {
    setImobTipos((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    );
  }

  // Neurológico pós-op (item 4)
  const [deficitPrevio, setDeficitPrevio] = useState<TriOption>(null);
  const [movPosOp, setMovPosOp] = useState<TriOption>(null);
  const [sensPosOp, setSensPosOp] = useState<TriOption>(null);
  const [deficitNeurol, setDeficitNeurol] = useState<
    "melhorou" | "igual" | "piorou" | ""
  >("");

  // Cardio (≥55 anos)
  const [cardioPendente, setCardioPendente] = useState<TriOption>(null);
  const [cardiologistaLiberou, setCardiologistaLiberou] =
    useState<TriOption>(null);
  const [solicitouEco, setSolicitouEco] = useState<TriOption>(null);
  const [ecoReady, setEcoReady] = useState<TriOption>(null);
  const [necessitaUTI, setNecessitaUTI] = useState<TriOption>(null);

  // Laboratórios
  const [hemoglobina, setHemoglobina] = useState("");
  const [plaquetas, setPlaquetas] = useState("");
  const [inr, setInr] = useState("");

  // Infecção ortopédica (item 6)
  const [leucocitos, setLeucocitos] = useState("");
  const [pcr, setPcr] = useState("");
  const [vhs, setVhs] = useState("");
  const [creatinina, setCreatinina] = useState("");
  const [ureia, setUreia] = useState("");
  const [culturasSolicitadas, setCulturasSolicitadas] =
    useState<TriOption>(null);
  const [culturasResultado, setCulturasResultado] = useState<TriOption>(null);
  const [infectAvaliado, setInfectAvaliado] = useState<TriOption>(null);
  const [nomeInfectologista, setNomeInfectologista] = useState("");
  const [antibioticoAtual, setAntibioticoAtual] = useState("");
  const [diaTratamento, setDiaTratamento] = useState("");
  const [antibioticosPrevios, setAntibioticosPrevios] = useState("");
  const [lavCirurgicaRealizada, setLavCirurgicaRealizada] =
    useState<TriOption>(null);
  const [qtdLavagens, setQtdLavagens] = useState("");
  const [retirouImplante, setRetirouImplante] = useState<TriOption>(null);

  // Outras lesões (item 5)
  type OutraLesaoLocal = { osso: string; lado: string; incidencias: string };
  const [temOutrasLesoes, setTemOutrasLesoes] = useState<TriOption>(null);
  const [outrasLesoes, setOutrasLesoes] = useState<OutraLesaoLocal[]>([
    { osso: "", lado: "", incidencias: "" },
  ]);

  function adicionarLesao() {
    setOutrasLesoes([...outrasLesoes, { osso: "", lado: "", incidencias: "" }]);
  }
  function atualizarLesao(
    idx: number,
    campo: keyof OutraLesaoLocal,
    valor: string,
  ) {
    const novas = outrasLesoes.map((l, i) =>
      i === idx ? { ...l, [campo]: valor } : l,
    );
    setOutrasLesoes(novas);
  }
  function removerLesao(idx: number) {
    setOutrasLesoes(outrasLesoes.filter((_, i) => i !== idx));
  }

  // Clínica médica
  const [acompClinico, setAcompClinico] = useState<TriOption>(null);
  const [nomeClinico, setNomeClinico] = useState("");

  // Alta
  const [altaPrevista, setAltaPrevista] = useState<TriOption>(null);
  const [altaHoje, setAltaHoje] = useState<TriOption>(null);
  const [chkReceita, setChkReceita] = useState(false);
  const [chkRelatorio, setChkRelatorio] = useState(false);
  const [chkOrientacoes, setChkOrientacoes] = useState(false);
  const [chkAtestado, setChkAtestado] = useState(false);
  const [chkRetorno, setChkRetorno] = useState(false);
  const [chkRX, setChkRX] = useState(false);

  // Observações
  const [observacoes, setObservacoes] = useState("");

  const getDados = useCallback(
    (): EvolucaoFormData => ({
      estavel: tri(estavel),
      febre: tri(febre),
      semDor: tri(semDor),
      dorControlada: tri(dorControlada),
      diurese: diurese || undefined,
      ultimaEvacuacao: ultimaEvacuacao || undefined,
      perfusaoPreservada: tri(perfusao),
      sensibilidadePreservada: tri(sensibilidade),
      movimentoPreservado: tri(movimento),
      usaGesso: tri(usaGesso),
      qualGesso: qualGesso || undefined,
      possuiCurativo: tri(possuiCurativo),
      curativoLimpo: tri(curativoLimpo),
      secrecaoInfecciosa: tri(secInfecciosa),
      secrecaoSanguinolenta: tri(secSanguinolenta),
      rxPosOpRealizado: tri(rxRealizado),
      rxSatisfatorio: tri(rxSatisfatorio),
      rxEnviadoCirurgiao: tri(rxEnviado),
      deficitPrevio: tri(deficitPrevio),
      movPosOp: tri(movPosOp),
      sensPosOp: tri(sensPosOp),
      deficitNeurol: deficitNeurol || undefined,
      cardioPendente: tri(cardioPendente),
      cardiologistaLiberou: tri(cardiologistaLiberou),
      solicitouEco: tri(solicitouEco),
      ecoReady: tri(ecoReady),
      necessitaUTI: tri(necessitaUTI),
      hemoglobina: hemoglobina ? parseFloat(hemoglobina) : null,
      plaquetas: plaquetas ? parseFloat(plaquetas) : null,
      inr: inr ? parseFloat(inr) : null,
      leucocitos: leucocitos ? parseFloat(leucocitos) : null,
      pcr: pcr ? parseFloat(pcr) : null,
      vhs: vhs ? parseFloat(vhs) : null,
      creatinina: creatinina ? parseFloat(creatinina) : null,
      ureia: ureia ? parseFloat(ureia) : null,
      culturasSolicitadas: tri(culturasSolicitadas),
      culturasResultado: tri(culturasResultado),
      infectAvaliado: tri(infectAvaliado),
      nomeInfectologista: nomeInfectologista || undefined,
      antibioticoAtual: antibioticoAtual || undefined,
      diaTratamento: diaTratamento ? parseInt(diaTratamento) : null,
      antibioticosPrevios: antibioticosPrevios || undefined,
      lavCirurgicaRealizada: tri(lavCirurgicaRealizada),
      qtdLavagens: qtdLavagens ? parseInt(qtdLavagens) : null,
      retirouImplante: tri(retirouImplante),
      outrasLesoes:
        temOutrasLesoes === "sim" ? outrasLesoes.filter((l) => l.osso) : [],
      acompClinico: tri(acompClinico),
      nomeClinico: nomeClinico || undefined,
      altaPrevista: tri(altaPrevista),
      altaHoje: tri(altaHoje),
      chkReceita,
      chkRelatorio,
      chkOrientacoes,
      chkAtestado,
      chkRetorno,
      chkRX,
      sentou: tri(sentou),
      iniciouFisioterapia: tri(iniciouFisioterapia),
      dreno: tri(dreno),
      drenoCm3: drenoCm3 ? parseFloat(drenoCm3) : null,
      drenoAspecto: drenoAspecto || undefined,
      observacoes: observacoes || undefined,
    }),
    [
      estavel,
      febre,
      semDor,
      dorControlada,
      diurese,
      ultimaEvacuacao,
      perfusao,
      sensibilidade,
      movimento,
      usaGesso,
      qualGesso,
      possuiCurativo,
      curativoLimpo,
      secInfecciosa,
      secSanguinolenta,
      rxRealizado,
      rxSatisfatorio,
      rxEnviado,
      deficitPrevio,
      movPosOp,
      sensPosOp,
      deficitNeurol,
      cardioPendente,
      cardiologistaLiberou,
      solicitouEco,
      ecoReady,
      necessitaUTI,
      hemoglobina,
      plaquetas,
      inr,
      leucocitos,
      pcr,
      vhs,
      creatinina,
      ureia,
      culturasSolicitadas,
      culturasResultado,
      infectAvaliado,
      nomeInfectologista,
      antibioticoAtual,
      diaTratamento,
      antibioticosPrevios,
      lavCirurgicaRealizada,
      qtdLavagens,
      retirouImplante,
      temOutrasLesoes,
      outrasLesoes,
      acompClinico,
      nomeClinico,
      altaPrevista,
      altaHoje,
      chkReceita,
      chkRelatorio,
      chkOrientacoes,
      chkAtestado,
      chkRetorno,
      chkRX,
      sentou,
      iniciouFisioterapia,
      dreno,
      drenoCm3,
      drenoAspecto,
      observacoes,
    ],
  );

  // Atualiza preview automaticamente
  useEffect(() => {
    const dados = getDados();
    const texto = gerarTextoEvolucao(
      dados,
      isPosOperatorio,
      idadePaciente ?? undefined,
    );
    setTextoPreview(texto);
  }, [getDados, isPosOperatorio, idadePaciente]);

  const pendenciasPreview = useCallback(() => {
    return gerarPendencias(
      getDados(),
      isPosOperatorio,
      idadePaciente ?? undefined,
    );
  }, [getDados, isPosOperatorio, idadePaciente]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const dados = getDados();
      const url = evolucaoId
        ? `/api/pacientes/${pacienteId}/evolucoes/${evolucaoId}`
        : `/api/pacientes/${pacienteId}/evolucoes`;
      const method = evolucaoId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!res.ok) throw new Error("Erro ao salvar evolução");

      toast.success(
        evolucaoId ? "Evolução atualizada!" : "Evolução registrada!",
      );
      router.push(`/pacientes/${pacienteId}`);
      router.refresh();
    } catch {
      toast.error("Erro ao registrar evolução");
    } finally {
      setLoading(false);
    }
  }

  const mostraCardio = idadePaciente != null && idadePaciente >= 55;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-3"
    >
      {/* Estado geral */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Estado Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-3">
          <TriSwitch
            label="Estável hemodinamicamente?"
            value={estavel}
            onChange={setEstavel}
          />
          <TriSwitch
            label="Febril?"
            value={febre}
            onChange={setFebre}
            simLabel="Sim"
            naoLabel="Afebril"
          />
          <TriSwitch label="Sem dor?" value={semDor} onChange={setSemDor} />
          {semDor !== "sim" && (
            <TriSwitch
              label="Dor controlada?"
              value={dorControlada}
              onChange={setDorControlada}
            />
          )}
        </CardContent>
      </Card>

      {/* Eliminações */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Eliminações
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Diurese</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "espontanea", label: "Espontânea" },
                { value: "svd", label: "SVD" },
                { value: "anurico", label: "Anúrico" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setDiurese(
                      diurese === opt.value
                        ? ""
                        : (opt.value as typeof diurese),
                    )
                  }
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    diurese === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evacuacao" className="text-sm">
              Última evacuação (ex: "há 2 dias")
            </Label>
            <Input
              id="evacuacao"
              value={ultimaEvacuacao}
              onChange={(e) => setUltimaEvacuacao(e.target.value)}
              placeholder="há 1 dia, hoje…"
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exame físico */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Exame Físico
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-3">
          <TriSwitch
            label="Perfusão distal preservada?"
            value={perfusao}
            onChange={setPerfusao}
          />
          <TriSwitch
            label="Sensibilidade preservada?"
            value={sensibilidade}
            onChange={setSensibilidade}
          />
          <TriSwitch
            label="Movimento preservado?"
            value={movimento}
            onChange={setMovimento}
          />
        </CardContent>
      </Card>

      {/* Imobilização */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Imobilização
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-3">
          <div>
            <p className="text-sm text-gray-700 mb-2">
              Tipo(s) de imobilização:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  "gesso",
                  "tala",
                  "tipoia",
                  "tração transesquelética",
                  "robofoot",
                  "brace",
                  "outros",
                ] as const
              ).map((tipo) => (
                <label
                  key={tipo}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={imobTipos.includes(tipo)}
                    onChange={() => toggleImob(tipo)}
                    className="accent-blue-600 h-4 w-4"
                  />
                  <span className="text-sm capitalize">{tipo}</span>
                </label>
              ))}
            </div>
          </div>
          {imobTipos.includes("gesso") && (
            <div className="space-y-1.5">
              <Label className="text-sm">Qual gesso?</Label>
              <Input
                value={qualGesso}
                onChange={(e) => setQualGesso(e.target.value)}
                placeholder="Ex: Gessado coxopodálico…"
              />
            </div>
          )}
          {imobTipos.includes("outros") && (
            <div className="space-y-1.5">
              <Label className="text-sm">Descrever outro tipo</Label>
              <Input
                value={imobOutros}
                onChange={(e) => setImobOutros(e.target.value)}
                placeholder="Descrever…"
              />
            </div>
          )}
          {imobTipos.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm">Lateralidade</Label>
              <div className="flex gap-3">
                {(["direita", "esquerda", "bilateral"] as const).map((lat) => (
                  <label
                    key={lat}
                    className="flex items-center gap-1.5 cursor-pointer text-sm"
                  >
                    <input
                      type="radio"
                      name="imobLat"
                      value={lat}
                      checked={imobLateralidade === lat}
                      onChange={() => setImobLateralidade(lat)}
                      className="accent-blue-600"
                    />
                    {lat.charAt(0).toUpperCase() + lat.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Curativo */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Curativo
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-3">
          <TriSwitch
            label="Possui curativo?"
            value={possuiCurativo}
            onChange={setPossuiCurativo}
          />
          {possuiCurativo === "sim" && (
            <>
              <TriSwitch
                label="Curativo limpo?"
                value={curativoLimpo}
                onChange={setCurativoLimpo}
              />
              <TriSwitch
                label="Secreção infecciosa?"
                value={secInfecciosa}
                onChange={setSecInfecciosa}
              />
              <TriSwitch
                label="Secreção sanguinolenta?"
                value={secSanguinolenta}
                onChange={setSecSanguinolenta}
              />
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Local do curativo</Label>
                  <Input
                    value={curativoLocal}
                    onChange={(e) => setCurativoLocal(e.target.value)}
                    placeholder="Ex: Ferida cirúrgica do quadril…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Lateralidade</Label>
                  <div className="flex gap-3 mt-1">
                    {(["direita", "esquerda", "bilateral"] as const).map(
                      (lat) => (
                        <label
                          key={lat}
                          className="flex items-center gap-1.5 cursor-pointer text-sm"
                        >
                          <input
                            type="radio"
                            name="curLat"
                            value={lat}
                            checked={curativoLateralidade === lat}
                            onChange={() => setCurativoLateralidade(lat)}
                            className="accent-blue-600"
                          />
                          {lat.charAt(0).toUpperCase() + lat.slice(1)}
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pós-operatório */}
      {isPosOperatorio && (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Pós-Operatório
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4 space-y-3">
            <TriSwitch
              label="RX pós-op realizado?"
              value={rxRealizado}
              onChange={setRxRealizado}
            />
            {rxRealizado === "sim" && (
              <>
                <TriSwitch
                  label="RX satisfatório?"
                  value={rxSatisfatorio}
                  onChange={setRxSatisfatorio}
                />
                <TriSwitch
                  label="Enviado ao cirurgião?"
                  value={rxEnviado}
                  onChange={setRxEnviado}
                />
              </>
            )}
            <Separator className="my-1" />
            {/* Reabilitação pós-op */}
            <TriSwitch label="Já sentou?" value={sentou} onChange={setSentou} />
            <TriSwitch
              label="Já iniciou fisioterapia?"
              value={iniciouFisioterapia}
              onChange={setIniciouFisioterapia}
            />
            <TriSwitch label="Tem dreno?" value={dreno} onChange={setDreno} />
            {dreno === "sim" && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Volume dreno (mL)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={drenoCm3}
                    onChange={(e) => setDrenoCm3(e.target.value)}
                    placeholder="Ex: 50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Aspecto do dreno</Label>
                  <Input
                    value={drenoAspecto}
                    onChange={(e) => setDrenoAspecto(e.target.value)}
                    placeholder="Seroso, hemático…"
                  />
                </div>
              </div>
            )}
            <Separator className="my-1" />
            {/* Avaliação neurológica pós-op (item 4) */}
            <TriSwitch
              label="Havia déficit neurológico pré-operatório?"
              value={deficitPrevio}
              onChange={setDeficitPrevio}
            />
            {deficitPrevio === "nao" && (
              <>
                <TriSwitch
                  label="Movimento preservado no pós-op?"
                  value={movPosOp}
                  onChange={setMovPosOp}
                />
                <TriSwitch
                  label="Sensibilidade preservada no pós-op?"
                  value={sensPosOp}
                  onChange={setSensPosOp}
                />
              </>
            )}
            {deficitPrevio === "sim" && (
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Comparado ao pré-operatório, o déficit:
                </Label>
                <div className="flex gap-2">
                  {[
                    {
                      value: "melhorou",
                      label: "↑ Melhorou",
                      cls: "bg-green-50 border-green-300 text-green-700",
                    },
                    {
                      value: "igual",
                      label: "= Igual",
                      cls: "bg-yellow-50 border-yellow-300 text-yellow-700",
                    },
                    {
                      value: "piorou",
                      label: "↓ Piorou",
                      cls: "bg-red-50 border-red-300 text-red-700",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setDeficitNeurol(
                          deficitNeurol === opt.value
                            ? ""
                            : (opt.value as typeof deficitNeurol),
                        )
                      }
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-colors ${deficitNeurol === opt.value ? opt.cls : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Avaliação de outras lesões (item 5) */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Avaliação de Outras Lesões
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-3">
          <TriSwitch
            label="Paciente com dor em local sem radiografia?"
            value={temOutrasLesoes}
            onChange={setTemOutrasLesoes}
          />
          {temOutrasLesoes === "sim" && (
            <div className="space-y-3">
              {outrasLesoes.map((lesao, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-blue-700">
                      Lesão {idx + 1}
                    </span>
                    {outrasLesoes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerLesao(idx)}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Osso</Label>
                      <Input
                        value={lesao.osso}
                        onChange={(e) =>
                          atualizarLesao(idx, "osso", e.target.value)
                        }
                        placeholder="Ex: Fêmur, Tíbia…"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Lado</Label>
                      <select
                        value={lesao.lado}
                        onChange={(e) =>
                          atualizarLesao(idx, "lado", e.target.value)
                        }
                        className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecionar…</option>
                        <option value="Direito">Direito</option>
                        <option value="Esquerdo">Esquerdo</option>
                        <option value="Bilateral">Bilateral</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Incidências necessárias</Label>
                      <Input
                        value={lesao.incidencias}
                        onChange={(e) =>
                          atualizarLesao(idx, "incidencias", e.target.value)
                        }
                        placeholder="AP, Perfil, Axial…"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={adicionarLesao}
                className="text-xs text-blue-600 hover:underline"
              >
                + Adicionar lesão
              </button>
              <p className="text-xs text-amber-600">
                ⚠ Pendência de RX será criada automaticamente para cada lesão.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cardiovascular (≥55 anos) */}
      {mostraCardio && (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm border-orange-200">
          <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
            <CardTitle className="text-sm text-orange-600 font-medium uppercase tracking-wide">
              ⚠ Avaliação Cardiovascular (paciente ≥ 55 anos)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4 space-y-3">
            <TriSwitch
              label="Risco cardiovascular pendente?"
              value={cardioPendente}
              onChange={setCardioPendente}
            />
            <TriSwitch
              label="Cardiologista liberou?"
              value={cardiologistaLiberou}
              onChange={setCardiologistaLiberou}
            />
            <TriSwitch
              label="Solicitou ecocardiograma?"
              value={solicitouEco}
              onChange={setSolicitouEco}
            />
            {solicitouEco === "sim" && (
              <TriSwitch
                label="Eco pronto?"
                value={ecoReady}
                onChange={setEcoReady}
              />
            )}
            <TriSwitch
              label="Necessita UTI pós-op?"
              value={necessitaUTI}
              onChange={setNecessitaUTI}
            />
          </CardContent>
        </Card>
      )}

      {/* Laboratórios */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Laboratórios (opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Hb (g/dL)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="25"
                value={hemoglobina}
                onChange={(e) => setHemoglobina(e.target.value)}
                placeholder="12.5"
                className={
                  hemoglobina && parseFloat(hemoglobina) < 10
                    ? "border-red-400"
                    : ""
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">
                Plaquetas (mil/µL)
              </Label>
              <Input
                type="number"
                min="0"
                value={plaquetas}
                onChange={(e) => setPlaquetas(e.target.value)}
                placeholder="150"
                className={
                  plaquetas && parseFloat(plaquetas) < 100
                    ? "border-red-400"
                    : ""
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">INR</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={inr}
                onChange={(e) => setInr(e.target.value)}
                placeholder="1.0"
                className={
                  inr && parseFloat(inr) > 1.5 ? "border-orange-400" : ""
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infecção ortopédica (item 6) — aparece quando paciente tem infecção */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm border-red-200">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm text-red-600 font-medium uppercase tracking-wide">
            🦠 Infecção Ortopédica
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-4">
          {/* Laboratórios de infecção */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                id: "leucocitos",
                label: "Leucócitos (mil/µL)",
                val: leucocitos,
                set: setLeucocitos,
                alerta: (v: string) => parseFloat(v) > 11,
              },
              {
                id: "pcr",
                label: "PCR (mg/L)",
                val: pcr,
                set: setPcr,
                alerta: (v: string) => parseFloat(v) > 10,
              },
              {
                id: "vhs",
                label: "VHS (mm/h)",
                val: vhs,
                set: setVhs,
                alerta: (v: string) => parseFloat(v) > 20,
              },
              {
                id: "creatinina",
                label: "Creatinina (mg/dL)",
                val: creatinina,
                set: setCreatinina,
                alerta: (v: string) => parseFloat(v) > 1.2,
              },
              {
                id: "ureia",
                label: "Ureia (mg/dL)",
                val: ureia,
                set: setUreia,
                alerta: (v: string) => parseFloat(v) > 50,
              },
            ].map((item) => (
              <div key={item.id} className="space-y-1">
                <Label className="text-xs text-gray-500">{item.label}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={item.val}
                  onChange={(e) => item.set(e.target.value)}
                  placeholder="–"
                  className={`text-sm ${item.val && item.alerta(item.val) ? "border-red-400" : ""}`}
                />
              </div>
            ))}
          </div>
          <Separator />
          {/* Culturas */}
          <TriSwitch
            label="Culturas solicitadas?"
            value={culturasSolicitadas}
            onChange={setCulturasSolicitadas}
          />
          {culturasSolicitadas === "sim" && (
            <TriSwitch
              label="Resultado disponível?"
              value={culturasResultado}
              onChange={setCulturasResultado}
            />
          )}
          <Separator />
          {/* Infectologia */}
          <TriSwitch
            label="Avaliado pela infectologia?"
            value={infectAvaliado}
            onChange={setInfectAvaliado}
          />
          {infectAvaliado === "sim" && (
            <div className="space-y-1.5">
              <Label className="text-sm">Nome do infectologista</Label>
              <Input
                value={nomeInfectologista}
                onChange={(e) => setNomeInfectologista(e.target.value)}
                placeholder="Dr(a). nome"
                className="max-w-xs"
              />
            </div>
          )}
          <Separator />
          {/* Antibióticos */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Antibiótico atual</Label>
              <Input
                value={antibioticoAtual}
                onChange={(e) => setAntibioticoAtual(e.target.value)}
                placeholder="Ex: Vancomicina 1g"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Dia de tratamento</Label>
              <Input
                type="number"
                min="1"
                value={diaTratamento}
                onChange={(e) => setDiaTratamento(e.target.value)}
                placeholder="Ex: 5"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-sm">Antibióticos prévios</Label>
              <Input
                value={antibioticosPrevios}
                onChange={(e) => setAntibioticosPrevios(e.target.value)}
                placeholder="Ex: Cefazolina 7 dias"
              />
            </div>
          </div>
          <Separator />
          {/* Cirurgias de infecção */}
          <TriSwitch
            label="Lavagem cirúrgica realizada?"
            value={lavCirurgicaRealizada}
            onChange={setLavCirurgicaRealizada}
          />
          {lavCirurgicaRealizada === "sim" && (
            <div className="space-y-1.5">
              <Label className="text-sm">Quantas lavagens?</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={qtdLavagens}
                onChange={(e) => setQtdLavagens(e.target.value)}
                placeholder="1"
                className="max-w-24"
              />
            </div>
          )}
          <TriSwitch
            label="Retirada do implante realizada?"
            value={retirouImplante}
            onChange={setRetirouImplante}
          />
        </CardContent>
      </Card>

      {/* Clínica médica */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Clínica Médica
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-3">
          <TriSwitch
            label="Em acompanhamento pela clínica médica?"
            value={acompClinico}
            onChange={setAcompClinico}
          />
          {acompClinico === "sim" && (
            <div className="space-y-1.5">
              <Label className="text-sm">Nome do clínico</Label>
              <Input
                value={nomeClinico}
                onChange={(e) => setNomeClinico(e.target.value)}
                placeholder="Dr(a). nome"
                className="max-w-xs"
              />
            </div>
          )}
          {acompClinico === "nao" && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠ Necessário realizar prescrição clínica.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alta */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Planejamento de Alta
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-3">
          <TriSwitch
            label="Alta prevista?"
            value={altaPrevista}
            onChange={setAltaPrevista}
          />
          <TriSwitch
            label="Alta hoje?"
            value={altaHoje}
            onChange={setAltaHoje}
          />

          {altaHoje === "sim" && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-green-800 mb-2">
                Checklist de alta:
              </p>
              {[
                {
                  key: "chkReceita",
                  label: "Receita",
                  val: chkReceita,
                  set: setChkReceita,
                },
                {
                  key: "chkRelatorio",
                  label: "Relatório médico",
                  val: chkRelatorio,
                  set: setChkRelatorio,
                },
                {
                  key: "chkOrientacoes",
                  label: "Orientações ao paciente",
                  val: chkOrientacoes,
                  set: setChkOrientacoes,
                },
                {
                  key: "chkAtestado",
                  label: "Atestado",
                  val: chkAtestado,
                  set: setChkAtestado,
                },
                {
                  key: "chkRetorno",
                  label: "Pedido de retorno",
                  val: chkRetorno,
                  set: setChkRetorno,
                },
                {
                  key: "chkRX",
                  label: "Pedido de Raio-X",
                  val: chkRX,
                  set: setChkRX,
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={(e) => item.set(e.target.checked)}
                    className="accent-green-600 w-4 h-4"
                  />
                  <span
                    className={`text-sm ${item.val ? "line-through text-gray-400" : "text-green-800"}`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observações livres */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Informações adicionais para o texto da evolução…"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Preview do texto gerado */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm border-blue-200 bg-blue-50">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-blue-700 font-medium uppercase tracking-wide">
              📋 Texto de Evolução (gerado automaticamente)
            </CardTitle>
            {textoPreview && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(textoPreview);
                  toast.success("Texto copiado!");
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Copiar
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-5 py-4">
          {textoPreview ? (
            <p className="text-sm text-gray-800 leading-relaxed">
              {textoPreview}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Preencha os campos acima para gerar o texto automaticamente…
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pendências que serão geradas */}
      {pendenciasPreview().length > 0 && (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm border-amber-200 bg-amber-50">
          <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
            <CardTitle className="text-sm text-amber-700 font-medium uppercase tracking-wide">
              ⚠ Pendências que serão geradas ({pendenciasPreview().length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <ul className="space-y-1">
              {pendenciasPreview().map((p, i) => (
                <li
                  key={i}
                  className="text-xs text-amber-800 flex items-center gap-1.5"
                >
                  <span>•</span>
                  <span>{p.descricao}</span>
                  <span className="text-amber-500">({p.tipo})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Botões */}
      <div className="flex gap-3 justify-end border-t border-slate-200 pt-4 pb-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Salvando…" : "Registrar Evolução"}
        </Button>
      </div>
    </form>
  );
}
