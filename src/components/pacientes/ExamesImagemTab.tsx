"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  X,
  Calendar,
  FileText,
  Activity,
} from "lucide-react";

import FotoUpload, { FotoSalva, FotoTipo } from "@/components/FotoUpload";

const HOSPITAIS_EXAMES = [
  {
    id: "WBSRAD",
    nome: "Hospital Memorial (WBSRad)",
    url: "https://www.wbsrad.com.br/site/",
    login: "hospitalmemorial@exame.com.br",
    senha: "123456",
  },
  {
    id: "EPACS",
    nome: "Walfredo Gurgel (EPACS)",
    url: "https://app.epacs.com.br/router/login/",
    login: "medicocmt1@gmail.com",
    senha: "medico",
  },
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

const EXAMES_ALTA_COMPLEXIDADE = [
  "ecg",
  "ecocardiograma",
  "tomografia",
  "ressonancia",
  "ultrassonografia",
];

const HOSPITAIS_ORIGEM = [
  { value: "WBSRAD", label: "Hospital Memorial (WBSRad)" },
  { value: "EPACS", label: "Walfredo Gurgel (EPACS)" },
  { value: "EXTERNO", label: "Outro / Externo" },
];

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white";
const textareaCls = inputCls + " resize-none";

type Props = {
  pacienteId: string;
  examesIniciais: any[];
  fotosIniciais: any[];
  evolucoes: any[];
};

const normalizarTipo = (tipo: string): FotoTipo | string => {
  const valor = (tipo || "").toLowerCase();

  if (valor.includes("radiografia") || valor === "rx") return "RADIOGRAFIA";
  if (valor.includes("lesao")) return "LESAO_PELE";
  if (valor.includes("curativo")) return "CURATIVO";

  return tipo;
};

function formatarData(data: string | Date | null | undefined) {
  if (!data) return "";

  const dataObj = data instanceof Date ? data : new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return "";
  }

  return format(dataObj, "dd/MM/yyyy");
}

export default function ExamesImagemTab({
  pacienteId,
  examesIniciais,
  fotosIniciais,
  evolucoes = [],
}: Props) {
  const [exames, setExames] = useState(examesIniciais || []);
  const [fotos, setFotos] = useState<FotoSalva[]>(
    (fotosIniciais || []).map((foto) => ({
      ...foto,
      tipo: normalizarTipo(foto.tipo),
    })),
  );

  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  const [mostrarUploadRx, setMostrarUploadRx] = useState(false);
  const [mostrarUploadLesao, setMostrarUploadLesao] = useState(false);
  const [mostrarUploadCurativo, setMostrarUploadCurativo] = useState(false);

  const novoInicial = {
    tipo: "tomografia",
    lateralidade: "nao_aplicavel",
    laudo: "",
    dataRealizacao: new Date().toISOString().slice(0, 10),
    sitio: "",
    achados: "",
    linkTipo: "WBSRAD",
    linkUrl: "",
  };

  const [novo, setNovo] = useState(novoInicial);

  const fotosRx = fotos.filter((f) => normalizarTipo(f.tipo) === "RADIOGRAFIA");
  const fotosLesao = fotos.filter(
    (f) => normalizarTipo(f.tipo) === "LESAO_PELE",
  );
  const fotosCurativo = fotos.filter(
    (f) => normalizarTipo(f.tipo) === "CURATIVO",
  );

  const fotosCurativoUrls = new Set(fotosCurativo.map((f) => f.url));
  const timelineCurativos = [
    ...fotosCurativo.map((f) => ({
      url: f.url,
      data: f.dataFoto || (f as any).data_realizacao,
      descricao: f.descricao,
      id: f.id,
      origem: "foto" as const,
    })),
    ...evolucoes
      .filter(
        (e) =>
          e.curativo_foto_url && !fotosCurativoUrls.has(e.curativo_foto_url),
      )
      .map((e) => ({
        url: e.curativo_foto_url,
        data: e.data,
        descricao: "Curativo (evolução)",
        id: e.id,
        origem: "evolucao" as const,
      })),
  ].sort((a, b) => (b.data || "").localeCompare(a.data || ""));

  const getTipo = (e: any) =>
    (e.tipoExame || e.tipo_exame || e.tipo || "").toLowerCase();

  const examesAltaComplexidade = exames.filter((e) =>
    EXAMES_ALTA_COMPLEXIDADE.includes(getTipo(e)),
  );

  const examesSimples = exames.filter(
    (e) => !EXAMES_ALTA_COMPLEXIDADE.includes(getTipo(e)),
  );

  const substituirCategoria = (tipo: FotoTipo, novasFotos: FotoSalva[]) => {
    setFotos((atuais) => [
      ...atuais.filter((foto) => normalizarTipo(foto.tipo) !== tipo),
      ...novasFotos.map((foto) => ({
        ...foto,
        tipo: normalizarTipo(foto.tipo),
      })),
    ]);
  };

  const salvarExame = async () => {
    if (!novo.dataRealizacao || !novo.sitio || !novo.tipo) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/pacientes/${pacienteId}/exames-imagem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo),
      });

      if (res.ok) {
        const data = await res.json();
        setExames((atuais) => [data, ...atuais]);
        setNovo({
          ...novoInicial,
          dataRealizacao: new Date().toISOString().slice(0, 10),
        });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const removerExame = async (id: string) => {
    await fetch(`/api/pacientes/${pacienteId}/exames-imagem?exameId=${id}`, {
      method: "DELETE",
    });
    setExames((atuais) => atuais.filter((e) => e.id !== id));
  };

  const removerFoto = async (fotoId: string) => {
    const response = await fetch(
      `/api/pacientes/${pacienteId}/fotos?fotoId=${fotoId}`,
      { method: "DELETE" },
    );

    if (!response.ok) return;

    setFotos((atuais) => atuais.filter((f) => f.id !== fotoId));
  };

  const atualizarFoto = async (fotoId: string, dados: Partial<FotoSalva>) => {
    const response = await fetch(`/api/pacientes/${pacienteId}/fotos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fotoId, ...dados }),
    });

    if (!response.ok) return;

    setFotos((atuais) =>
      atuais.map((f) => (f.id === fotoId ? { ...f, ...dados } : f)),
    );
  };

  const labelTipoExame = (val: string) =>
    TIPOS_EXAME.find((t) => t.value === val)?.label || val;

  const hospitalInfo = (valor: string) =>
    HOSPITAIS_ORIGEM.find((hospital) => hospital.value === valor);

  return (
    <div className="space-y-6">
      {/* 1. Links dos Sistemas */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowLinks(!showLinks)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm transition-all"
        >
          <ExternalLink className="w-4 h-4" /> Sistemas de Imagem
        </button>
      </div>

      {showLinks && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Acessar resultados online:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {HOSPITAIS_EXAMES.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-800">
                    {h.nome}
                  </span>
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                  >
                    <ExternalLink className="w-3 h-3" /> Abrir
                  </a>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    <span className="font-medium">Login:</span>{" "}
                    <code className="bg-slate-100 px-1 rounded">{h.login}</code>
                  </p>
                  <p>
                    <span className="font-medium">Senha:</span>{" "}
                    <code className="bg-slate-100 px-1 rounded">{h.senha}</code>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Radiografias */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-slate-400" />
            Radiografias ({fotosRx.length})
          </h3>
          <button
            type="button"
            onClick={() => setMostrarUploadRx((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            {mostrarUploadRx ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {mostrarUploadRx ? "Fechar" : "Adicionar"}
          </button>
        </div>

        {mostrarUploadRx && (
          <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <FotoUpload
              pacienteId={pacienteId}
              tipo="RADIOGRAFIA"
              fotos={fotosRx}
              mostrarGaleria={false}
              mostrarFormulario={true}
              onChange={(novasFotos) => {
                substituirCategoria("RADIOGRAFIA", novasFotos);
                setMostrarUploadRx(false);
              }}
            />
          </div>
        )}

        <FotoUpload
          pacienteId={pacienteId}
          tipo="RADIOGRAFIA"
          fotos={fotosRx}
          mostrarGaleria
          mostrarFormulario={false}
          onChange={(novasFotos) =>
            substituirCategoria("RADIOGRAFIA", novasFotos)
          }
          onFotoDeletada={(id) =>
            setFotos((atuais) => atuais.filter((foto) => foto.id !== id))
          }
        />
      </div>

      {/* 3. Lesões de Pele */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-slate-400" />
            Lesões de pele ({fotosLesao.length})
          </h3>
          <button
            type="button"
            onClick={() => setMostrarUploadLesao((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            {mostrarUploadLesao ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {mostrarUploadLesao ? "Fechar" : "Adicionar"}
          </button>
        </div>

        {mostrarUploadLesao && (
          <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <FotoUpload
              pacienteId={pacienteId}
              tipo="LESAO_PELE"
              fotos={fotosLesao}
              mostrarGaleria={false}
              mostrarFormulario={true}
              onChange={(novasFotos) => {
                substituirCategoria("LESAO_PELE", novasFotos);
                setMostrarUploadLesao(false);
              }}
            />
          </div>
        )}

        <FotoUpload
          pacienteId={pacienteId}
          tipo="LESAO_PELE"
          fotos={fotosLesao}
          mostrarGaleria
          mostrarFormulario={false}
          onChange={(novasFotos) =>
            substituirCategoria("LESAO_PELE", novasFotos)
          }
          onFotoDeletada={(id) =>
            setFotos((atuais) => atuais.filter((foto) => foto.id !== id))
          }
        />
      </div>

      {/* 4. Exames de Alta Complexidade */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            Exames de alta complexidade ({examesAltaComplexidade.length})
          </h3>

          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            {showForm ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {showForm ? "Fechar" : "Novo exame"}
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-5">
          ECG, ecocardiograma, tomografia, ressonância e ultrassonografia.
        </p>

        {showForm && (
          <div className="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tipo de exame *
                </label>

                <select
                  className={inputCls}
                  value={novo.tipo}
                  onChange={(e) =>
                    setNovo((atual) => ({
                      ...atual,
                      tipo: e.target.value,
                    }))
                  }
                >
                  {TIPOS_EXAME.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Data da realização *
                </label>

                <input
                  type="date"
                  className={inputCls}
                  value={novo.dataRealizacao}
                  onChange={(e) =>
                    setNovo((atual) => ({
                      ...atual,
                      dataRealizacao: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Sítio / Região examinada *
                </label>

                <input
                  className={inputCls}
                  value={novo.sitio}
                  onChange={(e) =>
                    setNovo((atual) => ({
                      ...atual,
                      sitio: e.target.value,
                    }))
                  }
                  placeholder="Ex: Joelho esquerdo, tórax..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Lateralidade
                </label>

                <div className="flex gap-2 flex-wrap">
                  {[
                    ["nao_aplicavel", "Não se aplica"],
                    ["direita", "Direita"],
                    ["esquerda", "Esquerda"],
                    ["bilateral", "Bilateral"],
                  ].map(([valor, texto]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() =>
                        setNovo((atual) => ({
                          ...atual,
                          lateralidade: valor,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        novo.lateralidade === valor
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Achados
                </label>

                <textarea
                  className={textareaCls}
                  rows={3}
                  value={novo.achados}
                  onChange={(e) =>
                    setNovo((atual) => ({
                      ...atual,
                      achados: e.target.value,
                    }))
                  }
                  placeholder="Descreva os principais achados..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Laudo
                </label>

                <textarea
                  className={textareaCls}
                  rows={4}
                  value={novo.laudo}
                  onChange={(e) =>
                    setNovo((atual) => ({
                      ...atual,
                      laudo: e.target.value,
                    }))
                  }
                  placeholder="Digite o laudo do exame..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Hospital de origem
                </label>

                <select
                  className={inputCls}
                  value={novo.linkTipo}
                  onChange={(e) =>
                    setNovo((atual) => ({
                      ...atual,
                      linkTipo: e.target.value,
                    }))
                  }
                >
                  {HOSPITAIS_ORIGEM.map((hospital) => (
                    <option key={hospital.value} value={hospital.value}>
                      {hospital.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarExame}
                disabled={
                  !novo.dataRealizacao || !novo.sitio || !novo.tipo || saving
                }
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar exame"}
              </button>
            </div>
          </div>
        )}

        {examesAltaComplexidade.length === 0 && !showForm ? (
          <p className="text-sm text-slate-400 py-2">
            Nenhum exame de alta complexidade registrado.
          </p>
        ) : (
          <div className="space-y-3">
            {examesAltaComplexidade.map((e) => {
              const hospital = hospitalInfo(
                e.hospitalOrigem || e.hospital_origem,
              );

              return (
                <div
                  key={e.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-200 transition-colors group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700">
                          {labelTipoExame(
                            e.tipoExame || e.tipo_exame || e.tipo,
                          )}
                        </span>

                        <span className="text-sm font-semibold text-slate-800">
                          {e.sitio}
                        </span>

                        {e.lateralidade !== "nao_aplicavel" && (
                          <span className="text-xs text-slate-500 capitalize">
                            ({e.lateralidade})
                          </span>
                        )}

                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          {formatarData(
                            e.data || e.dataRealizacao || e.data_realizacao,
                          )}
                        </span>

                        {hospital && (
                          <span className="text-xs font-medium px-2 py-1 rounded border border-slate-200 text-slate-600">
                            {hospital.label}
                          </span>
                        )}
                      </div>

                      {e.achados && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-slate-500 mb-1">
                            Achados
                          </p>

                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {e.achados}
                          </p>
                        </div>
                      )}

                      {(e.laudo || e.descricao) && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-slate-500 mb-1">
                            Laudo
                          </p>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {e.laudo || e.descricao}
                          </p>
                        </div>
                      )}

                      {hospital && (
                        <a
                          href={
                            HOSPITAIS_EXAMES.find(
                              (h) =>
                                h.id ===
                                (e.hospitalOrigem || e.hospital_origem),
                            )?.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-3"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Acessar sistema de origem
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removerExame(e.id)}
                      className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Exames de Imagem Simples */}
      {examesSimples.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-slate-400" />

            <h3 className="text-sm font-semibold text-slate-700">
              Exames de imagem simples ({examesSimples.length})
            </h3>
          </div>

          <div className="space-y-2">
            {examesSimples.map((e) => {
              const hosp = hospitalInfo(e.hospitalOrigem || e.hospital_origem);

              return (
                <div
                  key={e.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-700">
                          {labelTipoExame(
                            e.tipoExame || e.tipo_exame || e.tipo,
                          )}
                        </span>

                        <span className="text-sm text-slate-600">
                          {e.sitio}
                        </span>

                        {e.lateralidade &&
                          e.lateralidade !== "nao_aplicavel" && (
                            <span className="text-xs text-slate-500 capitalize">
                              ({e.lateralidade})
                            </span>
                          )}

                        <span className="text-xs text-slate-400">
                          {formatarData(
                            e.data || e.dataRealizacao || e.data_realizacao,
                          )}
                        </span>

                        {hosp && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white text-slate-500">
                            {hosp.label}
                          </span>
                        )}
                      </div>

                      {e.achados && (
                        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-wrap">
                          {e.achados}
                        </p>
                      )}

                      {(e.laudo || e.descricao) && (
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                          <span className="font-medium">Laudo: </span>
                          {e.laudo || e.descricao}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removerExame(e.id)}
                      className="text-slate-300 hover:text-red-500 p-1"
                      title="Excluir exame"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Linha do Tempo de Curativos */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" /> Linha do tempo de
            curativos ({timelineCurativos.length})
          </h3>
          <button
            type="button"
            onClick={() => setMostrarUploadCurativo((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            {mostrarUploadCurativo ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {mostrarUploadCurativo ? "Fechar" : "Adicionar"}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Acompanhamento visual (Fotos avulsas + Fotos das Evoluções Diárias).
        </p>

        {mostrarUploadCurativo && (
          <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <FotoUpload
              pacienteId={pacienteId}
              tipo="CURATIVO"
              fotos={fotosCurativo}
              mostrarGaleria={false}
              mostrarFormulario={true}
              onChange={(novasFotos) => {
                substituirCategoria("CURATIVO", novasFotos);
                setMostrarUploadCurativo(false);
              }}
            />
          </div>
        )}

        {timelineCurativos.length === 0 && !mostrarUploadCurativo ? (
          <p className="text-sm text-slate-400 py-2">
            Nenhuma foto de curativo registrada.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {timelineCurativos.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="shrink-0 w-48">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                  <img
                    src={item.url}
                    alt={item.descricao || "Curativo"}
                    className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />

                  {item.origem === "foto" && (
                    <button
                      type="button"
                      onClick={() => removerFoto(item.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-50 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {item.origem === "evolucao" && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded bg-blue-600 text-white shadow-sm">
                      Evolução
                    </span>
                  )}
                </div>
                <div className="p-2 space-y-1.5 mt-1">
                  {item.origem === "foto" ? (
                    <input
                      type="date"
                      value={item.data ? item.data.slice(0, 10) : ""}
                      onChange={(e) =>
                        atualizarFoto(item.id, { dataFoto: e.target.value })
                      }
                      className="w-full px-2 py-1 rounded text-xs text-slate-700 border border-slate-200 bg-white"
                    />
                  ) : (
                    item.data && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium px-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatarData(item.data)}
                      </div>
                    )
                  )}
                  {item.descricao && (
                    <div
                      className="text-xs text-slate-500 truncate px-1"
                      title={item.descricao}
                    >
                      {item.descricao}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
