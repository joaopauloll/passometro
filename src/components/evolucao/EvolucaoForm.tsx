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
import SimNao from "@/components/ui/simnao";

import { gerarTextoEvolucao, gerarPendencias } from "@/lib/evolucao";

import type { EvolucaoFormData } from "@/types";

/* ============================================================================
 * PROPS
 * ========================================================================== */

type Props = {
  pacienteId: string;
  evolucaoId?: string;
  isPosOperatorio: boolean;
  idadePaciente?: number | null;
  nomePaciente: string;
};

/* ============================================================================
 * COMPONENTE
 * ========================================================================== */

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

  /* ==========================================================================
   * ESTADO GERAL
   * ======================================================================== */

  // Melhor estado clínico como padrão
  const [estavel, setEstavel] = useState(true);
  const [febre, setFebre] = useState(false);
  const [semDor, setSemDor] = useState(true);
  const [dorControlada, setDorControlada] = useState(true);

  /* ==========================================================================
   * ELIMINAÇÕES
   * ======================================================================== */

  const [diurese, setDiurese] = useState<"espontanea" | "svd" | "anurico" | "">(
    "espontanea",
  );

  const [ultimaEvacuacao, setUltimaEvacuacao] = useState("");

  /* ==========================================================================
   * EXAME FÍSICO
   * ======================================================================== */

  const [perfusao, setPerfusao] = useState(true);
  const [sensibilidade, setSensibilidade] = useState(true);
  const [movimento, setMovimento] = useState(true);

  /* ==========================================================================
   * IMOBILIZAÇÃO
   * ======================================================================== */

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

  // Mantido para compatibilidade com o modelo atual
  const [usaGesso, setUsaGesso] = useState(false);
  const [qualGesso, setQualGesso] = useState("");

  function toggleImob(tipo: string) {
    setImobTipos((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    );
  }

  /* ==========================================================================
   * CURATIVO
   * ======================================================================== */

  // Melhor situação padrão: não possui curativo
  const [possuiCurativo, setPossuiCurativo] = useState(false);

  const [curativoLimpo, setCurativoLimpo] = useState(true);
  const [secInfecciosa, setSecInfecciosa] = useState(false);
  const [secSanguinolenta, setSecSanguinolenta] = useState(false);

  const [curativoLocal, setCurativoLocal] = useState("");

  const [curativoLateralidade, setCurativoLateralidade] = useState<
    "direita" | "esquerda" | "bilateral" | ""
  >("");

  /* ==========================================================================
   * PÓS-OPERATÓRIO
   * ======================================================================== */

  // Perguntas de "realizado?" começam como não, pois ainda não há registro.
  const [rxRealizado, setRxRealizado] = useState(false);

  // Condições favoráveis
  const [rxSatisfatorio, setRxSatisfatorio] = useState(true);
  const [rxEnviado, setRxEnviado] = useState(true);

  /* ==========================================================================
   * REABILITAÇÃO PÓS-OP
   * ======================================================================== */

  const [sentou, setSentou] = useState(true);
  const [iniciouFisioterapia, setIniciouFisioterapia] = useState(true);

  // Melhor situação: não tem dreno
  const [dreno, setDreno] = useState(false);
  const [drenoCm3, setDrenoCm3] = useState("");
  const [drenoAspecto, setDrenoAspecto] = useState("");

  /* ==========================================================================
   * NEUROLÓGICO PÓS-OP
   * ======================================================================== */

  // Melhor situação: não havia déficit prévio
  const [deficitPrevio, setDeficitPrevio] = useState(false);

  const [movPosOp, setMovPosOp] = useState(true);
  const [sensPosOp, setSensPosOp] = useState(true);

  const [deficitNeurol, setDeficitNeurol] = useState<
    "melhorou" | "igual" | "piorou" | ""
  >("igual");

  /* ==========================================================================
   * CARDIOVASCULAR
   * ======================================================================== */

  // Melhor situação clínica
  const [cardioPendente, setCardioPendente] = useState(false);
  const [cardiologistaLiberou, setCardiologistaLiberou] = useState(true);
  const [solicitouEco, setSolicitouEco] = useState(false);
  const [ecoReady, setEcoReady] = useState(true);
  const [necessitaUTI, setNecessitaUTI] = useState(false);

  /* ==========================================================================
   * LABORATÓRIOS
   * ======================================================================== */

  const [hemoglobina, setHemoglobina] = useState("");
  const [plaquetas, setPlaquetas] = useState("");
  const [inr, setInr] = useState("");

  /* ==========================================================================
   * INFECÇÃO ORTOPÉDICA
   * ======================================================================== */

  const [leucocitos, setLeucocitos] = useState("");
  const [pcr, setPcr] = useState("");
  const [vhs, setVhs] = useState("");
  const [creatinina, setCreatinina] = useState("");
  const [ureia, setUreia] = useState("");

  const [culturasSolicitadas, setCulturasSolicitadas] = useState(false);

  const [culturasResultado, setCulturasResultado] = useState(true);

  const [infectAvaliado, setInfectAvaliado] = useState(true);

  const [nomeInfectologista, setNomeInfectologista] = useState("");

  const [antibioticoAtual, setAntibioticoAtual] = useState("");
  const [diaTratamento, setDiaTratamento] = useState("");
  const [antibioticosPrevios, setAntibioticosPrevios] = useState("");

  const [lavCirurgicaRealizada, setLavCirurgicaRealizada] = useState(false);

  const [qtdLavagens, setQtdLavagens] = useState("");

  const [retirouImplante, setRetirouImplante] = useState(true);

  /* ==========================================================================
   * OUTRAS LESÕES
   * ======================================================================== */

  type OutraLesaoLocal = {
    osso: string;
    lado: string;
    incidencias: string;
  };

  const [temOutrasLesoes, setTemOutrasLesoes] = useState(false);

  const [outrasLesoes, setOutrasLesoes] = useState<OutraLesaoLocal[]>([
    {
      osso: "",
      lado: "",
      incidencias: "",
    },
  ]);

  function adicionarLesao() {
    setOutrasLesoes([
      ...outrasLesoes,
      {
        osso: "",
        lado: "",
        incidencias: "",
      },
    ]);
  }

  function atualizarLesao(
    idx: number,
    campo: keyof OutraLesaoLocal,
    valor: string,
  ) {
    const novas = outrasLesoes.map((l, i) =>
      i === idx
        ? {
            ...l,
            [campo]: valor,
          }
        : l,
    );

    setOutrasLesoes(novas);
  }

  function removerLesao(idx: number) {
    setOutrasLesoes(outrasLesoes.filter((_, i) => i !== idx));
  }

  /* ==========================================================================
   * CLÍNICA MÉDICA
   * ======================================================================== */

  const [acompClinico, setAcompClinico] = useState(false);

  const [nomeClinico, setNomeClinico] = useState("");

  /* ==========================================================================
   * ALTA
   * ======================================================================== */

  const [altaPrevista, setAltaPrevista] = useState(true);

  const [altaHoje, setAltaHoje] = useState(false);

  const [chkReceita, setChkReceita] = useState(false);
  const [chkRelatorio, setChkRelatorio] = useState(false);
  const [chkOrientacoes, setChkOrientacoes] = useState(false);
  const [chkAtestado, setChkAtestado] = useState(false);
  const [chkRetorno, setChkRetorno] = useState(false);
  const [chkRX, setChkRX] = useState(false);

  /* ==========================================================================
   * OBSERVAÇÕES
   * ======================================================================== */

  const [observacoes, setObservacoes] = useState("");

  /* ==========================================================================
   * DADOS DA EVOLUÇÃO
   * ======================================================================== */

  const getDados = useCallback(
    (): EvolucaoFormData => ({
      estavel,
      febre,
      semDor,
      dorControlada,

      diurese: diurese || undefined,
      ultimaEvacuacao: ultimaEvacuacao || undefined,

      perfusaoPreservada: perfusao,
      sensibilidadePreservada: sensibilidade,
      movimentoPreservado: movimento,

      usaGesso,
      qualGesso: qualGesso || undefined,

      possuiCurativo,
      curativoLimpo,
      secrecaoInfecciosa: secInfecciosa,
      secrecaoSanguinolenta: secSanguinolenta,

      rxPosOpRealizado: rxRealizado,
      rxSatisfatorio,
      rxEnviadoCirurgiao: rxEnviado,

      deficitPrevio,
      movPosOp,
      sensPosOp,

      deficitNeurol: deficitNeurol || undefined,

      cardioPendente,
      cardiologistaLiberou,
      solicitouEco,
      ecoReady,
      necessitaUTI,

      hemoglobina: hemoglobina ? parseFloat(hemoglobina) : null,

      plaquetas: plaquetas ? parseFloat(plaquetas) : null,

      inr: inr ? parseFloat(inr) : null,

      leucocitos: leucocitos ? parseFloat(leucocitos) : null,

      pcr: pcr ? parseFloat(pcr) : null,

      vhs: vhs ? parseFloat(vhs) : null,

      creatinina: creatinina ? parseFloat(creatinina) : null,

      ureia: ureia ? parseFloat(ureia) : null,

      culturasSolicitadas,
      culturasResultado,
      infectAvaliado,

      nomeInfectologista: nomeInfectologista || undefined,

      antibioticoAtual: antibioticoAtual || undefined,

      diaTratamento: diaTratamento ? parseInt(diaTratamento) : null,

      antibioticosPrevios: antibioticosPrevios || undefined,

      lavCirurgicaRealizada,

      qtdLavagens: qtdLavagens ? parseInt(qtdLavagens) : null,

      retirouImplante,

      outrasLesoes: temOutrasLesoes ? outrasLesoes.filter((l) => l.osso) : [],

      acompClinico,

      nomeClinico: nomeClinico || undefined,

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

  /* ==========================================================================
   * PREVIEW
   * ======================================================================== */

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

  /* ==========================================================================
   * SALVAR
   * ======================================================================== */

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      if (!res.ok) {
        throw new Error("Erro ao salvar evolução");
      }

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

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-3"
    >
      {/* ====================================================================
          ESTADO GERAL
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Estado Geral
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-4">
          <SimNao
            label="Estável hemodinamicamente?"
            value={estavel}
            onChange={setEstavel}
          />

          <SimNao label="Febril?" value={febre} onChange={setFebre} />

          <SimNao label="Sem dor?" value={semDor} onChange={setSemDor} />

          {!semDor && (
            <SimNao
              label="Dor controlada?"
              value={dorControlada}
              onChange={setDorControlada}
            />
          )}
        </CardContent>
      </Card>

      {/* ====================================================================
          ELIMINAÇÕES
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Eliminações
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Diurese</Label>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "espontanea",
                  label: "Espontânea",
                },
                {
                  value: "svd",
                  label: "SVD",
                },
                {
                  value: "anurico",
                  label: "Anúrico",
                },
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
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    diurese === opt.value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-blue-300"
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

      {/* ====================================================================
          EXAME FÍSICO
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Exame Físico
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-4">
          <SimNao
            label="Perfusão distal preservada?"
            value={perfusao}
            onChange={setPerfusao}
          />

          <SimNao
            label="Sensibilidade preservada?"
            value={sensibilidade}
            onChange={setSensibilidade}
          />

          <SimNao
            label="Movimento preservado?"
            value={movimento}
            onChange={setMovimento}
          />
        </CardContent>
      </Card>

      {/* ====================================================================
          IMOBILIZAÇÃO
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Imobilização
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-4">
          <div>
            <p className="mb-2 text-sm text-gray-700">
              Tipo(s) de imobilização:
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {IMOB_TIPOS.map((tipo) => (
                <label
                  key={tipo}
                  className="flex cursor-pointer select-none items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={imobTipos.includes(tipo)}
                    onChange={() => toggleImob(tipo)}
                    className="h-4 w-4 accent-blue-600"
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
                {["direita", "esquerda", "bilateral"].map((lat) => (
                  <label
                    key={lat}
                    className="flex cursor-pointer items-center gap-1.5 text-sm"
                  >
                    <input
                      type="radio"
                      name="imobLat"
                      value={lat}
                      checked={imobLateralidade === lat}
                      onChange={() =>
                        setImobLateralidade(
                          lat as "direita" | "esquerda" | "bilateral",
                        )
                      }
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

      {/* ====================================================================
          CURATIVO
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Curativo
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-4">
          <SimNao
            label="Possui curativo?"
            value={possuiCurativo}
            onChange={setPossuiCurativo}
          />

          {possuiCurativo && (
            <>
              <SimNao
                label="Curativo limpo?"
                value={curativoLimpo}
                onChange={setCurativoLimpo}
              />

              <SimNao
                label="Secreção infecciosa?"
                value={secInfecciosa}
                onChange={setSecInfecciosa}
              />

              <SimNao
                label="Secreção sanguinolenta?"
                value={secSanguinolenta}
                onChange={setSecSanguinolenta}
              />

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
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

                  <div className="mt-1 flex gap-3">
                    {["direita", "esquerda", "bilateral"].map((lat) => (
                      <label
                        key={lat}
                        className="flex cursor-pointer items-center gap-1.5 text-sm"
                      >
                        <input
                          type="radio"
                          name="curLat"
                          value={lat}
                          checked={curativoLateralidade === lat}
                          onChange={() =>
                            setCurativoLateralidade(
                              lat as "direita" | "esquerda" | "bilateral",
                            )
                          }
                          className="accent-blue-600"
                        />

                        {lat.charAt(0).toUpperCase() + lat.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ====================================================================
          PÓS-OPERATÓRIO
      ==================================================================== */}

      {isPosOperatorio && (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Pós-Operatório
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 px-5 py-4">
            <SimNao
              label="RX pós-op realizado?"
              value={rxRealizado}
              onChange={setRxRealizado}
            />

            {rxRealizado && (
              <>
                <SimNao
                  label="RX satisfatório?"
                  value={rxSatisfatorio}
                  onChange={setRxSatisfatorio}
                />

                <SimNao
                  label="Enviado ao cirurgião?"
                  value={rxEnviado}
                  onChange={setRxEnviado}
                />
              </>
            )}

            <Separator className="my-1" />

            <SimNao label="Já sentou?" value={sentou} onChange={setSentou} />

            <SimNao
              label="Já iniciou fisioterapia?"
              value={iniciouFisioterapia}
              onChange={setIniciouFisioterapia}
            />

            <SimNao label="Tem dreno?" value={dreno} onChange={setDreno} />

            {dreno && (
              <div className="mt-2 grid grid-cols-2 gap-3">
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

            <SimNao
              label="Havia déficit neurológico pré-operatório?"
              value={deficitPrevio}
              onChange={setDeficitPrevio}
            />

            {!deficitPrevio && (
              <>
                <SimNao
                  label="Movimento preservado no pós-op?"
                  value={movPosOp}
                  onChange={setMovPosOp}
                />

                <SimNao
                  label="Sensibilidade preservada no pós-op?"
                  value={sensPosOp}
                  onChange={setSensPosOp}
                />
              </>
            )}

            {deficitPrevio && (
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
                      className={`flex-1 rounded-lg border-2 py-2 text-xs font-semibold transition-colors ${
                        deficitNeurol === opt.value
                          ? opt.cls
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
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

      {/* ====================================================================
          OUTRAS LESÕES
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Avaliação de Outras Lesões
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-4">
          <SimNao
            label="Paciente com dor em local sem radiografia?"
            value={temOutrasLesoes}
            onChange={setTemOutrasLesoes}
          />

          {temOutrasLesoes && (
            <div className="space-y-3">
              {outrasLesoes.map((lesao, idx) => (
                <div
                  key={idx}
                  className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3"
                >
                  <div className="flex items-center justify-between">
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
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* ====================================================================
          CARDIOVASCULAR
      ==================================================================== */}

      {mostraCardio && (
        <Card className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-orange-600">
              ⚠ Avaliação Cardiovascular (paciente ≥ 55 anos)
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 px-5 py-4">
            <SimNao
              label="Risco cardiovascular pendente?"
              value={cardioPendente}
              onChange={setCardioPendente}
            />

            <SimNao
              label="Cardiologista liberou?"
              value={cardiologistaLiberou}
              onChange={setCardiologistaLiberou}
            />

            <SimNao
              label="Solicitou ecocardiograma?"
              value={solicitouEco}
              onChange={setSolicitouEco}
            />

            {solicitouEco && (
              <SimNao
                label="Eco pronto?"
                value={ecoReady}
                onChange={setEcoReady}
              />
            )}

            <SimNao
              label="Necessita UTI pós-op?"
              value={necessitaUTI}
              onChange={setNecessitaUTI}
            />
          </CardContent>
        </Card>
      )}

      {/* ====================================================================
          LABORATÓRIOS
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
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

      {/* ====================================================================
          INFECÇÃO ORTOPÉDICA
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-red-600">
            🦠 Infecção Ortopédica
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                  className={`text-sm ${
                    item.val && item.alerta(item.val) ? "border-red-400" : ""
                  }`}
                />
              </div>
            ))}
          </div>

          <Separator />

          <SimNao
            label="Culturas solicitadas?"
            value={culturasSolicitadas}
            onChange={setCulturasSolicitadas}
          />

          {culturasSolicitadas && (
            <SimNao
              label="Resultado disponível?"
              value={culturasResultado}
              onChange={setCulturasResultado}
            />
          )}

          <Separator />

          <SimNao
            label="Avaliado pela infectologia?"
            value={infectAvaliado}
            onChange={setInfectAvaliado}
          />

          {infectAvaliado && (
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

          <div className="grid gap-3 sm:grid-cols-2">
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

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm">Antibióticos prévios</Label>

              <Input
                value={antibioticosPrevios}
                onChange={(e) => setAntibioticosPrevios(e.target.value)}
                placeholder="Ex: Cefazolina 7 dias"
              />
            </div>
          </div>

          <Separator />

          <SimNao
            label="Lavagem cirúrgica realizada?"
            value={lavCirurgicaRealizada}
            onChange={setLavCirurgicaRealizada}
          />

          {lavCirurgicaRealizada && (
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

          <SimNao
            label="Retirada do implante realizada?"
            value={retirouImplante}
            onChange={setRetirouImplante}
          />
        </CardContent>
      </Card>

      {/* ====================================================================
          CLÍNICA MÉDICA
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Clínica Médica
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-4">
          <SimNao
            label="Em acompanhamento pela clínica médica?"
            value={acompClinico}
            onChange={setAcompClinico}
          />

          {acompClinico && (
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

          {!acompClinico && (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
              ⚠ Necessário realizar prescrição clínica.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====================================================================
          ALTA
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Planejamento de Alta
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-4">
          <SimNao
            label="Alta prevista?"
            value={altaPrevista}
            onChange={setAltaPrevista}
          />

          <SimNao label="Alta hoje?" value={altaHoje} onChange={setAltaHoje} />

          {altaHoje && (
            <div className="mt-3 space-y-2 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="mb-2 text-xs font-semibold text-green-800">
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
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={(e) => item.set(e.target.checked)}
                    className="h-4 w-4 accent-green-600"
                  />

                  <span
                    className={`text-sm ${
                      item.val ? "text-gray-400 line-through" : "text-green-800"
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====================================================================
          OBSERVAÇÕES
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
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

      {/* ====================================================================
          PREVIEW DO TEXTO
      ==================================================================== */}

      <Card className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-blue-700">
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
            <p className="text-sm leading-relaxed text-gray-800">
              {textoPreview}
            </p>
          ) : (
            <p className="text-sm italic text-gray-400">
              Preencha os campos acima para gerar o texto automaticamente…
            </p>
          )}
        </CardContent>
      </Card>

      {/* ====================================================================
          PENDÊNCIAS
      ==================================================================== */}

      {pendenciasPreview().length > 0 && (
        <Card className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-amber-700">
              ⚠ Pendências que serão geradas ({pendenciasPreview().length})
            </CardTitle>
          </CardHeader>

          <CardContent className="px-5 py-4">
            <ul className="space-y-1">
              {pendenciasPreview().map((p, i) => (
                <li
                  key={i}
                  className="flex items-center gap-1.5 text-xs text-amber-800"
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

      {/* ====================================================================
          BOTÕES
      ==================================================================== */}

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 pb-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading
            ? "Salvando…"
            : evolucaoId
              ? "Salvar Alterações"
              : "Registrar Evolução"}
        </Button>
      </div>
    </form>
  );
}
