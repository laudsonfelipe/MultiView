import React from "react";
import { FileX, AlertCircle, UploadCloud } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  type: "no-data" | "no-results" | "error";
  message?: string;
  onReset?: () => void;
}

export function EmptyState({ type, message, onReset }: EmptyStateProps) {
  if (type === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl text-neutral-100 mb-2">
          Erro ao carregar arquivo
        </h3>
        <p className="text-neutral-400 mb-6 max-w-md">
          {message || "Ocorreu um erro ao processar o arquivo. Verifique se o formato está correto e tente novamente."}
        </p>
        {onReset && (
          <Button
            onClick={onReset}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </div>
    );
  }

  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-4">
        <FileX className="w-16 h-16 text-neutral-600 mb-4" />
        <h3 className="text-xl text-neutral-100 mb-2">
          Nenhum resultado encontrado
        </h3>
        <p className="text-neutral-400 mb-6 max-w-md">
          {message || "Não foram encontrados dados que correspondam aos filtros aplicados. Tente ajustar os critérios de busca."}
        </p>
        {onReset && (
          <Button
            onClick={onReset}
            variant="outline"
            className="bg-neutral-950 border-neutral-700 text-neutral-100 hover:bg-neutral-800"
          >
            Limpar Filtros
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-96 text-center px-4">
      <UploadCloud className="w-16 h-16 text-neutral-600 mb-4" />
      <h3 className="text-xl text-neutral-100 mb-2">
        Nenhum arquivo carregado
      </h3>
      <p className="text-neutral-400 max-w-md">
        Faça upload de um arquivo .TSV para começar a visualizar os dados
      </p>
    </div>
  );
}
