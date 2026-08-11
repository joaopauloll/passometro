"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  pacienteId: string;
  statusAtual: string;
};

const opcoes = [
  { value: "INTERNADO", label: "Internado" },
  { value: "ALTA_ORTOPEDIA", label: "Alta Ortopedia" },
  { value: "ALTA_HOSPITALAR", label: "Alta Hospitalar" },
];

export default function AlterarStatusButton({
  pacienteId,
  statusAtual,
}: Props) {
  const router = useRouter();

  async function mudarStatus(novoStatus: string | null) {
    if (!novoStatus || novoStatus === statusAtual) return;

    const res = await fetch(
      `/api/pacientes/${pacienteId}?status=${novoStatus}`,
      { method: "DELETE" },
    );

    if (res.ok) {
      toast.success("Status atualizado");
      router.refresh();
    }
  }

  const labelSelecionado =
    opcoes.find((o) => o.value === statusAtual)?.label || "Selecione o status";

  return (
    <Select value={statusAtual} onValueChange={mudarStatus}>
      {/* Classes de hover e transição adicionadas ao SelectTrigger */}
      <SelectTrigger className="w-auto text-sm border-slate-300 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 transition-all duration-150">
        <SelectValue placeholder="Selecione o status">
          {labelSelecionado}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
