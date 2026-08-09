'use client'

import React, { useState } from "react";
import { Upload, Calendar } from "lucide-react";

type Props = {
  pacienteId: string;
  tipo: string;
  fotos?: any[];
  onChange: (fotos: any[]) => void;
};

export default function FotoUpload({ pacienteId, tipo, fotos = [], onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [novaData, setNovaData] = useState(new Date().toISOString().slice(0, 10));
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaLateralidade, setNovaLateralidade] = useState("nao_aplicavel");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Mapeamento de segurança para o padrão que a API espera
      const tipoNormalizado = tipo.toLowerCase();
      const tipoMapeado = 
        tipoNormalizado.includes('radiografia') ? 'RADIOGRAFIA' : 
        tipoNormalizado.includes('lesao') ? 'LESAO_PELE' : 
        tipoNormalizado.includes('curativo') ? 'CURATIVO' : tipo;

      formData.append('tipo', tipoMapeado);
      
      if (novaDescricao.trim()) formData.append('descricao', novaDescricao.trim());
      if (novaData) formData.append('dataFoto', novaData);
      if (novaLateralidade !== 'nao_aplicavel') formData.append('lateralidade', novaLateralidade);

      // Chamada para a sua API real
      const res = await fetch(`/api/pacientes/${pacienteId}/fotos`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha ao enviar a imagem.');

      const data = await res.json();
      
      // Garantir que pegamos o objeto correto da foto salva
      const novaFoto = Array.isArray(data.fotos) ? data.fotos[0] : (Array.isArray(data) ? data[0] : data);

      // Adiciona a nova foto ao array existente do componente pai
      onChange([...fotos, novaFoto]);
      
      // Limpar os campos para a próxima foto
      setNovaDescricao("");
      setNovaLateralidade("nao_aplicavel");
      
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reseta o input de arquivo
    }
  };

  const isRadiografia = tipo.toLowerCase().includes("radiografia");
  const isLesao = tipo.toLowerCase().includes("lesao");
  const label = isRadiografia ? "Radiografia" : isLesao ? "Foto de lesão" : "Foto";

  return (
    <div>
      {/* Upload area */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1">
            <Calendar className="w-3 h-3 inline mr-1" />
            Data da {label.toLowerCase()}
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            value={novaData}
            onChange={(e) => setNovaData(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1">
            Descrição (opcional)
          </label>
          <input
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            placeholder={isRadiografia ? "ex: RX quadril AP + perfil" : "ex: Lesão em perna"}
            value={novaDescricao}
            onChange={(e) => setNovaDescricao(e.target.value)}
          />
        </div>
      </div>

      {/* Lateralidade — só para rx e lesão */}
      {(isRadiografia || isLesao) && (
        <div className="mb-2">
          <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1">Lateralidade</label>
          <div className="flex gap-1.5">
            {[["nao_aplicavel", "N/A"], ["direita", "Direita"], ["esquerda", "Esquerda"], ["bilateral", "Bilateral"]].map(([v, l]) => (
              <button 
                key={v} 
                type="button" 
                onClick={() => setNovaLateralidade(v)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                  novaLateralidade === v 
                    ? "bg-blue-50 border-blue-300 text-blue-600" 
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dropzone de Seleção */}
      <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
        uploading 
          ? "border-blue-300 bg-blue-50" 
          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
      }`}>
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-blue-600 font-medium">Enviando e salvando...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 font-medium">Anexar {label.toLowerCase()}</span>
          </>
        )}
      </label>
    </div>
  );
}