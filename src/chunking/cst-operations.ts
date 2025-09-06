import path from "node:path";
import type { SyntaxNode } from "tree-sitter";
import type {
  BoundaryChunk,
  BoundaryChunkOptions,
} from "./boundary-aware-chunking.ts";
import { getLanguageFromExtension } from "./file-extensions.ts";
import {
  createBoundaryNodeTypes,
  createDocsExtracor,
  createNodeNameExtractor,
  type LanguageEnum,

} from "./language-node-types.ts";
import type { ParserFactory } from "./parser-factory.ts";
import { createParserFactory } from "./parser-factory.ts";
import type { Options } from "../io/file-operations.ts";

export interface CSTBoundary {
  startIndex: number;
  endIndex: number;
  text: string;
}

export type CSTBoundaryWithMeta = {
  type: string;
  parentInfo: string[];
  name: string|undefined;
  docsText: string
} & CSTBoundary

// Node traversal operations
const createNodeTraverser = (language: LanguageEnum) => {
  const boundaryNodeTypes = createBoundaryNodeTypes(language);
  const extractName = createNodeNameExtractor(language);
  const extractDocs = createDocsExtracor(language);

  const isBoundary = (nodeType: string): boolean =>
    boundaryNodeTypes.has(nodeType);

  const traverse = (node: SyntaxNode, filter: (l: LanguageEnum, s: SyntaxNode) => boolean): CSTBoundaryWithMeta[] => {
    const boundaries: CSTBoundaryWithMeta[] = [];

    const visit = (node: SyntaxNode, parentInfo: string[]): void => {
      const docs = extractDocs(node);
      const name = extractName(node);
      if (isBoundary(node.type) && filter(language, node)) {
        boundaries.push({
          type: node.type,
          parentInfo,
          name,
          startIndex: docs.hasDocs ? docs.detail.startIndex : node.startIndex,
          endIndex: node.endIndex,
          text: node.text,
          docsText: docs.hasDocs ? docs.detail.text : ""
        });
        parentInfo = name ? [...parentInfo, name] : parentInfo;
      }

      for (const child of node.children) {
        visit(child, parentInfo);
      }
    };

    visit(node, []);
    return boundaries;
  };

  return { traverse };
};

// CST parsing operations
const createCSTOperations = (factory: ParserFactory) => {
  const parseAndExtractBoundaries = async (
    code: string,
    language: LanguageEnum,
    options: Options,
  ): Promise<CSTBoundaryWithMeta[]> => {
    const parser = await factory.createParser(language);
    if (!parser) {
      throw new Error(`No parser available for language: ${language}`);
    }

    const traverser = createNodeTraverser(language);
    const tree = parser.parse(code);
    return traverser.traverse(tree.rootNode, options.filter);
  };

  const boundariesToChunks = (boundaries: CSTBoundaryWithMeta[]): BoundaryChunk[] => {
    return boundaries.map((boundary) => ({
      content: boundary.text,
      startOffset: boundary.startIndex,
      endOffset: boundary.endIndex,
      boundary: {
        type: boundary.type,
        name: boundary.name,
        parent: boundary.parentInfo,
        docs: boundary.docsText
      },
    }));
  };

  return { parseAndExtractBoundaries, boundariesToChunks };
};

// Function composition with 'with' pattern
export const withCSTParsing = async <T>(
  factory: ParserFactory,
  operation: (ops: ReturnType<typeof createCSTOperations>) => Promise<T>,
): Promise<T> => {
  const ops = createCSTOperations(factory);
  try {
    return await operation(ops);
  } finally {
    // Resource cleanup is managed at the factory level
  }
};

// Export CST operations (for testing)
export { createCSTOperations };

// High-level chunking operations
export const createCSTChunkingOperations = () => {
  const chunkWithCST = async (
    code: string,
    language: LanguageEnum,
    _options: Options,
    factory: ParserFactory,
  ): Promise<BoundaryChunk[]> => {
    return withCSTParsing(factory, async (ops) => {
      const boundaries = await ops.parseAndExtractBoundaries(code, language, _options);
      return ops.boundariesToChunks(boundaries);
    });
  };

  const chunkWithFallback = async (
    code: string,
    filePath: string,
    options: Options,
    fallback: (
      code: string,
      lang: string,
      opts: Options,
    ) => BoundaryChunk[],
  ): Promise<BoundaryChunk[]> => {
    const ext = path.extname(filePath);
    const language = getLanguageFromExtension(ext);

    if (!language) {
      return fallback(code, "unknown", options);
    }

    const factory = createParserFactory();

    try {
      return await chunkWithCST(code, language, options, factory);
    } catch (error) {
      console.warn(`CST parsing failed for ${filePath}, using fallback`);
      return fallback(code, language, options);
    } finally {
      factory.dispose();
    }
  };

  return { chunkWithCST, chunkWithFallback };
};
