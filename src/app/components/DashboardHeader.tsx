import React from "react";
import { Database, UploadCloud, X } from "lucide-react";
import { Button } from "./ui/button";

interface DashboardHeaderProps {
  fileName?: string;
  onNewFile: () => void;
}

export function DashboardHeader({ fileName, onNewFile }: DashboardHeaderProps) {
  return (
    <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-xl text-neutral-100">
              TSV Big Data Viewer
            </h1>
            {fileName && (
              <p className="text-sm text-neutral-400 mt-0.5">
                {fileName}
              </p>
            )}
          </div>
        </div>

        {fileName && (
          <Button
            onClick={onNewFile}
            variant="outline"
            className="bg-neutral-950 border-neutral-700 text-neutral-100 hover:bg-neutral-800"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Novo Arquivo
          </Button>
        )}
      </div>
    </header>
  );
}
