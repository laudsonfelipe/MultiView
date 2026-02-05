import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { List } from "react-window";

interface VirtualizedTableProps {
  data: string[][];
  filteredData: string[][];
  visibleColumns: Set<number>;
}

interface RowData {
  rows: string[][];
  columnWidths: number[];
  visibleColumnIndexes: number[];
}

export function VirtualizedTable({
  data,
  filteredData,
  visibleColumns,
}: VirtualizedTableProps) {
  const listRef = useRef(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const headers = data.length > 0 ? data[0] : [];
  const rows = filteredData.slice(1);

  const visibleColumnIndexes = useMemo(() => {
    if (headers.length === 0 || visibleColumns.size === 0) return [];
    return headers
      .map((_, index) => index)
      .filter((index) => visibleColumns.has(index));
  }, [headers, visibleColumns]);

  // Initialize column widths
  useEffect(() => {
    if (headers.length > 0 && columnWidths.length === 0) {
      const initialWidths = headers.map(() => 200);
      setColumnWidths(initialWidths);
    }
  }, [headers, columnWidths.length]);

  const handleMouseDown = useCallback(
    (columnIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      setResizingColumn(columnIndex);
      setStartX(e.clientX);
      setStartWidth(columnWidths[columnIndex] || 200);
    },
    [columnWidths]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (resizingColumn === null) return;

      const diff = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + diff);

      setColumnWidths((prev) => {
        const newWidths = [...prev];
        newWidths[resizingColumn] = newWidth;
        return newWidths;
      });
    },
    [resizingColumn, startX, startWidth]
  );

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (resizingColumn !== null) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  const totalWidth = visibleColumnIndexes.reduce(
    (sum, index) => sum + (columnWidths[index] || 200),
    0
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-neutral-500">
        Nenhum dado disponível
      </div>
    );
  }

  const rowData: RowData = {
    rows,
    columnWidths,
    visibleColumnIndexes,
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-neutral-900 border-b-2 border-neutral-700"
        style={{
          display: "flex",
          minWidth: totalWidth,
        }}
      >
        {visibleColumnIndexes.map((columnIndex) => (
          <div
            key={columnIndex}
            style={{
              width: columnWidths[columnIndex] || 200,
              minWidth: columnWidths[columnIndex] || 200,
            }}
            className="relative px-4 py-4 text-sm text-neutral-100 border-r border-neutral-700 overflow-hidden text-ellipsis whitespace-nowrap group"
          >
            <span title={headers[columnIndex]}>{headers[columnIndex]}</span>

            {/* Resize handle */}
            <div
              onMouseDown={(e) => handleMouseDown(columnIndex, e)}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 group-hover:bg-neutral-600 transition-colors"
              style={{
                backgroundColor:
                  resizingColumn === columnIndex ? "#3b82f6" : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto">
        <List
          listRef={listRef}
          rowComponent={({
            index,
            style,
            ariaAttributes,
            rows,
            columnWidths,
            visibleColumnIndexes,
          }) => {
            const row = rows[index];
            const isEven = index % 2 === 0;

            return (
              <div
                {...ariaAttributes}
                style={{
                  ...style,
                  display: "flex",
                  borderBottom: "1px solid #262626",
                  backgroundColor: isEven ? "#0a0a0a" : "#171717",
                }}
                className="hover:bg-neutral-800 transition-colors"
              >
                {visibleColumnIndexes.map((columnIndex) => (
                  <div
                    key={columnIndex}
                    style={{
                      width: columnWidths[columnIndex] || 200,
                      minWidth: columnWidths[columnIndex] || 200,
                    }}
                    className="px-4 py-3 text-sm text-neutral-300 border-r border-neutral-800 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={row[columnIndex] || ""}
                  >
                    {row[columnIndex] || ""}
                  </div>
                ))}
              </div>
            );
          }}
          rowCount={rows.length}
          rowHeight={48}
          rowProps={rowData}
          overscanCount={10}
          style={{ height: "600px", width: "100%" }}
        />
      </div>
    </div>
  );
}