import fs from "node:fs/promises";
import path from "node:path";
import { getLanguageFromExtension } from "../chunking/file-extensions.ts";
import type { ParserFactory } from "../chunking/parser-factory.ts";
import type { BoundaryChunk } from "../chunking/boundary-aware-chunking.ts";
import { createCSTChunkingOperations } from "../chunking/cst-operations.ts";
import type { SyntaxNode } from "tree-sitter";
import type { LanguageEnum } from "../chunking/language-node-types.ts";

export type Options = {
  filter: (language: LanguageEnum, node: SyntaxNode) => boolean
}

const isSupportedLanguageExtension = (filename: string) => /\.(ts|js|tsx|jsx|py|java|cpp|c|h|cs|go|rb|php|go)/.test(filename)

/**
 * Reads a file, determines its language from the extension, and parses it into chunks.
 * @param factory The ParserFactory to create parsers.
 * @param options Options for chunking, including a filter function.
 * @param baseDirPath The root directory path of the repository.
 * @param relativeFilePath The path to the file to read and parse, relative to baseDirPath.
 * @returns A promise that resolves to an array of BoundaryChunk, each with its filePath.
 */
export const readFileAndChunk = async (
  factory: ParserFactory,
  options: Options,
  baseDirPath: string,
  relativeFilePath: string,
): Promise<BoundaryChunk[]> => {
  const code = await fs.readFile(path.join(baseDirPath, relativeFilePath), 'utf8');
  const ext = path.extname(relativeFilePath);
  const language = getLanguageFromExtension(ext);

  if (!language) {
    // If the language is not supported, we cannot chunk the file.
    // Consider logging this or returning an empty array depending on desired behavior.
    throw new Error(`Unsupported file extension: ${ext} for file ${relativeFilePath}`);
  }

  // Use parseCodeAndChunk to handle the actual parsing and chunking logic.
  const chunks = await parseCodeAndChunk(code, language, factory, options);
  // Add the filePath to each chunk for context.
  return chunks.map(c => ({
    ...c,
    filePath: relativeFilePath
  }));
};

/**
 * Recursively reads all files in a directory and its subdirectories,
 * parsing each supported file into chunks.
 * @param factory The ParserFactory to create parsers.
 * @param options Options for chunking.
 * @param baseDirPath The root directory path of the repository.
 * @param relativePath The current relative path within the directory being scanned. Defaults to "".
 * @returns A promise that resolves to an array of BoundaryChunk from all parsed files.
 */
export const readDirectoryAndChunk = async (
  factory: ParserFactory,
  options: Options,
  baseDirPath: string,
  relativePath: string = "",
): Promise<BoundaryChunk[]> => {
  let allChunks: BoundaryChunk[] = [];

  const currentPath = path.join(baseDirPath, relativePath);
  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const newRelativePath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      // Recursively call for subdirectories.
      const dirChunks = await readDirectoryAndChunk(factory, options, baseDirPath, newRelativePath);
      allChunks = allChunks.concat(dirChunks);
    } else if (isSupportedLanguageExtension(entry.name)) { // Use isSupportedLanguage for broader check
      try {
        // Use readFileAndChunk to process each supported file.
        const fileChunks = await readFileAndChunk(factory, options, baseDirPath, newRelativePath);
        allChunks = allChunks.concat(fileChunks);
      } catch (error) {
        // Log a warning if a file fails to chunk, but continue processing other files.
        console.warn(`Failed to chunk file ${newRelativePath}:`, error);
      }
    }
  }
  return allChunks;
};

/**
 * Parses a given code string into chunks based on the specified language using CST operations.
 * @param code The code string to parse.
 * @param language The programming language of the code (e.g., "typescript", "python").
 * @param factory The ParserFactory to create parsers.
 * @param options Options for chunking, including a filter function.
 * @returns A promise that resolves to an array of BoundaryChunk.
 */
export const parseCodeAndChunk = (
  code: string,
  language: LanguageEnum, // Use LanguageEnum for type safety
  factory: ParserFactory,
  options: Options,
): Promise<BoundaryChunk[]> => {
  const cstOperations = createCSTChunkingOperations();
  // The chunkWithCST method is expected to handle the language string and parser creation.
  return cstOperations.chunkWithCST(code, language, options, factory);
};
