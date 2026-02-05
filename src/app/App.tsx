import React,{ useState, useMemo, useCallback, useTransition } from "react";
import { FileUploader } from "./components/FileUploader";
import { DashboardHeader } from "./components/DashboardHeader";
import { TableControls } from "./components/TableControls";
import { VirtualizedTable } from "./components/VirtualizedTable";
import { EmptyState } from "./components/EmptyState";

export default function App() {
  const [data, setData] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<number, string>>({});
  const [visibleColumns, setVisibleColumns] = useState<Set<number>>(new Set());
  const [isFiltering, startFiltering] = useTransition();

  const handleFileLoad = useCallback((loadedData: string[][], name: string) => {
    setData(loadedData);
    setFileName(name);
    setError("");
    setSearchTerm("");
    setColumnFilters({});
    setVisibleColumns(new Set(loadedData[0]?.map((_, index) => index) || []));
  }, []);

  const handleLoadStart = useCallback(() => {
    setError("");
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleNewFile = useCallback(() => {
    setData([]);
    setFileName("");
    setError("");
    setSearchTerm("");
    setColumnFilters({});
    setVisibleColumns(new Set());
  }, []);

  const handleColumnFilterChange = useCallback(
    (columnIndex: number, value: string) => {
      startFiltering(() => {
        setColumnFilters((prev) => {
          if (value === "") {
            const newFilters = { ...prev };
            delete newFilters[columnIndex];
            return newFilters;
          }
          return { ...prev, [columnIndex]: value };
        });
      });
    },
    [startFiltering]
  );

  const handleClearColumnFilter = useCallback(
    (columnIndex: number) => {
      startFiltering(() => {
        setColumnFilters((prev) => {
          const newFilters = { ...prev };
          delete newFilters[columnIndex];
          return newFilters;
        });
      });
    },
    [startFiltering]
  );

  const handleClearAllFilters = useCallback(() => {
    startFiltering(() => {
      setSearchTerm("");
      setColumnFilters({});
    });
  }, [startFiltering]);

  const handleVisibleColumnsChange = useCallback((selected: Set<number>) => {
    startFiltering(() => {
      setVisibleColumns(new Set(selected));
    });
  }, [startFiltering]);

  const handleSearchChange = useCallback(
    (value: string) => {
      startFiltering(() => {
        setSearchTerm(value);
      });
    },
    [startFiltering]
  );

  // Filter data based on search term and column filters
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];

    const headers = data[0];
    const rows = data.slice(1);

    let filtered = rows;

    // Apply column filters (text search)
    if (Object.keys(columnFilters).length > 0) {
      filtered = filtered.filter((row) => {
        return (Object.entries(columnFilters) as [string, string][]).every(
          ([colIndex, filterValue]) => {
            const cellValue = row[Number(colIndex)] || "";
            return cellValue.toLowerCase().includes(filterValue.toLowerCase());
          }
        );
      });
    }

    // Apply global search
    if (searchTerm) {
      filtered = filtered.filter((row) => {
        return row.some((cell) =>
          cell.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return [headers, ...filtered];
  }, [data, searchTerm, columnFilters]);

  // Show file uploader if no data loaded
  if (data.length === 0 && !error) {
    return (
      <FileUploader
        onFileLoad={handleFileLoad}
        onLoadStart={handleLoadStart}
        onError={handleError}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <DashboardHeader onNewFile={handleNewFile} />
        <EmptyState type="error" message={error} onReset={handleNewFile} />
      </div>
    );
  }

  const headers = data.length > 0 ? data[0] : [];
  const totalRows = data.length - 1; // Exclude header
  const filteredRows = filteredData.length - 1; // Exclude header

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <DashboardHeader fileName={fileName} onNewFile={handleNewFile} />

      <TableControls
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        onClearColumnFilter={handleClearColumnFilter}
        headers={headers}
        totalRows={totalRows}
        filteredRows={filteredRows}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={handleVisibleColumnsChange}
      />

      <div className="relative flex-1 overflow-hidden">
        {isFiltering && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-neutral-950/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 shadow-lg">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent" />
              Carregando resultados...
            </div>
          </div>
        )}
        {filteredRows === 0 ? (
          <EmptyState
            type="no-results"
            onReset={handleClearAllFilters}
          />
        ) : (
          <VirtualizedTable
            data={data}
            filteredData={filteredData}
            visibleColumns={visibleColumns}
          />
        )}
      </div>
    </div>
  );
}