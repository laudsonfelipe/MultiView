import React, { useCallback, useRef, useState } from "react";
import { Upload, File } from "lucide-react";
import { Progress } from "./ui/progress";

interface FileUploaderProps {
  onFileLoad: (data: string[][], fileName: string) => void;
  onLoadStart: () => void;
  onError: (error: string) => void;
}

export function FileUploader({ onFileLoad, onLoadStart, onError }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const workerRef = useRef<Worker | null>(null);

  const parseFile = useCallback(
    async (file: File) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const supportedExtensions = new Set(["tsv", "csv", "txt", "psv"]);

      if (!supportedExtensions.has(extension)) {
        onError("Por favor, selecione um arquivo .TSV, .CSV, .TXT ou .PSV válido");
        return;
      }

      setIsLoading(true);
      setFileName(file.name);
      onLoadStart();
      setProgress(0);

      const existingWorker = workerRef.current;
      if (existingWorker) {
        existingWorker.terminate();
        workerRef.current = null;
      }

      const worker = new Worker(
        new URL("../workers/fileParser.worker.ts", import.meta.url),
        { type: "module" }
      );
      workerRef.current = worker;

      const allData: string[][] = [];
      let header: string[] | null = null;
      let hasError = false;

      worker.onmessage = (event) => {
        const message = event.data as
          | { type: "progress"; percent: number; rowsParsed: number }
          | { type: "header"; header: string[] }
          | { type: "rows"; rows: string[][] }
          | { type: "done"; rowsParsed: number }
          | { type: "error"; message: string };

        if (message.type === "progress") {
          setProgress(message.percent);
          return;
        }

        if (message.type === "header") {
          header = message.header;
          allData.push(message.header);
          return;
        }

        if (message.type === "rows") {
          for (const row of message.rows) {
            allData.push(row);
          }
          return;
        }

        if (message.type === "error") {
          hasError = true;
          onError(message.message);
          setIsLoading(false);
          setProgress(0);
          worker.terminate();
          workerRef.current = null;
          return;
        }

        if (message.type === "done") {
          if (hasError) return;
          if (!header) {
            onError("Arquivo não contém dados válidos");
            setIsLoading(false);
            setProgress(0);
            worker.terminate();
            workerRef.current = null;
            return;
          }

          setProgress(100);
          setTimeout(() => {
            onFileLoad(allData, file.name);
            setIsLoading(false);
            setProgress(0);
            worker.terminate();
            workerRef.current = null;
          }, 200);
        }
      };

      worker.onerror = (event) => {
        console.error("❌ Erro no worker:", event);
        onError("Erro ao processar o arquivo");
        setIsLoading(false);
        setProgress(0);
        worker.terminate();
        workerRef.current = null;
      };

      worker.postMessage({
        file,
        options: {
          extension,
          chunkSize: 1024 * 1024 * 10,
          batchSize: 2000,
        },
      });
    },
    [onFileLoad, onLoadStart, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        parseFile(files[0]);
      }
    },
    [parseFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        parseFile(files[0]);
      }
    },
    [parseFile]
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950 p-4">
      <div className="w-full max-w-2xl">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center transition-all
            ${
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : "border-neutral-700 hover:border-neutral-600"
            }
            ${isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
          `}
        >
          <input
            type="file"
            accept=".tsv,.csv,.txt,.psv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />

          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <>
                <File className="w-16 h-16 text-blue-500 animate-pulse" />
                <div className="space-y-2 w-full max-w-md">
                  <p className="text-neutral-300">
                    Carregando {fileName}...
                  </p>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-neutral-500">
                    {progress.toFixed(0)}% completo
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-neutral-500" />
                <div className="space-y-2">
                  <h2 className="text-2xl text-neutral-100">
                    Arraste seu arquivo .TSV aqui
                  </h2>
                  <p className="text-neutral-400">
                    ou clique para selecionar
                  </p>
                </div>
                <div className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Selecionar Arquivo
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
          <h3 className="text-sm text-neutral-400 mb-2">
            Formatos suportados:
          </h3>
          <p className="text-neutral-300">.TSV, .CSV, .TXT, .PSV</p>
        </div>
      </div>
    </div>
  );
}