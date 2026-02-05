import React, { useMemo } from "react";
import { Search, Filter, Columns3, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

interface TableControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  columnFilters: Record<number, string>;
  onColumnFilterChange: (columnIndex: number, value: string) => void;
  onClearColumnFilter: (columnIndex: number) => void;
  headers: string[];
  totalRows: number;
  filteredRows: number;
  visibleColumns: Set<number>;
  onVisibleColumnsChange: (selected: Set<number>) => void;
}

export function TableControls({
  searchTerm,
  onSearchChange,
  columnFilters,
  onColumnFilterChange,
  onClearColumnFilter,
  headers,
  totalRows,
  filteredRows,
  visibleColumns,
  onVisibleColumnsChange,
}: TableControlsProps) {
  const activeFiltersCount = Object.keys(columnFilters).length;

  const allColumnsSelected = useMemo(() => {
    return headers.length > 0 && visibleColumns.size === headers.length;
  }, [headers.length, visibleColumns.size]);

  const selectedColumnsCount = visibleColumns.size;

  const handleToggleAllColumns = () => {
    if (allColumnsSelected) {
      onVisibleColumnsChange(new Set());
      return;
    }

    onVisibleColumnsChange(new Set(headers.map((_, index) => index)));
  };

  const handleToggleColumn = (columnIndex: number) => {
    const next = new Set(visibleColumns);
    if (next.has(columnIndex)) {
      next.delete(columnIndex);
    } else {
      next.add(columnIndex);
    }
    onVisibleColumnsChange(next);
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 p-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            type="text"
            placeholder="Buscar em todas as colunas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500"
          />
        </div>

        {/* Filters and Count */}
        <div className="flex items-center gap-4">
          {/* Row Counter */}
          <div className="text-sm text-neutral-400">
            <span className="text-neutral-100">{filteredRows.toLocaleString()}</span>
            {filteredRows !== totalRows && (
              <span> de {totalRows.toLocaleString()}</span>
            )}{" "}
            linhas
          </div>

          {/* Column Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-neutral-950 border-neutral-700 text-neutral-100 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-96 bg-neutral-900 border-neutral-700 text-neutral-100 p-4"
              align="end"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Filtros por Coluna</h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        Object.keys(columnFilters).forEach((key) => {
                          onClearColumnFilter(Number(key));
                        });
                      }}
                      className="text-xs text-neutral-400 hover:text-neutral-100"
                    >
                      Limpar todos
                    </Button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto space-y-4">
                  {headers.map((header, index) => {
                    return (
                      <div key={index} className="space-y-2 pb-4 border-b border-neutral-800 last:border-0">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-neutral-300">
                            {header}
                          </label>
                        </div>
                        
                        {/* Filtro de texto */}
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder={`Filtrar ${header}...`}
                            value={columnFilters[index] || ""}
                            onChange={(e) =>
                              onColumnFilterChange(index, e.target.value)
                            }
                            className="bg-neutral-950 border-neutral-700 text-neutral-100 text-sm pr-8"
                          />
                          {columnFilters[index] && (
                            <button
                              onClick={() => onClearColumnFilter(index)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Column Visibility */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-neutral-950 border-neutral-700 text-neutral-100 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <Columns3 className="h-4 w-4 mr-2" />
                Colunas
                <span className="ml-2 px-2 py-0.5 bg-neutral-800 text-neutral-100 text-xs rounded-full">
                  {selectedColumnsCount}/{headers.length}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 bg-neutral-900 border-neutral-700 text-neutral-100 p-3"
              align="end"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Colunas visíveis</h3>
                </div>

                <div className="flex items-center space-x-2 pb-2 border-b border-neutral-800">
                  <Checkbox
                    checked={allColumnsSelected}
                    onCheckedChange={handleToggleAllColumns}
                    id="select-all-columns"
                  />
                  <label
                    htmlFor="select-all-columns"
                    className="text-xs font-medium text-neutral-300 cursor-pointer"
                  >
                    Selecionar todas
                  </label>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        checked={visibleColumns.has(index)}
                        onCheckedChange={() => handleToggleColumn(index)}
                        id={`column-${index}`}
                      />
                      <label
                        htmlFor={`column-${index}`}
                        className="text-xs text-neutral-300 cursor-pointer truncate flex-1"
                        title={header}
                      >
                        {header}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}