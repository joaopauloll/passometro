// components/ui/SimNao.tsx
"use client";

type SimNaoProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export default function SimNao({
  value,
  onChange,
  label,
  disabled = false,
  className = "",
}: SimNaoProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      )}

      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(true)}
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
            value
              ? "bg-blue-50 border-blue-300 text-blue-600"
              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Sim
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
            !value
              ? "bg-blue-50 border-blue-300 text-blue-600"
              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Não
        </button>
      </div>
    </div>
  );
}
