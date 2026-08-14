"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { differenceInDays, differenceInYears, addDays, format } from "date-fns";
import { Plus, X, AlertTriangle, Check, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SimNao from "@/components/ui/simnao";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import {
  MEDICAMENTOS_SUSPENSO,
  MEDICAMENTOS_COMUNS,
  PPS_NIVEIS,
} from "@/lib/medicamentos";

import CirurgiaoMultiSelect from "@/components/pacientes/CirurgiaoMultiSelect";
import FotoUpload, { FotoPendente } from "@/components/FotoUpload";

/* ============================================================================
 * TIPOS
 * ========================================================================== */

type Cirurgia = {
  nomeCirurgia: string;
  cirurgiao: string;
  dataCirurgia: string;
  hospitalExterno?: string;
  diagnostico?: string;
  cid?: string;
  intercorrencia?: boolean;
  intercorrenciaDesc?: string;
};

type CirurgiaPrevia = {
  nome: string;
  quando: string;
  cirurgiao: string;
  hospital?: string;
};

type MedicamentoUso = {
  codigo: string;
  dataUltimoUso: string;
};

type Parecer = {
  id?: string;
  especialidade: string;
  data: string;
  descricao: string;
  medico: string;
};

type Cultura = {
  id?: string;
  dataColeta: string;
  sitio: string;
  resultado: string;
  dataResult: string;
};

type ExameImagem = {
  id?: string;
  tipo: string;
  lateralidade: string;
  dataRealizacao: string;
  sitio: string;
  achados: string;
  laudo: string;
  linkTipo: string;
};

type ComorbidadesData = {
  has: boolean;
  dm2: boolean;
  tabagismo: boolean;
  etilismo: boolean;
  avc: boolean;
  iam: boolean;
  drc: boolean;
  osteoporose: boolean;
  obesidade: boolean;
  demencia: boolean;
  hipercolesterolemia: boolean;
  hipotireoidismo: boolean;
  hipertireoidismo: boolean;
  cancer: boolean;
  artrose: boolean;
  doencaAutoimune: boolean;
  outros: string;
  funcaoRenal: "normal" | "reduzida";
};

type InfeccaoData = {
  tempo: string;
  febre: boolean;
  antibiotico: string;
  inicio: string;
  antibioticoPrevio: string;
  antibioticoPrevioQuando: string;
  culturas: boolean;
  culturasResult: string;
  dreno: boolean;
  drenoValor: string;
};

type RiscoData = {
  concluido: boolean;
  data: string;
  cardiologista: string;
  nivel: string;
  indicaUTI: boolean;
  dataEco: string;
  resultadoEco: string;
  dataEcg: string;
  resultadoEcg: string;
};

type FormValues = {
  nome: string;
  leito: string;
  registroHospitalar: string;
  cpf: string;

  dataInternacao: string;
  dataNascimento: string;

  diagnostico: string;
  cid: string;
  subespecialidade: string;
  cirurgioes: string[];
  tipoStatus: string;

  comorbidades: string;
  comorbidadesJson: ComorbidadesData;

  prevCirurgiasOrto: boolean;
  prevCirurgiasJson: CirurgiaPrevia[];

  temAlergia: boolean;
  alergias: string;
  alergiasLista: string[];

  medicamentosJson: MedicamentoUso[];
  medicamentosComuns: string[];
  medicamentosOutros: string;
  medicacoes: string;

  hemoglobinaAdm: string;
  plaquetasAdm: string;
  inrAdm: string;

  pps: string;

  temInfeccao: boolean;
  infeccaoJson: InfeccaoData;

  compSolturaAssetica: boolean;
  compLuxacao: boolean;
  compFalhaImplante: boolean;
  compPseudoartrose: boolean;
  compOutro: string;

  traumaMecanismo: string;
  historiaDoencaAtual: string;
  houveTrauma: boolean;
  traumaData: string;
  traumaTempo: string;

  cirurgias: Cirurgia[];

  // Usados somente durante a criação; depois são gerenciados nas abas.
  pareceres: Parecer[];
  culturas: Cultura[];
  examesImagem: ExameImagem[];

  altaOrtopediaData: string;
  altaHospitalarData: string;
  previsaoAltaOrto: string;

  clinicaMedico: string;
  aguardaClinica: boolean;

  riscoJson: RiscoData;
};

/* ============================================================================
 * CONSTANTES
 * ========================================================================== */

const DEFAULT_COMORBIDADES: ComorbidadesData = {
  has: false,
  dm2: false,
  tabagismo: false,
  etilismo: false,
  avc: false,
  iam: false,
  drc: false,
  osteoporose: false,
  obesidade: false,
  demencia: false,
  hipercolesterolemia: false,
  hipotireoidismo: false,
  hipertireoidismo: false,
  cancer: false,
  artrose: false,
  doencaAutoimune: false,
  outros: "",
  funcaoRenal: "normal",
};

const DEFAULT_INFECCAO: InfeccaoData = {
  tempo: "",
  febre: false,
  antibiotico: "",
  inicio: "",
  antibioticoPrevio: "",
  antibioticoPrevioQuando: "",
  culturas: false,
  culturasResult: "",
  dreno: false,
  drenoValor: "",
};

const DEFAULT_RISCO: RiscoData = {
  concluido: false,
  data: "",
  cardiologista: "",
  nivel: "",
  indicaUTI: false,
  dataEco: "",
  resultadoEco: "",
  dataEcg: "",
  resultadoEcg: "",
};

const CLINICA_MEDICOS = [
  "Marcus Ferreira",
  "Tais Moura",
  "Tatiana Gonçalves",
  "Heloisa Abdon",
  "Ana Clara Noronha",
];

const SUBESPECIALIDADES = [
  "Quadril",
  "Joelho",
  "Ombro",
  "Cotovelo",
  "Mão e Micro",
  "Pé e Tornozelo",
  "Coluna",
  "Trauma",
  "Oncológica",
  "Infantil",
];

const COMORBIDADES_OPCOES = [
  { key: "has", label: "HAS" },
  { key: "dm2", label: "DM2" },
  { key: "tabagismo", label: "Tabagismo" },
  { key: "etilismo", label: "Etilismo" },
  { key: "avc", label: "AVC prévio" },
  { key: "iam", label: "IAM prévio" },
  { key: "drc", label: "DRC" },
  { key: "osteoporose", label: "Osteoporose" },
  { key: "obesidade", label: "Obesidade" },
  { key: "demencia", label: "Demência" },
  { key: "hipercolesterolemia", label: "Hipercolesterolemia" },
  { key: "hipotireoidismo", label: "Hipotireoidismo" },
  { key: "hipertireoidismo", label: "Hipertireoidismo" },
  { key: "cancer", label: "Câncer" },
  { key: "artrose", label: "Artrose" },
  { key: "doencaAutoimune", label: "Doença Autoimune" },
] as const;

const PARECER_ESPECIALIDADES = [
  "Cardiologia",
  "Clínica Médica",
  "Infectologia",
  "Anestesiologia",
  "Neurologia",
  "Nefrologia",
  "Pneumologia",
  "Outras",
];

const TIPOS_EXAME = [
  { value: "radiografia", label: "Radiografia (RX)" },
  { value: "ecg", label: "Eletrocardiograma (ECG)" },
  { value: "ecocardiograma", label: "Ecocardiograma" },
  { value: "tomografia", label: "Tomografia Computadorizada (TC)" },
  { value: "ressonancia", label: "Ressonância Magnética (RM)" },
  { value: "ultrassonografia", label: "Ultrassonografia (USG)" },
  { value: "outro", label: "Outro" },
];

const HOSPITAIS_EXAMES = [
  { value: "WBSRAD", label: "Hospital Memorial (WBSRad)" },
  { value: "EPACS", label: "Walfredo Gurgel (EPACS)" },
  { value: "EXTERNO", label: "Outro / Externo" },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function calcularIdade(dataNascimento: string): string {
  if (!dataNascimento) return "";

  try {
    const anos = differenceInYears(
      new Date(),
      new Date(`${dataNascimento}T12:00:00`),
    );

    return `${anos} ano${anos !== 1 ? "s" : ""}`;
  } catch {
    return "";
  }
}

function calcularTempoInternacao(dataInternacao: string): string {
  if (!dataInternacao) return "";

  try {
    const dias = differenceInDays(
      new Date(),
      new Date(`${dataInternacao}T12:00:00`),
    );

    if (dias < 0) return "";
    if (dias === 0) return "Internação hoje";

    return `${dias} dia${dias !== 1 ? "s" : ""} internado`;
  } catch {
    return "";
  }
}

function formatarCPF(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);

  if (nums.length <= 3) return nums;
  if (nums.length <= 6) {
    return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  }
  if (nums.length <= 9) {
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  }

  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(
    6,
    9,
  )}-${nums.slice(9)}`;
}

function parseSafe<T>(json: string | undefined | null, fallback: T): T {
  if (!json) return fallback;

  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function normalizarFuncaoRenal(
  valor: string | null | undefined,
): ComorbidadesData["funcaoRenal"] | undefined {
  if (valor === "REDUZIDA" || valor === "reduzida") return "reduzida";
  if (valor === "NORMAL" || valor === "normal") return "normal";
  return undefined;
}

function obterComorbidadesIniciais(
  json: string | undefined,
  funcaoRenal: string | null | undefined,
): ComorbidadesData {
  const dados = parseSafe<Partial<ComorbidadesData>>(json, {});

  return {
    ...DEFAULT_COMORBIDADES,
    ...dados,
    funcaoRenal:
      normalizarFuncaoRenal(funcaoRenal) ??
      normalizarFuncaoRenal(dados.funcaoRenal) ??
      DEFAULT_COMORBIDADES.funcaoRenal,
  };
}

/* ============================================================================
 * PROPS
 * ========================================================================== */

type InitialValues = Omit<
  Partial<FormValues>,
  | "comorbidadesJson"
  | "infeccaoJson"
  | "prevCirurgiasJson"
  | "medicamentosJson"
  | "hemoglobinaAdm"
  | "plaquetasAdm"
  | "inrAdm"
  | "pps"
  | "riscoJson"
> & {
  id?: string;
  comorbidadesJson?: string;
  infeccaoJson?: string;
  prevCirurgiasJson?: string;
  medicamentosJson?: string;
  riscoJson?: string;
  funcaoRenal?: string | null;

  hemoglobinaAdm?: number | string | null;
  plaquetasAdm?: number | string | null;
  inrAdm?: number | string | null;
  pps?: number | string | null;

  altaOrtopediaData?: string | null;
  altaHospitalarData?: string | null;

  cirurgias?: Cirurgia[];
};

type Props = {
  inicial?: InitialValues;
  modo: "criar" | "editar";
};

/* ============================================================================
 * COMPONENTE
 * ========================================================================== */

export default function PacienteForm({ inicial, modo }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const fotosPendentesRef = useRef<FotoPendente[]>([]);

  const [insereRadiografias, setInsereRadiografias] = useState(false);
  const [insereLesaoPele, setInsereLesaoPele] = useState(false);

  function atualizarFotosPendentesPorTipo(
    tipo: FotoPendente["tipo"],
    fotosDoTipo: FotoPendente[],
  ) {
    const outrasFotos = fotosPendentesRef.current.filter(
      (foto) => foto.tipo !== tipo,
    );

    fotosPendentesRef.current = [...outrasFotos, ...fotosDoTipo];
  }

  const [novoAlergico, setNovoAlergico] = useState("");

  const [form, setForm] = useState<FormValues>({
    nome: inicial?.nome || "",
    leito: inicial?.leito || "",
    registroHospitalar: inicial?.registroHospitalar || "",
    cpf: inicial?.cpf || "",

    dataInternacao:
      inicial?.dataInternacao?.split("T")[0] ||
      new Date().toISOString().split("T")[0],

    dataNascimento: inicial?.dataNascimento?.split("T")[0] || "",

    diagnostico: inicial?.diagnostico || "",
    cid: inicial?.cid || "",
    subespecialidade: inicial?.subespecialidade || "",

    cirurgioes: inicial?.cirurgioes || [""],

    tipoStatus: inicial?.tipoStatus || "PRE_OPERATORIO",

    comorbidades: inicial?.comorbidades || "",

    comorbidadesJson: obterComorbidadesIniciais(
      inicial?.comorbidadesJson,
      inicial?.funcaoRenal,
    ),

    prevCirurgiasOrto: inicial?.prevCirurgiasOrto || false,

    prevCirurgiasJson: parseSafe<CirurgiaPrevia[]>(
      inicial?.prevCirurgiasJson,
      [],
    ),

    temAlergia: inicial?.temAlergia || false,

    alergias: inicial?.alergias || "",

    alergiasLista: inicial?.alergias
      ? inicial.alergias
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : [],

    medicamentosJson: parseSafe<MedicamentoUso[]>(
      inicial?.medicamentosJson,
      [],
    ),

    medicamentosComuns: inicial?.medicamentosComuns || [],

    medicamentosOutros: inicial?.medicamentosOutros || "",

    medicacoes: inicial?.medicacoes || "",

    hemoglobinaAdm:
      inicial?.hemoglobinaAdm != null ? String(inicial.hemoglobinaAdm) : "",

    plaquetasAdm:
      inicial?.plaquetasAdm != null ? String(inicial.plaquetasAdm) : "",

    inrAdm: inicial?.inrAdm != null ? String(inicial.inrAdm) : "",

    pps: inicial?.pps != null ? String(inicial.pps) : "",

    temInfeccao: inicial?.temInfeccao || false,

    infeccaoJson: parseSafe<InfeccaoData>(
      inicial?.infeccaoJson,
      DEFAULT_INFECCAO,
    ),

    compSolturaAssetica: inicial?.compSolturaAssetica || false,

    compLuxacao: inicial?.compLuxacao || false,

    compFalhaImplante: inicial?.compFalhaImplante || false,

    compPseudoartrose: inicial?.compPseudoartrose || false,

    compOutro: inicial?.compOutro || "",

    historiaDoencaAtual:
      inicial?.historiaDoencaAtual || inicial?.traumaMecanismo || "",
    houveTrauma: inicial?.houveTrauma ?? Boolean(inicial?.traumaData),
    traumaMecanismo: inicial?.traumaMecanismo || "",

    traumaData: inicial?.traumaData?.split?.("T")?.[0] || "",

    traumaTempo: inicial?.traumaTempo || "",

    cirurgias: inicial?.cirurgias || [],

    pareceres: [],

    culturas: [],

    examesImagem: [],

    altaOrtopediaData: inicial?.altaOrtopediaData?.split?.("T")?.[0] || "",

    altaHospitalarData: inicial?.altaHospitalarData?.split?.("T")?.[0] || "",

    previsaoAltaOrto: inicial?.previsaoAltaOrto || "",

    clinicaMedico: inicial?.clinicaMedico || "",

    aguardaClinica: inicial?.aguardaClinica || false,

    riscoJson: parseSafe<RiscoData>(inicial?.riscoJson, DEFAULT_RISCO),
  });

  const [usaMedicamentos, setUsaMedicamentos] = useState(
    !!(
      inicial?.medicamentosJson ||
      inicial?.medicacoes ||
      inicial?.medicamentosComuns?.length
    ),
  );

  /* ==========================================================================
   * ALERTAS
   * ======================================================================== */

  const alertaHb = useMemo(() => {
    const valor = parseFloat(form.hemoglobinaAdm);

    if (Number.isNaN(valor)) return null;

    if (valor < 10) {
      return {
        msg: `Hb baixa (${valor} g/dL) — pendência pré-op`,
        cor: "text-red-700 bg-red-50 border-red-200",
      };
    }

    return {
      msg: `Hb adequada (${valor} g/dL)`,
      cor: "text-green-700 bg-green-50 border-green-200",
    };
  }, [form.hemoglobinaAdm]);

  const alertaPlaq = useMemo(() => {
    const valor = parseFloat(form.plaquetasAdm);

    if (Number.isNaN(valor)) return null;

    if (valor < 100) {
      return {
        msg: `Plaquetas baixas (${valor}k) — pendência pré-op`,
        cor: "text-red-700 bg-red-50 border-red-200",
      };
    }

    return {
      msg: `Plaquetas adequadas (${valor}k)`,
      cor: "text-green-700 bg-green-50 border-green-200",
    };
  }, [form.plaquetasAdm]);

  const alertaINR = useMemo(() => {
    const valor = parseFloat(form.inrAdm);

    if (Number.isNaN(valor)) return null;

    if (valor > 1.5) {
      return {
        msg: `INR alargado (${valor}) — pendência pré-op`,
        cor: "text-red-700 bg-red-50 border-red-200",
      };
    }

    return {
      msg: `INR normal (${valor})`,
      cor: "text-green-700 bg-green-50 border-green-200",
    };
  }, [form.inrAdm]);

  const medicamentosAlert = useMemo(() => {
    if (form.tipoStatus !== "PRE_OPERATORIO") {
      return [];
    }

    return form.medicamentosJson
      .map((medicamento) => {
        const info = MEDICAMENTOS_SUSPENSO.find(
          (item) => item.codigo === medicamento.codigo,
        );

        if (!info || !medicamento.dataUltimoUso) {
          return null;
        }

        const ultimoUso = new Date(`${medicamento.dataUltimoUso}T12:00:00`);

        const deveSuspender = addDays(ultimoUso, info.diasSuspensao);

        return {
          nome: info.nome,
          obs: info.obs,
          deveSuspender,
          jaPassou: deveSuspender <= new Date(),
        };
      })
      .filter(Boolean);
  }, [form.medicamentosJson, form.tipoStatus]);

  /* ==========================================================================
   * HELPERS
   * ======================================================================== */

  function atualizarCirurgia(
    idx: number,
    campo: keyof Cirurgia,
    valor: string | boolean,
  ) {
    setForm({
      ...form,
      cirurgias: form.cirurgias.map((item, index) =>
        index === idx ? { ...item, [campo]: valor } : item,
      ),
    });
  }

  function adicionarCirurgia() {
    setForm({
      ...form,
      cirurgias: [
        ...form.cirurgias,
        {
          nomeCirurgia: "",
          cirurgiao: "",
          dataCirurgia: "",
          hospitalExterno: "",
          diagnostico: "",
          cid: "",
          intercorrencia: false,
          intercorrenciaDesc: "",
        },
      ],
    });
  }

  function removerCirurgia(idx: number) {
    setForm({
      ...form,
      cirurgias: form.cirurgias.filter((_, index) => index !== idx),
    });
  }

  function adicionarCirurgiaPrevia() {
    setForm({
      ...form,
      prevCirurgiasJson: [
        ...form.prevCirurgiasJson,
        {
          nome: "",
          quando: "",
          cirurgiao: "",
          hospital: "",
        },
      ],
    });
  }

  function atualizarCirurgiaPrevia(
    idx: number,
    campo: keyof CirurgiaPrevia,
    valor: string,
  ) {
    setForm({
      ...form,
      prevCirurgiasJson: form.prevCirurgiasJson.map((item, index) =>
        index === idx ? { ...item, [campo]: valor } : item,
      ),
    });
  }

  function removerCirurgiaPrevia(idx: number) {
    setForm({
      ...form,
      prevCirurgiasJson: form.prevCirurgiasJson.filter(
        (_, index) => index !== idx,
      ),
    });
  }

  function toggleMedicamento(codigo: string) {
    const atual = form.medicamentosJson.find((item) => item.codigo === codigo);

    setForm({
      ...form,
      medicamentosJson: atual
        ? form.medicamentosJson.filter((item) => item.codigo !== codigo)
        : [
            ...form.medicamentosJson,
            {
              codigo,
              dataUltimoUso: "",
            },
          ],
    });
  }

  function atualizarMedicamento(codigo: string, dataUltimoUso: string) {
    setForm({
      ...form,
      medicamentosJson: form.medicamentosJson.map((item) =>
        item.codigo === codigo ? { ...item, dataUltimoUso } : item,
      ),
    });
  }

  function setComorbidade(
    key: keyof ComorbidadesData,
    valor: boolean | string,
  ) {
    setForm({
      ...form,
      comorbidadesJson: {
        ...form.comorbidadesJson,
        [key]: valor,
      },
    });
  }

  function setInfeccao(key: keyof InfeccaoData, valor: boolean | string) {
    setForm({
      ...form,
      infeccaoJson: {
        ...form.infeccaoJson,
        [key]: valor,
      },
    });
  }

  function setRisco(key: keyof RiscoData, valor: boolean | string) {
    setForm({
      ...form,
      riscoJson: {
        ...form.riscoJson,
        [key]: valor,
      },
    });
  }

  function adicionarAlergia() {
    const valor = novoAlergico.trim();

    if (!valor) return;

    if (
      form.alergiasLista.some(
        (item) => item.toLowerCase() === valor.toLowerCase(),
      )
    ) {
      return;
    }

    setForm({
      ...form,
      alergiasLista: [...form.alergiasLista, valor],
      temAlergia: true,
    });

    setNovoAlergico("");
  }

  function removerAlergia(idx: number) {
    const novaLista = form.alergiasLista.filter((_, index) => index !== idx);

    setForm({
      ...form,
      alergiasLista: novaLista,
      temAlergia: novaLista.length > 0,
      alergias: novaLista.join(", "),
    });
  }

  function adicionarParecer() {
    setForm({
      ...form,
      pareceres: [
        ...form.pareceres,
        {
          especialidade: "",
          data: new Date().toISOString().split("T")[0],
          descricao: "",
          medico: "",
        },
      ],
    });
  }

  function atualizarParecer(idx: number, campo: keyof Parecer, valor: string) {
    setForm({
      ...form,
      pareceres: form.pareceres.map((item, index) =>
        index === idx ? { ...item, [campo]: valor } : item,
      ),
    });
  }

  function removerParecer(idx: number) {
    setForm({
      ...form,
      pareceres: form.pareceres.filter((_, index) => index !== idx),
    });
  }

  function adicionarCultura() {
    setForm({
      ...form,
      culturas: [
        ...form.culturas,
        {
          dataColeta: new Date().toISOString().split("T")[0],
          sitio: "",
          resultado: "",
          dataResult: "",
        },
      ],
    });
  }

  function atualizarCultura(idx: number, campo: keyof Cultura, valor: string) {
    setForm({
      ...form,
      culturas: form.culturas.map((item, index) =>
        index === idx ? { ...item, [campo]: valor } : item,
      ),
    });
  }

  function removerCultura(idx: number) {
    setForm({
      ...form,
      culturas: form.culturas.filter((_, index) => index !== idx),
    });
  }

  function adicionarExameImagem() {
    setForm({
      ...form,
      examesImagem: [
        ...form.examesImagem,
        {
          tipo: "radiografia",
          lateralidade: "nao_aplicavel",
          laudo: "",
          dataRealizacao: new Date().toISOString().split("T")[0],
          sitio: "",
          achados: "",
          linkTipo: "WBSRAD",
        },
      ],
    });
  }

  function atualizarExameImagem(
    idx: number,
    campo: keyof ExameImagem,
    valor: string,
  ) {
    setForm({
      ...form,
      examesImagem: form.examesImagem.map((item, index) =>
        index === idx ? { ...item, [campo]: valor } : item,
      ),
    });
  }

  function removerExameImagem(idx: number) {
    setForm({
      ...form,
      examesImagem: form.examesImagem.filter((_, index) => index !== idx),
    });
  }

  function calcularDPO(dataCirurgia: string) {
    if (!dataCirurgia) return "";

    try {
      const diff = differenceInDays(
        new Date(),
        new Date(`${dataCirurgia}T12:00:00`),
      );

      if (diff < 0) return "";
      if (diff === 0) {
        return "0° DPO (dia da cirurgia)";
      }

      return `${diff}° DPO`;
    } catch {
      return "";
    }
  }

  function calcularDiasAlta(dataAlta: string, label: string) {
    if (!dataAlta) return "";

    try {
      const diff = differenceInDays(
        new Date(),
        new Date(`${dataAlta}T12:00:00`),
      );

      if (diff < 0) {
        return `Alta prevista em ${Math.abs(diff)} dia${
          Math.abs(diff) !== 1 ? "s" : ""
        }`;
      }

      if (diff === 0) {
        return `${label} hoje`;
      }

      return `${label} há ${diff} dia${diff !== 1 ? "s" : ""}`;
    } catch {
      return "";
    }
  }

  /* ==========================================================================
   * SALVAMENTO DE RELACIONAMENTOS
   * ======================================================================== */

  async function salvarRelacionamentos(pacienteId: string) {
    await sincronizarLista(
      pacienteId,
      "pareceres",
      form.pareceres,
      (item) => !!item.especialidade && !!item.descricao,
      "parecer",
    );

    await sincronizarLista(
      pacienteId,
      "culturas",
      form.culturas,
      (item) => !!item.dataColeta && !!item.sitio,
      "cultura",
    );

    await sincronizarLista(
      pacienteId,
      "exames-imagem",
      form.examesImagem,
      (item) => !!item.dataRealizacao && !!item.sitio,
      "exame de imagem",
    );
  }

  async function sincronizarLista<T extends { id?: string }>(
    pacienteId: string,
    endpoint: string,
    itens: T[],
    validar: (item: T) => boolean,
    nome: string,
  ) {
    const atuaisResponse = await fetch(
      `/api/pacientes/${pacienteId}/${endpoint}`,
    );

    if (!atuaisResponse.ok) {
      throw new Error(`Erro ao carregar ${nome} existentes`);
    }

    const atuais: T[] = await atuaisResponse.json();

    const idsAtuais = new Set(
      itens.filter((item) => item.id).map((item) => item.id),
    );

    // Exclui do banco os itens que não estão mais no formulário
    await Promise.all(
      atuais
        .filter((item) => item.id && !idsAtuais.has(item.id))
        .map(async (item) => {
          const param =
            endpoint === "pareceres"
              ? "parecerId"
              : endpoint === "culturas"
                ? "culturaId"
                : "exameId";

          const res = await fetch(
            `/api/pacientes/${pacienteId}/${endpoint}?${param}=${item.id}`,
            {
              method: "DELETE",
            },
          );

          if (!res.ok) {
            throw new Error(`Erro ao excluir ${nome}`);
          }
        }),
    );

    // Cria novos ou atualiza existentes
    await Promise.all(
      itens.filter(validar).map(async (item) => {
        const res = await fetch(`/api/pacientes/${pacienteId}/${endpoint}`, {
          method: item.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item),
        });

        if (!res.ok) {
          throw new Error(`Erro ao salvar ${nome}`);
        }
      }),
    );
  }

  /* ==========================================================================
   * PENDÊNCIAS AUTOMÁTICAS
   * ======================================================================== */

  async function criarPendencia(
    pacienteId: string,
    descricao: string,
    tipo: string,
  ) {
    const res = await fetch(`/api/pacientes/${pacienteId}/pendencias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        descricao,
        tipo,
      }),
    });

    if (!res.ok) {
      throw new Error("Erro ao criar pendência automática");
    }
  }

  async function gerarPendenciasAutomaticas(pacienteId: string) {
    const pendencias: Array<{
      descricao: string;
      tipo: string;
    }> = [];

    if (form.aguardaClinica) {
      pendencias.push({
        descricao: "Aguardando avaliação da clínica médica",
        tipo: "CLINICA",
      });
    }

    if (form.tipoStatus === "PRE_OPERATORIO") {
      if (alertaHb) {
        pendencias.push({
          descricao: `Hemoglobina baixa (${form.hemoglobinaAdm} g/dL) — resolver antes da cirurgia`,
          tipo: "RISCO_CIRURGICO",
        });
      }

      if (alertaPlaq) {
        pendencias.push({
          descricao: `Plaquetas baixas (${form.plaquetasAdm}k) — resolver antes da cirurgia`,
          tipo: "RISCO_CIRURGICO",
        });
      }

      if (alertaINR) {
        pendencias.push({
          descricao: `INR alargado (${form.inrAdm}) — resolver antes da cirurgia`,
          tipo: "RISCO_CIRURGICO",
        });
      }
    }

    if (form.temInfeccao && !form.infeccaoJson.culturas) {
      pendencias.push({
        descricao: "Solicitar culturas na abordagem cirúrgica",
        tipo: "CULTURA", // <--- Atualizado
      });
    }

    for (const medicamento of medicamentosAlert) {
      if (!medicamento) continue;

      if (!medicamento.jaPassou) {
        pendencias.push({
          descricao: `${medicamento.nome} — ${medicamento.obs}`,
          tipo: "MEDICAMENTOS", // <--- Atualizado
        });
      }
    }

    await Promise.all(
      pendencias.map((item) =>
        criarPendencia(pacienteId, item.descricao, item.tipo),
      ),
    );
  }

  /* ==========================================================================
   * SUBMIT
   * ======================================================================== */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const alergiasFinal =
        form.alergiasLista.length > 0
          ? form.alergiasLista.join(", ")
          : form.alergias.trim() || null;

      const { pareceres, culturas, examesImagem, ...dadosPaciente } = form;
      const { funcaoRenal, ...comorbidadesJson } = form.comorbidadesJson;

      const payload = {
        ...dadosPaciente,

        cpf: form.cpf || null,

        cirurgioes: form.cirurgioes.filter(Boolean),

        cirurgias:
          form.tipoStatus === "POS_OPERATORIO"
            ? form.cirurgias.filter((item) => item.nomeCirurgia)
            : [],

        alergias: alergiasFinal,

        historiaDoencaAtual: form.historiaDoencaAtual || null,
        houveTrauma: form.houveTrauma,

        traumaData: form.traumaData || null,
        traumaTempo: form.houveTrauma ? form.traumaTempo || null : null,

        comorbidadesJson: JSON.stringify(comorbidadesJson),

        funcaoRenal: funcaoRenal.toUpperCase(),

        prevCirurgiasJson: form.prevCirurgiasOrto
          ? JSON.stringify(form.prevCirurgiasJson)
          : null,

        medicamentosJson: form.medicamentosJson.length
          ? JSON.stringify(form.medicamentosJson)
          : null,

        medicacoes:
          [
            ...form.medicamentosComuns,
            ...(form.medicamentosOutros ? [form.medicamentosOutros] : []),
          ]
            .filter(Boolean)
            .join(", ") || null,

        infeccaoJson: form.temInfeccao
          ? JSON.stringify(form.infeccaoJson)
          : null,

        hemoglobinaAdm: form.hemoglobinaAdm
          ? parseFloat(form.hemoglobinaAdm)
          : null,

        plaquetasAdm: form.plaquetasAdm ? parseFloat(form.plaquetasAdm) : null,

        inrAdm: form.inrAdm ? parseFloat(form.inrAdm) : null,

        pps: form.pps ? parseInt(form.pps) : null,

        altaOrtopediaData: form.altaOrtopediaData || null,

        altaHospitalarData: form.altaHospitalarData || null,

        previsaoAltaOrto: form.previsaoAltaOrto || null,

        clinicaMedico: form.clinicaMedico || null,

        aguardaClinica: form.aguardaClinica,

        riscoJson: JSON.stringify(form.riscoJson),
      };

      const url =
        modo === "criar" ? "/api/pacientes" : `/api/pacientes/${inicial?.id}`;

      const method = modo === "criar" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error || "Erro ao salvar paciente");
      }

      const paciente = await res.json();

      /* ---------------------------------------------------------------
       * Fotos pendentes
       * ------------------------------------------------------------- */

      if (modo === "criar" && fotosPendentesRef.current.length > 0) {
        await Promise.all(
          fotosPendentesRef.current.map(async (foto) => {
            const fd = new FormData();

            fd.append("file", foto.file);

            fd.append("tipo", foto.tipo);

            if (foto.dataFoto) {
              fd.append("dataFoto", foto.dataFoto);
            }

            if (foto.descricao) {
              fd.append("descricao", foto.descricao);
            }

            const fotoRes = await fetch(`/api/pacientes/${paciente.id}/fotos`, {
              method: "POST",
              body: fd,
            });

            if (!fotoRes.ok) {
              throw new Error("Erro ao salvar foto");
            }
          }),
        );
      }

      /* ---------------------------------------------------------------
       * Relações
       * ------------------------------------------------------------- */

      if (modo === "criar") {
        await salvarRelacionamentos(paciente.id);
      }

      /* ---------------------------------------------------------------
       * Pendências automáticas
       * ------------------------------------------------------------- */

      if (modo === "criar") {
        await gerarPendenciasAutomaticas(paciente.id);
      }

      toast.success(
        modo === "criar" ? "Paciente cadastrado!" : "Dados atualizados!",
      );

      router.push(`/pacientes/${paciente.id}`);

      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================================
   * VALORES CALCULADOS
   * ======================================================================== */

  const idade = calcularIdade(form.dataNascimento);

  const tempoInternacao = calcularTempoInternacao(form.dataInternacao);

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-3"
    >
      {/* ================================================================
          1. DADOS DO PACIENTE
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Dados do Paciente
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nome">Nome completo *</Label>

            <Input
              id="nome"
              value={form.nome}
              onChange={(e) =>
                setForm({
                  ...form,
                  nome: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>

            <Input
              id="cpf"
              value={form.cpf}
              onChange={(e) =>
                setForm({
                  ...form,
                  cpf: formatarCPF(e.target.value),
                })
              }
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="registro">Registro hospitalar *</Label>

            <Input
              id="registro"
              value={form.registroHospitalar}
              onChange={(e) =>
                setForm({
                  ...form,
                  registroHospitalar: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="leito">Leito *</Label>

            <Input
              id="leito"
              value={form.leito}
              onChange={(e) =>
                setForm({
                  ...form,
                  leito: e.target.value,
                })
              }
              placeholder="Ex: 201A"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Data de internação *</Label>

            <Input
              type="date"
              value={form.dataInternacao}
              onChange={(e) =>
                setForm({
                  ...form,
                  dataInternacao: e.target.value,
                })
              }
              required
            />

            {tempoInternacao && (
              <p className="text-xs font-medium text-blue-600">
                🏥 {tempoInternacao}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Data de nascimento</Label>

            <Input
              type="date"
              value={form.dataNascimento}
              onChange={(e) =>
                setForm({
                  ...form,
                  dataNascimento: e.target.value,
                })
              }
            />

            {idade && (
              <p className="text-xs font-medium text-slate-500">👤 {idade}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          2. DIAGNÓSTICO
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Diagnóstico
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Diagnóstico *</Label>

            <Input
              value={form.diagnostico}
              onChange={(e) =>
                setForm({
                  ...form,
                  diagnostico: e.target.value,
                })
              }
              placeholder="Ex: Fratura transtrocantérica do fêmur direito"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>CID-10</Label>

            <Input
              value={form.cid}
              onChange={(e) =>
                setForm({
                  ...form,
                  cid: e.target.value,
                })
              }
              placeholder="Ex: S72.1"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Subespecialidade</Label>

            <Select
              value={form.subespecialidade}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  subespecialidade: value || "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>

              <SelectContent>
                {SUBESPECIALIDADES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Cirurgião(s) responsável(is)</Label>

            <CirurgiaoMultiSelect
              value={form.cirurgioes.filter(Boolean)}
              onChange={(value) =>
                setForm({
                  ...form,
                  cirurgioes: value.length ? value : [""],
                })
              }
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Status cirúrgico *</Label>

            <div className="flex gap-4">
              {[
                {
                  value: "PRE_OPERATORIO",
                  label: "Pré-operatório",
                },
                {
                  value: "POS_OPERATORIO",
                  label: "Pós-operatório",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="tipoStatus"
                    value={option.value}
                    checked={form.tipoStatus === option.value}
                    onChange={() =>
                      setForm({
                        ...form,
                        tipoStatus: option.value,
                      })
                    }
                    className="accent-blue-600"
                  />

                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          3. CIRURGIA ATUAL / CIRURGIAS REALIZADAS
      ================================================================ */}

      {form.tipoStatus === "POS_OPERATORIO" && (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Cirurgias realizadas
            </CardTitle>
          </CardHeader>

          <CardContent className="px-5 py-4 space-y-4">
            {form.cirurgias.map((cirurgia, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Cirurgia {idx + 1}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerCirurgia(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Nome da cirurgia</Label>

                    <Input
                      value={cirurgia.nomeCirurgia}
                      onChange={(e) =>
                        atualizarCirurgia(idx, "nomeCirurgia", e.target.value)
                      }
                      placeholder="Ex: Artroplastia Total do Quadril"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Cirurgião(s)</Label>

                    <CirurgiaoMultiSelect
                      value={
                        cirurgia.cirurgiao
                          ? cirurgia.cirurgiao
                              .split(",")
                              .map((nome) => nome.trim())
                              .filter(Boolean)
                          : []
                      }
                      onChange={(value) =>
                        atualizarCirurgia(idx, "cirurgiao", value.join(", "))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Data da cirurgia</Label>

                    <Input
                      type="date"
                      value={cirurgia.dataCirurgia}
                      onChange={(e) =>
                        atualizarCirurgia(idx, "dataCirurgia", e.target.value)
                      }
                    />

                    {cirurgia.dataCirurgia && (
                      <p className="text-xs font-semibold text-blue-700">
                        {calcularDPO(cirurgia.dataCirurgia)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Diagnóstico cirúrgico</Label>

                    <Input
                      value={cirurgia.diagnostico || ""}
                      onChange={(e) =>
                        atualizarCirurgia(idx, "diagnostico", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>CID</Label>

                    <Input
                      value={cirurgia.cid || ""}
                      onChange={(e) =>
                        atualizarCirurgia(idx, "cid", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Hospital externo</Label>

                    <Input
                      value={cirurgia.hospitalExterno || ""}
                      onChange={(e) =>
                        atualizarCirurgia(
                          idx,
                          "hospitalExterno",
                          e.target.value,
                        )
                      }
                      placeholder="Deixar em branco se realizada neste hospital"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={cirurgia.intercorrencia || false}
                        onCheckedChange={(value) =>
                          atualizarCirurgia(
                            idx,
                            "intercorrencia",
                            Boolean(value),
                          )
                        }
                      />

                      <span className="text-sm font-medium">
                        Houve intercorrência cirúrgica
                      </span>
                    </label>
                  </div>

                  {cirurgia.intercorrencia && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Descrição da intercorrência</Label>

                      <Textarea
                        value={cirurgia.intercorrenciaDesc || ""}
                        onChange={(e) =>
                          atualizarCirurgia(
                            idx,
                            "intercorrenciaDesc",
                            e.target.value,
                          )
                        }
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={adicionarCirurgia}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Adicionar cirurgia
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          4. SUBESPECIALIDADE / COMORBIDADES
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Comorbidades
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COMORBIDADES_OPCOES.map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer select-none items-center gap-2"
              >
                <Checkbox
                  checked={Boolean(form.comorbidadesJson[key])}
                  onCheckedChange={(value) =>
                    setComorbidade(key, Boolean(value))
                  }
                />

                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Outras comorbidades</Label>

            <Input
              value={form.comorbidadesJson.outros}
              onChange={(e) => setComorbidade("outros", e.target.value)}
              placeholder="Ex: Insuficiência cardíaca, DPOC..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Detalhes adicionais</Label>

            <Textarea
              value={form.comorbidades}
              onChange={(e) =>
                setForm({
                  ...form,
                  comorbidades: e.target.value,
                })
              }
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          5. CIRURGIAS PRÉVIAS
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Cirurgias ortopédicas prévias
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 space-y-4">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={form.prevCirurgiasOrto}
              onCheckedChange={(value) =>
                setForm({
                  ...form,
                  prevCirurgiasOrto: Boolean(value),
                  prevCirurgiasJson: Boolean(value)
                    ? form.prevCirurgiasJson
                    : [],
                })
              }
            />

            <span className="text-sm font-medium">
              Paciente possui cirurgias ortopédicas prévias
            </span>
          </label>

          {form.prevCirurgiasOrto && (
            <div className="space-y-3">
              {form.prevCirurgiasJson.map((cirurgia, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Cirurgia prévia {idx + 1}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerCirurgiaPrevia(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Procedimento</Label>

                      <Input
                        value={cirurgia.nome}
                        onChange={(e) =>
                          atualizarCirurgiaPrevia(idx, "nome", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Data / ano</Label>

                      <Input
                        value={cirurgia.quando}
                        onChange={(e) =>
                          atualizarCirurgiaPrevia(idx, "quando", e.target.value)
                        }
                        placeholder="Ex: jan/2020"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Cirurgião(s)</Label>

                      <CirurgiaoMultiSelect
                        value={
                          cirurgia.cirurgiao
                            ? cirurgia.cirurgiao
                                .split(",")
                                .map((nome) => nome.trim())
                                .filter(Boolean)
                            : []
                        }
                        onChange={(value) =>
                          atualizarCirurgiaPrevia(
                            idx,
                            "cirurgiao",
                            value.join(", "),
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Hospital</Label>

                      <Input
                        value={cirurgia.hospital || ""}
                        onChange={(e) =>
                          atualizarCirurgiaPrevia(
                            idx,
                            "hospital",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarCirurgiaPrevia}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Adicionar cirurgia prévia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          6. MEDICAMENTOS
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Medicamentos de uso contínuo
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 space-y-4">
          <SimNao
            label="O paciente faz uso de medicamentos?"
            value={usaMedicamentos}
            onChange={(usar) => {
              setUsaMedicamentos(usar);

              if (!usar) {
                setForm({
                  ...form,
                  medicamentosJson: [],
                  medicamentosComuns: [],
                  medicamentosOutros: "",
                  medicacoes: "",
                });
              }
            }}
          />

          {usaMedicamentos && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Marque os medicamentos com suspensão pré-operatória e informe o
                último uso.
              </p>

              <div className="space-y-2">
                {MEDICAMENTOS_SUSPENSO.map((medicamento) => {
                  const usado = form.medicamentosJson.find(
                    (item) => item.codigo === medicamento.codigo,
                  );

                  return (
                    <div
                      key={medicamento.codigo}
                      className={`rounded-lg border p-3 ${
                        usado
                          ? "border-amber-300 bg-amber-50"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={Boolean(usado)}
                          onCheckedChange={() =>
                            toggleMedicamento(medicamento.codigo)
                          }
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {medicamento.nome}
                          </p>

                          <p className="text-xs font-medium text-amber-700">
                            Suspender: {medicamento.obs}
                          </p>

                          {usado && (
                            <div className="mt-2 flex items-center gap-2">
                              <Label className="whitespace-nowrap text-xs text-slate-600">
                                Último uso:
                              </Label>

                              <Input
                                type="date"
                                value={usado.dataUltimoUso}
                                onChange={(e) =>
                                  atualizarMedicamento(
                                    medicamento.codigo,
                                    e.target.value,
                                  )
                                }
                                className="h-7 w-auto text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {medicamentosAlert.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">
                    Status de suspensão
                  </p>

                  {medicamentosAlert.map(
                    (alerta, idx) =>
                      alerta && (
                        <div
                          key={idx}
                          className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                            alerta.jaPassou
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {alerta.jaPassou ? "✓" : "⚠️"} {alerta.nome} —{" "}
                          {alerta.obs}
                        </div>
                      ),
                  )}
                </div>
              )}

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <Label>Medicamentos comuns</Label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MEDICAMENTOS_COMUNS.map((medicamento) => (
                    <label
                      key={medicamento}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <Checkbox
                        checked={form.medicamentosComuns.includes(medicamento)}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            medicamentosComuns: checked
                              ? [...form.medicamentosComuns, medicamento]
                              : form.medicamentosComuns.filter(
                                  (item) => item !== medicamento,
                                ),
                          })
                        }
                      />

                      <span className="text-sm">{medicamento}</span>
                    </label>
                  ))}
                </div>

                <Input
                  value={form.medicamentosOutros}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      medicamentosOutros: e.target.value,
                    })
                  }
                  placeholder="Outros medicamentos..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          7. ALERGIAS
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Alergias a medicamentos
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 space-y-3">
          <SimNao
            label="Paciente tem alergias?"
            value={form.temAlergia}
            onChange={(tem) => {
              setForm({
                ...form,
                temAlergia: tem,
                alergiasLista: tem ? form.alergiasLista : [],
                alergias: tem ? form.alergias : "",
              });
            }}
          />

          {form.temAlergia && (
            <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-bold text-red-700">
                ⚠️ ALERTA — alergia medicamentosa
              </p>

              <div className="flex gap-2">
                <Input
                  value={novoAlergico}
                  onChange={(e) => setNovoAlergico(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionarAlergia();
                    }
                  }}
                  placeholder="Ex: Dipirona"
                  className="border-red-200 bg-white"
                />

                <Button
                  type="button"
                  onClick={adicionarAlergia}
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {form.alergiasLista.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.alergiasLista.map((alergia, idx) => (
                    <span
                      key={`${alergia}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700"
                    >
                      {alergia}

                      <button
                        type="button"
                        onClick={() => removerAlergia(idx)}
                        className="text-red-400 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          8. LABORATÓRIO
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Exames laboratoriais — Admissão
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Hemoglobina (g/dL)</Label>

            <Input
              type="number"
              step="0.1"
              value={form.hemoglobinaAdm}
              onChange={(e) =>
                setForm({
                  ...form,
                  hemoglobinaAdm: e.target.value,
                })
              }
            />

            {alertaHb && (
              <p
                className={`rounded border px-2 py-1 text-xs font-medium ${alertaHb.cor}`}
              >
                {alertaHb.msg}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Plaquetas (mil/μL)</Label>

            <Input
              type="number"
              step="1"
              value={form.plaquetasAdm}
              onChange={(e) =>
                setForm({
                  ...form,
                  plaquetasAdm: e.target.value,
                })
              }
            />

            {alertaPlaq && (
              <p
                className={`rounded border px-2 py-1 text-xs font-medium ${alertaPlaq.cor}`}
              >
                {alertaPlaq.msg}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>INR</Label>

            <Input
              type="number"
              step="0.01"
              value={form.inrAdm}
              onChange={(e) =>
                setForm({
                  ...form,
                  inrAdm: e.target.value,
                })
              }
            />

            {alertaINR && (
              <p
                className={`rounded border px-2 py-1 text-xs font-medium ${alertaINR.cor}`}
              >
                {alertaINR.msg}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
      9. INFECÇÃO
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Infecção ortopédica
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 space-y-4">
          <SimNao
            label="Paciente com infecção ortopédica?"
            value={form.temInfeccao}
            onChange={(temInfeccao) => {
              setForm({
                ...form,
                temInfeccao,
              });
            }}
          />

          {form.temInfeccao && (
            <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-4">
              {/* Tempo de infecção */}
              <div className="space-y-1.5">
                <Label>Tempo de infecção / sintomas</Label>

                <Input
                  value={form.infeccaoJson.tempo || ""}
                  onChange={(e) => setInfeccao("tempo", e.target.value)}
                  placeholder="Ex: 5 dias"
                />
              </div>

              {/* Febre */}
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={form.infeccaoJson.febre}
                  onCheckedChange={(value) =>
                    setInfeccao("febre", Boolean(value))
                  }
                />

                <span className="text-sm">Está tendo febre?</span>
              </label>

              {/* Antibiótico atual */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Antibiótico atual</Label>

                  <Input
                    value={form.infeccaoJson.antibiotico || ""}
                    onChange={(e) => setInfeccao("antibiotico", e.target.value)}
                    placeholder="Ex: Vancomicina 1g EV 12/12h"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Começou quando?</Label>

                  <Input
                    value={form.infeccaoJson.inicio || ""}
                    onChange={(e) => setInfeccao("inicio", e.target.value)}
                    placeholder="Ex: há 3 dias"
                  />
                </div>
              </div>

              {/* Antibióticos prévios */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Usou outro antibiótico? Qual?</Label>

                  <Input
                    value={form.infeccaoJson.antibioticoPrevio || ""}
                    onChange={(e) =>
                      setInfeccao("antibioticoPrevio", e.target.value)
                    }
                    placeholder="Ex: Ceftriaxona"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Quando?</Label>

                  <Input
                    value={form.infeccaoJson.antibioticoPrevioQuando || ""}
                    onChange={(e) =>
                      setInfeccao("antibioticoPrevioQuando", e.target.value)
                    }
                    placeholder="Ex: 3 meses atrás"
                  />
                </div>
              </div>

              {/* A coleta e o resultado detalhados são gerenciados pela aba Laboratório após o cadastro. */}
              {modo === "criar" && (
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={form.infeccaoJson.culturas}
                      onCheckedChange={(value) =>
                        setInfeccao("culturas", Boolean(value))
                      }
                    />

                    <span className="text-sm font-medium">
                      Cultura coletada/solicitada
                    </span>
                  </label>

                  {form.infeccaoJson.culturas ? (
                    <div className="space-y-1.5">
                      <Label>Resultado da cultura</Label>

                      <Input
                        value={form.infeccaoJson.culturasResult || ""}
                        onChange={(e) =>
                          setInfeccao("culturasResult", e.target.value)
                        }
                        placeholder="Ex: Staphylococcus aureus"
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <span className="mt-0.5 text-amber-600">⚠</span>

                      <div>
                        <p className="text-xs font-medium text-amber-800">
                          Cultura pendente
                        </p>

                        <p className="mt-0.5 text-xs text-amber-700">
                          Pendência: solicitar culturas na abordagem cirúrgica.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dreno — apenas pós-operatório */}
              {form.tipoStatus === "POS_OPERATORIO" && (
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={form.infeccaoJson.dreno}
                      onCheckedChange={(value) =>
                        setInfeccao("dreno", Boolean(value))
                      }
                    />

                    <span className="text-sm">Tem dreno?</span>
                  </label>

                  {form.infeccaoJson.dreno && (
                    <div className="space-y-1.5">
                      <Label>Valor do dreno (avaliar diariamente)</Label>

                      <Input
                        value={form.infeccaoJson.drenoValor || ""}
                        onChange={(e) =>
                          setInfeccao("drenoValor", e.target.value)
                        }
                        placeholder="Ex: 150 ml"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          10. CULTURAS
      ================================================================ */}

      {modo === "criar" && (
        <>
          <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Culturas
              </CardTitle>
            </CardHeader>

            <CardContent className="px-5 py-4 space-y-3">
              {form.culturas.map((cultura, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Cultura {idx + 1}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerCultura(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Data da coleta</Label>

                      <Input
                        type="date"
                        value={cultura.dataColeta}
                        onChange={(e) =>
                          atualizarCultura(idx, "dataColeta", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Sítio</Label>

                      <Input
                        value={cultura.sitio}
                        onChange={(e) =>
                          atualizarCultura(idx, "sitio", e.target.value)
                        }
                        placeholder="Ex: secreção profunda"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Resultado</Label>

                      <Input
                        value={cultura.resultado}
                        onChange={(e) =>
                          atualizarCultura(idx, "resultado", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Data do resultado</Label>

                      <Input
                        type="date"
                        value={cultura.dataResult}
                        onChange={(e) =>
                          atualizarCultura(idx, "dataResult", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarCultura}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Adicionar cultura
              </Button>
            </CardContent>
          </Card>

          {/* ================================================================
          11. PARECERES
      ================================================================ */}

          <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Pareceres de especialidades
              </CardTitle>
            </CardHeader>

            <CardContent className="px-5 py-4 space-y-3">
              {form.pareceres.map((parecer, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Parecer {idx + 1}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerParecer(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Especialidade</Label>

                      <Select
                        value={parecer.especialidade}
                        onValueChange={(value) =>
                          atualizarParecer(idx, "especialidade", value ?? "")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>

                        <SelectContent>
                          {PARECER_ESPECIALIDADES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Data</Label>

                      <Input
                        type="date"
                        value={parecer.data}
                        onChange={(e) =>
                          atualizarParecer(idx, "data", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Médico</Label>

                      <Input
                        value={parecer.medico}
                        onChange={(e) =>
                          atualizarParecer(idx, "medico", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Parecer</Label>

                      <Textarea
                        value={parecer.descricao}
                        onChange={(e) =>
                          atualizarParecer(idx, "descricao", e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarParecer}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Adicionar parecer
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* ================================================================
          12. HISTÓRIA DA DOENÇA ATUAL
        ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            História da Doença Atual
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>História da doença atual</Label>

            <Textarea
              rows={4}
              value={form.historiaDoencaAtual}
              onChange={(e) =>
                setForm({
                  ...form,
                  historiaDoencaAtual: e.target.value,
                })
              }
              placeholder="Descreva o início, evolução e contexto clínico atual..."
            />
          </div>

          <div className="sm:col-span-2">
            <SimNao
              label="Houve trauma?"
              value={form.houveTrauma}
              onChange={(value) => setForm({ ...form, houveTrauma: value })}
            />
          </div>

          {form.houveTrauma && (
            <>
              <div className="space-y-1.5">
                <Label>Data do trauma</Label>

                <Input
                  type="date"
                  value={form.traumaData}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      traumaData: e.target.value,
                      traumaTempo: e.target.value
                        ? `${differenceInDays(new Date(), new Date(`${e.target.value}T00:00:00`))} dias`
                        : "",
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tempo do trauma</Label>
                <p className="text-sm text-slate-700 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  {form.traumaTempo || "Informe a data do trauma"}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          13. PPS
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            PPS — Escala de Performance Paliativa
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 space-y-3">
          <p className="text-xs text-slate-500">
            Avalia o estado funcional do paciente.
          </p>

          <Select
            value={form.pps}
            onValueChange={(value) =>
              setForm({
                ...form,
                pps: value || "",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar nível PPS..." />
            </SelectTrigger>

            <SelectContent>
              {PPS_NIVEIS.map((nivel) => (
                <SelectItem key={nivel.valor} value={String(nivel.valor)}>
                  {nivel.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {form.pps && (
            <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
              PPS: {form.pps}%
            </p>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          14. ALTA
      ================================================================ */}

      {form.tipoStatus === "POS_OPERATORIO" && (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Alta e follow-up
            </CardTitle>
          </CardHeader>

          <CardContent className="px-5 py-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Alta da Ortopedia</Label>

              <Input
                type="date"
                value={form.altaOrtopediaData}
                onChange={(e) =>
                  setForm({
                    ...form,
                    altaOrtopediaData: e.target.value,
                  })
                }
              />

              {form.altaOrtopediaData && (
                <p className="text-xs font-medium text-blue-600">
                  {calcularDiasAlta(
                    form.altaOrtopediaData,
                    "Alta da Ortopedia",
                  )}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Alta hospitalar</Label>

              <Input
                type="date"
                value={form.altaHospitalarData}
                onChange={(e) =>
                  setForm({
                    ...form,
                    altaHospitalarData: e.target.value,
                  })
                }
              />

              {form.altaHospitalarData && (
                <p className="text-xs font-medium text-green-600">
                  {calcularDiasAlta(form.altaHospitalarData, "Alta hospitalar")}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Previsão de alta da Ortopedia</Label>

              <Input
                value={form.previsaoAltaOrto}
                onChange={(e) =>
                  setForm({
                    ...form,
                    previsaoAltaOrto: e.target.value,
                  })
                }
                placeholder="Ex: 2 dias após cirurgia"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          15. CLÍNICA MÉDICA
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Acompanhamento pela Clínica Médica
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 space-y-4">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={form.aguardaClinica}
              onCheckedChange={(value) =>
                setForm({
                  ...form,
                  aguardaClinica: Boolean(value),
                  clinicaMedico: Boolean(value) ? "" : form.clinicaMedico,
                })
              }
            />

            <span className="text-sm font-medium text-amber-700">
              Aguarda avaliação da clínica médica
            </span>
          </label>

          {form.aguardaClinica && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs font-medium text-amber-700">
                Será gerada uma pendência para avaliação pela Clínica Médica.
              </p>
            </div>
          )}

          {!form.aguardaClinica && (
            <div className="space-y-1.5">
              <Label>Médico(a) da Clínica Médica</Label>

              <Select
                value={form.clinicaMedico}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    clinicaMedico: value === "__nenhum" ? "" : (value ?? ""),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="__nenhum">Sem acompanhamento</SelectItem>

                  {CLINICA_MEDICOS.map((medico) => (
                    <SelectItem key={medico} value={medico}>
                      {medico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
      16. RISCO CIRÚRGICO
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Risco Cirúrgico — Cardiologia
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4 space-y-4">
          {/* Risco concluído? */}
          <SimNao
            label="Risco cirúrgico concluído?"
            value={form.riscoJson.concluido}
            onChange={(concluido) => setRisco("concluido", concluido)}
          />

          {/* ============================================================
              RISCO CONCLUÍDO
          ============================================================ */}

          {form.riscoJson.concluido && (
            <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Data */}
                <div className="space-y-1.5">
                  <Label>Data da avaliação de cardiologia</Label>

                  <Input
                    type="date"
                    value={form.riscoJson.data || ""}
                    onChange={(e) => setRisco("data", e.target.value)}
                  />
                </div>

                {/* Cardiologista */}
                <div className="space-y-1.5">
                  <Label>Nome do cardiologista</Label>

                  <Input
                    value={form.riscoJson.cardiologista || ""}
                    onChange={(e) => setRisco("cardiologista", e.target.value)}
                    placeholder="Nome do cardiologista"
                  />
                </div>
              </div>

              {/* Classificação */}
              <div className="space-y-1.5">
                <Label>Classificação do risco</Label>

                <div className="flex flex-wrap gap-4">
                  {["leve", "moderado", "alto"].map((nivel) => (
                    <label
                      key={nivel}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="riscoNivel"
                        checked={form.riscoJson.nivel === nivel}
                        onChange={() => setRisco("nivel", nivel)}
                        className="accent-blue-600"
                      />

                      <span className="text-sm capitalize">{nivel}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* UTI pós-operatória */}
              <SimNao
                label="Houve indicação de UTI pós-operatória?"
                value={form.riscoJson.indicaUTI}
                onChange={(indicaUTI) => setRisco("indicaUTI", indicaUTI)}
              />

              {form.riscoJson.indicaUTI && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <span className="mt-0.5 text-red-600">⚠</span>

                  <div>
                    <p className="text-xs font-medium text-red-700">
                      UTI pós-operatória indicada
                    </p>

                    <p className="mt-0.5 text-xs text-red-600">
                      A etiqueta "UTI PÓS-OPERATÓRIA" será exibida no
                      prontuário.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              RISCO NÃO CONCLUÍDO
          ============================================================ */}

          {!form.riscoJson.concluido && (
            <div className="space-y-4">
              {/* ECO */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-600">
                  Ecocardiograma
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Data do ecocardiograma (se já realizou)</Label>

                    <Input
                      type="date"
                      value={form.riscoJson.dataEco || ""}
                      onChange={(e) => setRisco("dataEco", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Resultado do ecocardiograma</Label>

                    <Input
                      value={form.riscoJson.resultadoEco || ""}
                      onChange={(e) => setRisco("resultadoEco", e.target.value)}
                      placeholder="Ex: FE 62%, sem alterações relevantes"
                    />
                  </div>
                </div>

                {!form.riscoJson.dataEco && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                    <span>⚠</span>
                    <span>Falta realizar ecocardiograma</span>
                  </div>
                )}

                {form.riscoJson.dataEco && !form.riscoJson.resultadoEco && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                    <span>⚠</span>
                    <span>
                      Ecocardiograma realizado, mas sem resultado registrado
                    </span>
                  </div>
                )}
              </div>

              {/* ECG */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-600">
                  Eletrocardiograma (ECG)
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Data do ECG (se já realizou)</Label>

                    <Input
                      type="date"
                      value={form.riscoJson.dataEcg || ""}
                      onChange={(e) => setRisco("dataEcg", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Resultado do ECG</Label>

                    <Input
                      value={form.riscoJson.resultadoEcg || ""}
                      onChange={(e) => setRisco("resultadoEcg", e.target.value)}
                      placeholder="Ex: ritmo sinusal, sem alterações"
                    />
                  </div>
                </div>

                {!form.riscoJson.dataEcg && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                    <span>⚠</span>
                    <span>Falta realizar ECG</span>
                  </div>
                )}

                {form.riscoJson.dataEcg && !form.riscoJson.resultadoEcg && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                    <span>⚠</span>
                    <span>ECG realizado, mas sem resultado registrado</span>
                  </div>
                )}
              </div>

              {/* Pendências automáticas */}
              {form.tipoStatus === "PRE_OPERATORIO" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <span className="mt-0.5 text-amber-600">⚠</span>

                  <div>
                    <p className="text-xs font-medium text-amber-800">
                      Exames pendentes
                    </p>

                    <p className="mt-0.5 text-xs text-amber-700">
                      Pendências serão geradas para exames faltantes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          17. FUNÇÃO RENAL
      ================================================================ */}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Função renal
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 py-4">
          <Select
            value={form.comorbidadesJson.funcaoRenal}
            onValueChange={(value) =>
              setComorbidade("funcaoRenal", value || "normal")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="reduzida">Reduzida</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ================================================================
          18. EXAMES DE IMAGEM
      ================================================================ */}
      {modo === "criar" && (
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 px-5 py-4 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Exames de imagem
            </CardTitle>
          </CardHeader>

          <CardContent className="px-5 py-4 space-y-3">
            {form.examesImagem.map((exame, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 p-4 bg-slate-50/50"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Exame {idx + 1}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerExameImagem(idx)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Tipo de exame *</Label>

                    <Select
                      value={exame.tipo}
                      onValueChange={(value) =>
                        atualizarExameImagem(idx, "tipo", value ?? "")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>

                      <SelectContent>
                        {TIPOS_EXAME.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Data da realização *</Label>

                    <Input
                      type="date"
                      value={exame.dataRealizacao}
                      onChange={(e) =>
                        atualizarExameImagem(
                          idx,
                          "dataRealizacao",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Sítio / Região examinada *</Label>

                    <Input
                      value={exame.sitio}
                      onChange={(e) =>
                        atualizarExameImagem(idx, "sitio", e.target.value)
                      }
                      placeholder="Ex: joelho direito, tórax..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Lateralidade</Label>

                    <Select
                      value={exame.lateralidade}
                      onValueChange={(value) =>
                        atualizarExameImagem(
                          idx,
                          "lateralidade",
                          value ?? "nao_aplicavel",
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="nao_aplicavel">
                          Não se aplica
                        </SelectItem>
                        <SelectItem value="direita">Direita</SelectItem>
                        <SelectItem value="esquerda">Esquerda</SelectItem>
                        <SelectItem value="bilateral">Bilateral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Achados</Label>

                    <Textarea
                      value={exame.achados}
                      onChange={(e) =>
                        atualizarExameImagem(idx, "achados", e.target.value)
                      }
                      rows={3}
                      placeholder="Descreva os principais achados do exame..."
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Laudo</Label>

                    <Textarea
                      value={exame.laudo}
                      onChange={(e) =>
                        atualizarExameImagem(idx, "laudo", e.target.value)
                      }
                      rows={4}
                      placeholder="Digite o laudo do exame..."
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Hospital de origem</Label>

                    <Select
                      value={exame.linkTipo}
                      onValueChange={(value) =>
                        atualizarExameImagem(idx, "linkTipo", value ?? "WBSRAD")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>

                      <SelectContent>
                        {HOSPITAIS_EXAMES.map((hospital) => (
                          <SelectItem
                            key={hospital.value}
                            value={hospital.value}
                          >
                            {hospital.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={adicionarExameImagem}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Adicionar exame
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          19. FOTOS DA ADMISSÃO
      ================================================================ */}
      {modo === "criar" && (
        <div className="space-y-4">
          {/* Radiografias da admissão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                🩻 Radiografias da admissão
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <SimNao
                label="Deseja inserir radiografias?"
                value={insereRadiografias}
                onChange={(novoValor) => {
                  setInsereRadiografias(novoValor);

                  if (!novoValor) {
                    atualizarFotosPendentesPorTipo("RADIOGRAFIA", []);
                  }
                }}
              />

              {insereRadiografias && (
                <FotoUpload
                  tipo="RADIOGRAFIA"
                  titulo="Adicionar radiografias da admissão"
                  mostrarGaleria={false}
                  pacienteId={undefined}
                  onFotosPendentes={(fotos) =>
                    atualizarFotosPendentesPorTipo("RADIOGRAFIA", fotos)
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Fotos de lesões de pele */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                🩹 Fotos de lesões de pele
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <SimNao
                label="Deseja inserir foto de lesão?"
                value={insereLesaoPele}
                onChange={(novoValor) => {
                  setInsereLesaoPele(novoValor);

                  if (!novoValor) {
                    atualizarFotosPendentesPorTipo("LESAO_PELE", []);
                  }
                }}
              />

              {insereLesaoPele && (
                <FotoUpload
                  tipo="LESAO_PELE"
                  titulo="Adicionar foto de lesão"
                  mostrarGaleria={false}
                  pacienteId={undefined}
                  onFotosPendentes={(fotos) =>
                    atualizarFotosPendentesPorTipo("LESAO_PELE", fotos)
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================
          AÇÕES
      ================================================================ */}

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 pb-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="min-w-[140px] bg-blue-600 hover:bg-blue-700"
        >
          {loading
            ? "Salvando..."
            : modo === "criar"
              ? "Cadastrar Paciente"
              : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}
