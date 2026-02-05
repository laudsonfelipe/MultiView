type ParserMessage =
  | {
      type: "progress";
      percent: number;
      rowsParsed: number;
    }
  | {
      type: "header";
      header: string[];
    }
  | {
      type: "rows";
      rows: string[][];
    }
  | {
      type: "done";
      rowsParsed: number;
    }
  | {
      type: "error";
      message: string;
    };

interface ParserOptions {
  extension: string;
  chunkSize?: number;
  batchSize?: number;
}

const detectDelimiter = (line: string, extension: string): string => {
  if (extension === "tsv") return "\t";
  if (extension === "psv") return "|";
  if (extension === "csv") return ",";

  const candidates = ["\t", ",", ";", "|"];
  let best = "\t";
  let bestCount = -1;

  for (const candidate of candidates) {
    const count = line.split(candidate).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }

  return best;
};

const splitDelimitedLine = (line: string, delimiter: string): string[] => {
  if (!line.includes('"')) {
    return line.split(delimiter);
  }

  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
};

self.onmessage = (event: MessageEvent<{ file: File; options: ParserOptions }>) => {
  const { file, options } = event.data;
  const extension = options.extension || "";
  const chunkSize = options.chunkSize ?? 1024 * 1024 * 10;
  const batchSize = options.batchSize ?? 2000;

  let leftover = "";
  let bytesRead = 0;
  let rowsParsed = 0;
  let delimiter: string | null = null;
  let headerSent = false;
  let batch: string[][] = [];

  const reader = new FileReaderSync();

  const flushBatch = () => {
    if (batch.length > 0) {
      const message: ParserMessage = { type: "rows", rows: batch };
      self.postMessage(message);
      batch = [];
    }
  };

  try {
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = file.slice(offset, offset + chunkSize);
      const text = reader.readAsText(chunk);
      const combined = leftover + text;
      const lines = combined.split("\n");
      leftover = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, "");
        if (!line.trim()) continue;

        if (!delimiter) {
          delimiter = detectDelimiter(line, extension);
        }

        const parsedLine = splitDelimitedLine(line, delimiter);

        if (!headerSent) {
          const message: ParserMessage = { type: "header", header: parsedLine };
          self.postMessage(message);
          headerSent = true;
          continue;
        }

        batch.push(parsedLine);
        rowsParsed += 1;

        if (batch.length >= batchSize) {
          flushBatch();
        }
      }

      bytesRead += chunk.size;
      const percent = Math.min((bytesRead / file.size) * 100, 100);
      const progressMessage: ParserMessage = {
        type: "progress",
        percent,
        rowsParsed,
      };
      self.postMessage(progressMessage);
    }

    if (leftover.trim()) {
      if (!delimiter) {
        delimiter = detectDelimiter(leftover, extension);
      }
      const parsedLine = splitDelimitedLine(leftover.replace(/\r$/, ""), delimiter);
      if (!headerSent) {
        const message: ParserMessage = { type: "header", header: parsedLine };
        self.postMessage(message);
        headerSent = true;
      } else {
        batch.push(parsedLine);
        rowsParsed += 1;
      }
    }

    flushBatch();

    const doneMessage: ParserMessage = { type: "done", rowsParsed };
    self.postMessage(doneMessage);
  } catch (error) {
    const message: ParserMessage = {
      type: "error",
      message: error instanceof Error ? error.message : "Erro ao processar arquivo",
    };
    self.postMessage(message);
  }
};
