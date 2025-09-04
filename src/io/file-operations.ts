import fs from "node:fs/promises"; // Changed to sync fs
import path from "node:path";
import { getLanguageFromExtension } from "../chunking/file-extensions.js";
import type { ParserFactory } from "../chunking/parser-factory.js";
import type { BoundaryChunk } from "../chunking/boundary-aware-chunking.js";
import { createCSTChunkingOperations } from "../chunking/cst-operations.js";
import type { SyntaxNode } from "tree-sitter";

type Options = {
  filter: (node: SyntaxNode) => boolean
}

/**
 * Reads a file, determines its language from the extension, and parses it into chunks.
 * @param relativeFilePath The path to the file to read and parse.
 * @param factory The ParserFactory to create parsers.
 * @param options Options for chunking.
 * @returns A promise that resolves to an array of BoundaryChunk.
 */
export const readFileAndChunk = async (
  factory: ParserFactory,
  options: { maxChunkSize: number; overlap: number },
  baseDirPath: string,
  relativeFilePath: string,
): Promise<BoundaryChunk[]> => {
  const code = await fs.readFile(path.join(baseDirPath, relativeFilePath), 'utf8');
  const ext = path.extname(relativeFilePath);
  const language = getLanguageFromExtension(ext);

  if (!language) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  // Use parseCodeAndChunk instead of direct CST operations
  const chunks = await parseCodeAndChunk(code.toString(), language, factory, options);
  return chunks.map(c => ({
    ...c,
    filePath: relativeFilePath
  }))
};

/**
 * Recursively reads all files in a directory and its subdirectories,
 * parsing each supported file into chunks.
 * @param baseDirPath The path to the directory to scan.
 * @param factory The ParserFactory to create parsers.
 * @param options Options for chunking.
 * @returns A promise that resolves to an array of BoundaryChunk from all parsed files.
 */
export const readDirectoryAndChunk = async (
  factory: ParserFactory,
  options: { maxChunkSize: number; overlap: number },
  baseDirPath: string,
  relativePath?: string,
): Promise<BoundaryChunk[]> => {
  let allChunks: BoundaryChunk[] = [];

  relativePath = relativePath ?? ""
  const entries = await fs.readdir(path.join(baseDirPath, relativePath), { withFileTypes: true });
  for (const entry of entries) {
    const relativeDirPath = path.join(relativePath, entry.name).toString();
    if (entry.isDirectory()) {
      const dirChunks = await readDirectoryAndChunk(factory, options, baseDirPath, relativeDirPath);
      allChunks = allChunks.concat(dirChunks);
    } else if (/\.(ts|js|tsx|jsx|py|java|cpp|c|h|cs|go|rb|php|go)$/.test(entry.name)) { // Added go
      try {
        // Use readFileAndChunk which now uses parseCodeAndChunk
        const fileChunks = await readFileAndChunk(factory, options, baseDirPath, relativeDirPath);
        allChunks = allChunks.concat(fileChunks);
      } catch (error) {
        console.warn(`Failed to chunk file ${relativeDirPath}:`, error);
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
export const parseCodeAndChunk = (
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
