/*!
 * Copyright (c) ushirononeko 2025
 * Copyright (c) sirasagi62 2025
 * Published under MIT License
 * see https://opensource.org/licenses/MIT
 *
 * This code was originally created by ushirononeko and modified by sirasagi62
 * Original: https://github.com/ushironoko/gistdex
 */



import Parser from "tree-sitter";
import {
  type SupportedLanguage,
  isSupportedLanguage,
} from "./file-extensions.ts";
import { exit } from "node:process";

// Language module loader
const createLanguageLoader =
  () =>
    async (language: SupportedLanguage): Promise<any> => {
      try {
        switch (language) {
          case "javascript":
          case "typescript":
            const ts = await import("tree-sitter-typescript");
            return ts.typescript ?? ts.default?.typescript ?? ts.default;
          case "python":
            return (await import("tree-sitter-python")).default;
          case "go":
            return (await import("tree-sitter-go")).default;
          case "rust":
            return (await import("tree-sitter-rust")).default;
          case "java":
            return (await import("tree-sitter-java")).default;
          case "csharp":
            return (await import("tree-sitter-c-sharp")).default
          case "ruby":
            return (await import("tree-sitter-ruby")).default;
          case "c":
            return (await import("tree-sitter-c")).default;
          case "cpp":
            return (await import("tree-sitter-cpp")).default;
          case "html":
            return (await import("tree-sitter-html")).default;
          case "css":
            return (await import("tree-sitter-css")).default;
          case "bash":
            return (await import("tree-sitter-bash")).default;
          default:
            return null;
        }
      } catch {
        console.log("Failed to load language module for ",language)
        return null;
      }
    };

// Parser factory interface
export interface ParserFactory {
  createParser: (language: string) => Promise<Parser | null>;
  dispose: () => void;
}

// Parser factory function
export const createParserFactory = (): ParserFactory => {
  const parsers = new Map<string, Parser>();
  const loader = createLanguageLoader();

  const createParser = async (language: string): Promise<Parser | null> => {
    // Safely check if it's a SupportedLanguage using a type guard
    if (!isSupportedLanguage(language)) {
      console.warn(`${language} is not supported.`)
      return null;
    }

    if (!parsers.has(language) && loader) {
      const languageModule = await loader(language);
      if (languageModule) {
        const parser = new Parser();
        try {
          parser.setLanguage(languageModule);
          parsers.set(language, parser);
        } catch (e) {
          console.log("Loading Module:",languageModule.name)
          exit()
        }
      }
    }
    return parsers.get(language) || null;
  };

  const dispose = () => {
    parsers.clear();
  };

  return { createParser, dispose };
};
