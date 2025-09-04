import fs from "node:fs/promises";
import path from "node:path";
import { getLanguageFromExtension } from "../chunking/file-extensions.js";
import type { ParserFactory } from "../chunking/parser-factory.js";
import type { BoundaryChunk } from "../chunking/boundary-aware-chunking.js";
import { createCSTChunkingOperations } from "../chunking/cst-operations.js";

/**
 * Reads a file, determines its language from the extension, and parses it into chunks.
 * @param filePath The path to the file to read and parse.
 * @param factory The ParserFactory to create parsers.
 * @param options Options for chunking.
 * @returns A promise that resolves to an array of BoundaryChunk.
 */
export const readFileAndChunk = async (
  filePath: string,
  factory: ParserFactory,
  options: { maxChunkSize: number; overlap: number },
): Promise<BoundaryChunk[]> => {
  const code = await fs.readFile(filePath, "utf-8");
  const ext = path.extname(filePath);
  const language = getLanguageFromExtension(ext);

  if (!language) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  const cstOperations = createCSTChunkingOperations();
  return cstOperations.chunkWithCST(code, language, options, factory);
};

/**
 * Recursively reads all files in a directory and its subdirectories,
 * parsing each supported file into chunks.
 * @param directoryPath The path to the directory to scan.
 * @param factory The ParserFactory to create parsers.
 * @param options Options for chunking.
 * @returns A promise that resolves to an array of BoundaryChunk from all parsed files.
 */
export const readDirectoryAndChunk = async (
  directoryPath: string,
  factory: ParserFactory,
  options: { maxChunkSize: number; overlap: number },
): Promise<BoundaryChunk[]> => {
  let allChunks: BoundaryChunk[] = [];
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      const dirChunks = await readDirectoryAndChunk(fullPath, factory, options);
      allChunks = allChunks.concat(dirChunks);
    } else if (/\.(ts|js|tsx|jsx|py|java|cpp|c|h|cs|go|rb|php)$/.test(entry.name)) { // Example supported extensions
      try {
        const fileChunks = await readFileAndChunk(fullPath, factory, options);
        allChunks = allChunks.concat(fileChunks);
      } catch (error) {
        console.warn(`Failed to chunk file ${fullPath}:`, error);
      }
    }
  }
  return allChunks;
};

/**
 * Parses a given code string into chunks based on the specified language.
 * @param code The code string to parse.
 * @param language The programming language of the code.
 * @param factory The ParserFactory to create parsers.
 * @param options Options for chunking.
 * @returns A promise that resolves to an array of BoundaryChunk.
 */
export const parseCodeAndChunk = async (
  code: string,
  language: string,
  factory: ParserFactory,
  options: { maxChunkSize: number; overlap: number },
): Promise<BoundaryChunk[]> => {
  const cstOperations = createCSTChunkingOperations();
  // Ensure language is a valid LanguageEnum if necessary, or handle string directly
  // For now, assuming language string is directly usable by createParser
  return cstOperations.chunkWithCST(code, language as any, options, factory);
};
