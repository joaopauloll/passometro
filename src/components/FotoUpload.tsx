"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { Upload, Calendar, Trash2, Image as ImageIcon } from "lucide-react";

import ImageLightbox from "@/components/ImageLightbox";

export type FotoTipo = "RADIOGRAFIA" | "LESAO_PELE" | "CURATIVO";

export type FotoSalva = {
  id: string;
  tipo: FotoTipo | string;
  url: string;
  dataFoto: string | null;
  descricao: string | null;
  lateralidade?: string | null;
};

export type FotoPendente = {
  file: File;
  tipo: FotoTipo;
  dataFoto: string;
  descricao: string;
  lateralidade: string;
  previewUrl: string;
};

type Props = {
  pacienteId?: string;
  tipo?: FotoTipo;
  fotos?: FotoSalva[];
  fotosSalvas?: FotoSalva[];
  onChange?: (fotos: FotoSalva[]) => void;
  onFotosPendentes?: (fotos: FotoPendente[]) => void;
  onFotoDeletada?: (id: string) => void;
  mostrarGaleria?: boolean;
  mostrarFormulario?: boolean;
  multiple?: boolean;
  titulo?: string;
};

const TIPO_LABEL: Record<FotoTipo, string> = {
  RADIOGRAFIA: "Radiografia",
  LESAO_PELE: "Foto de lesão",
  CURATIVO: "Foto de curativo",
};

const TIPO_ICONE: Record<FotoTipo, string> = {
  RADIOGRAFIA: "🩻",
  LESAO_PELE: "🩹",
  CURATIVO: "🩹",
};

function normalizarTipo(tipo: string): FotoTipo | string {
  const valor = tipo.toLowerCase();

  if (valor.includes("radiografia")) return "RADIOGRAFIA";
  if (valor.includes("lesao")) return "LESAO_PELE";
  if (valor.includes("curativo")) return "CURATIVO";

  return tipo;
}

function normalizarFoto(foto: any): FotoSalva {
  return {
    id: foto.id,
    tipo: normalizarTipo(foto.tipo),
    url: foto.url,
    dataFoto: foto.dataFoto ?? foto.data_realizacao ?? null,
    descricao: foto.descricao ?? null,
    lateralidade: foto.lateralidade ?? null,
  };
}

export default function FotoUpload({
  pacienteId,
  tipo,
  fotos = [],
  fotosSalvas = [],
  onChange,
  onFotosPendentes,
  onFotoDeletada,
  mostrarGaleria = true,
  mostrarFormulario = true,
  multiple = true,
  titulo,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [pendentes, setPendentes] = useState<FotoPendente[]>([]);
  const [uploading, setUploading] = useState(false);

  const [novaData, setNovaData] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaLateralidade, setNovaLateralidade] = useState("nao_aplicavel");

  const [tipoSelecionado, setTipoSelecionado] = useState<FotoTipo>(
    tipo || "RADIOGRAFIA",
  );

  const [lightbox, setLightbox] = useState({
    open: false,
    index: 0,
  });

  const fotosAtuais =
    fotos.length > 0
      ? fotos.map(normalizarFoto)
      : fotosSalvas.map(normalizarFoto);

  const tipoAtual = tipo || tipoSelecionado;
  const label = TIPO_LABEL[tipoAtual] || "Foto";

  const fotosDoTipo = tipo
    ? fotosAtuais.filter((foto) => normalizarTipo(foto.tipo) === tipo)
    : fotosAtuais;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    if (!pacienteId) {
      const novas: FotoPendente[] = files.map((file) => ({
        file,
        tipo: tipoAtual,
        dataFoto: novaData,
        descricao: novaDescricao.trim(),
        lateralidade: novaLateralidade,
        previewUrl: URL.createObjectURL(file),
      }));

      const updated = multiple ? [...pendentes, ...novas] : novas.slice(0, 1);

      setPendentes(updated);
      onFotosPendentes?.(updated);

      setNovaDescricao("");
      setNovaLateralidade("nao_aplicavel");
      return;
    }

    setUploading(true);

    try {
      const novasFotosCriadas: FotoSalva[] = [];

      for (const file of files) {
        const fotoCriada = await uploadFoto(file);
        if (fotoCriada) {
          novasFotosCriadas.push(fotoCriada);
        }
      }

      // Atualiza o estado com TODAS as fotos antigas + TODAS as fotos novas de uma vez só!
      if (novasFotosCriadas.length > 0) {
        onChange?.([...fotosAtuais, ...novasFotosCriadas]);
      }

      setNovaDescricao("");
      setNovaLateralidade("nao_aplicavel");
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar uma ou mais imagens. Tente novamente.");
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  async function uploadFoto(file: File): Promise<FotoSalva> {
    if (!pacienteId) throw new Error("Paciente não informado.");

    const formData = new FormData();

    formData.append("file", file);
    formData.append("tipo", tipoAtual);

    if (novaDescricao.trim()) {
      formData.append("descricao", novaDescricao.trim());
    }

    if (novaData) {
      formData.append("dataFoto", novaData);
    }

    if (novaLateralidade !== "nao_aplicavel") {
      formData.append("lateralidade", novaLateralidade);
    }

    const response = await fetch(`/api/pacientes/${pacienteId}/fotos`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Falha ao enviar a imagem.");
    }

    const data = await response.json();

    let novaFoto: any;

    if (Array.isArray(data?.fotos)) {
      novaFoto = data.fotos[0];
    } else if (Array.isArray(data)) {
      novaFoto = data[0];
    } else {
      novaFoto = data;
    }

    if (!novaFoto) {
      throw new Error("A API não retornou a foto criada.");
    }

    // Retorna a foto normalizada em vez de chamar onChange aqui dentro
    return normalizarFoto(novaFoto);
  }

  function removerPendente(index: number) {
    const foto = pendentes[index];

    if (foto?.previewUrl) {
      URL.revokeObjectURL(foto.previewUrl);
    }

    const updated = pendentes.filter((_, i) => i !== index);

    setPendentes(updated);
    onFotosPendentes?.(updated);
  }

  async function deletarFoto(id: string) {
    if (!pacienteId) return;

    const response = await fetch(
      `/api/pacientes/${pacienteId}/fotos?fotoId=${id}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      alert("Não foi possível excluir a imagem.");
      return;
    }

    const updated = fotosAtuais.filter((foto) => foto.id !== id);

    onChange?.(updated);
    onFotoDeletada?.(id);
  }

  async function atualizarFoto(id: string, dados: Partial<FotoSalva>) {
    if (!pacienteId) return;

    const response = await fetch(`/api/pacientes/${pacienteId}/fotos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fotoId: id, ...dados }),
    });

    if (!response.ok) {
      alert("Não foi possível atualizar a imagem.");
      return;
    }

    const updated = fotosAtuais.map((foto) =>
      foto.id === id ? { ...foto, ...dados } : foto,
    );

    onChange?.(updated);
  }

  const imagensLightbox = fotosDoTipo.map((foto) => ({
    url: foto.url,
    descricao: foto.descricao || undefined,
    data: foto.dataFoto ? foto.dataFoto.slice(0, 10) : undefined,
  }));

  return (
    <div className="space-y-4">
      {mostrarFormulario && (
        <>
          {titulo && (
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-800">
                {titulo}
              </h3>
            </div>
          )}

          {!tipo && (
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1.5">
                Tipo de imagem
              </label>

              <div className="flex flex-wrap gap-2">
                {(["RADIOGRAFIA", "LESAO_PELE", "CURATIVO"] as FotoTipo[]).map(
                  (t) => (
                    <label
                      key={t}
                      className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="tipoFoto"
                        value={t}
                        checked={tipoSelecionado === t}
                        onChange={() => setTipoSelecionado(t)}
                        className="accent-blue-600"
                      />
                      <span>
                        {TIPO_ICONE[t]} {TIPO_LABEL[t]}
                      </span>
                    </label>
                  ),
                )}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1">
                Data da {label.toLowerCase()}
              </label>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1">
                Descrição
              </label>
              <input
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder={
                  tipoAtual === "RADIOGRAFIA"
                    ? "ex: RX quadril AP + perfil"
                    : tipoAtual === "LESAO_PELE"
                      ? "ex: Lesão em perna"
                      : "ex: Curativo pós-operatório"
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
          </div>

          {(tipoAtual === "RADIOGRAFIA" || tipoAtual === "LESAO_PELE") && (
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1.5">
                Lateralidade
              </label>

              <div className="flex gap-1.5 flex-wrap">
                {[
                  ["nao_aplicavel", "N/A"],
                  ["direita", "Direita"],
                  ["esquerda", "Esquerda"],
                  ["bilateral", "Bilateral"],
                ].map(([valor, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setNovaLateralidade(valor)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      novaLateralidade === valor
                        ? "bg-blue-50 border-blue-300 text-blue-600"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {texto}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              uploading
                ? "border-blue-300 bg-blue-50"
                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={multiple}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />

            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm text-blue-600 font-medium">
                  Enviando e salvando...
                </span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 font-medium">
                  Anexar {label.toLowerCase()}
                  {multiple ? "(s)" : ""}
                </span>
              </>
            )}
          </label>

          {pendentes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">
                  {TIPO_ICONE[tipoAtual]} {label} (aguardando envio)
                </h4>
                <span className="text-xs text-slate-400">
                  {pendentes.length}{" "}
                  {pendentes.length === 1 ? "imagem" : "imagens"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {pendentes.map((foto, index) => (
                  <div
                    key={`${foto.previewUrl}-${index}`}
                    className="relative group"
                  >
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => setLightbox({ open: true, index })}
                    >
                      <img
                        src={foto.previewUrl}
                        alt={foto.descricao || "Imagem pendente"}
                        className="w-full h-28 object-cover rounded-lg border border-slate-200 shadow-sm group-hover:opacity-90 transition-opacity"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => removerPendente(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      title="Remover"
                    >
                      ×
                    </button>

                    {foto.dataFoto && (
                      <div className="text-xs text-slate-500 mt-1">
                        {format(new Date(foto.dataFoto), "dd/MM/yyyy")}
                      </div>
                    )}

                    {foto.descricao && (
                      <div
                        className="text-xs text-slate-500 truncate"
                        title={foto.descricao}
                      >
                        {foto.descricao}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {mostrarGaleria && fotosDoTipo.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotosDoTipo.map((foto, index) => {
              const dataString = foto.dataFoto || "";

              return (
                <div key={foto.id} className="relative group">
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => setLightbox({ open: true, index })}
                  >
                    <img
                      src={foto.url}
                      alt={foto.descricao || "Imagem"}
                      className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-sm cursor-pointer group-hover:opacity-90 transition-opacity"
                    />
                  </button>

                  {pacienteId && (
                    <button
                      type="button"
                      onClick={() => deletarFoto(foto.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-50 shadow-sm"
                      title="Excluir imagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {pacienteId ? (
                    <input
                      type="date"
                      value={dataString ? dataString.slice(0, 10) : ""}
                      onChange={(e) =>
                        atualizarFoto(foto.id, { dataFoto: e.target.value })
                      }
                      className="w-full mt-2 px-2 py-1 rounded text-xs text-slate-700 border border-slate-200 bg-white"
                    />
                  ) : (
                    dataString && (
                      <div className="text-xs text-slate-500 mt-1">
                        {format(new Date(dataString), "dd/MM/yyyy")}
                      </div>
                    )
                  )}

                  {foto.descricao && (
                    <div
                      className="text-xs text-slate-500 truncate mt-1 px-1"
                      title={foto.descricao}
                    >
                      {foto.descricao}
                    </div>
                  )}

                  {foto.lateralidade &&
                    foto.lateralidade !== "nao_aplicavel" && (
                      <div className="text-[10px] text-slate-400 mt-0.5 px-1 capitalize">
                        {foto.lateralidade}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mostrarGaleria && fotosDoTipo.length === 0 && !mostrarFormulario && (
        <p className="text-sm text-slate-400 text-center py-3">
          Nenhuma imagem adicionada.
        </p>
      )}

      {lightbox.open && (
        <ImageLightbox
          images={imagensLightbox}
          currentIndex={lightbox.index}
          onClose={() => setLightbox({ ...lightbox, open: false })}
          onNavigate={(index) => setLightbox({ ...lightbox, index })}
        />
      )}
    </div>
  );
}
