/*!
 * Copyright (c) ushironoko 2025
 * Copyright (c) sirasagi62 2025
 * Published under MIT License
 * see https://opensource.org/licenses/MIT
 *
 * This code was originally created by ushironoko and modified by sirasagi62
 * Original: https://github.com/ushironoko/gistdex
 */

import type { SyntaxNode } from "tree-sitter";
import type { CSTBoundary } from "./cst-operations";

// Node type definitions for each language
// Extracted from tree-sitter parser documentation and node-types.json

export const LANGUAGE_NODE_TYPES = {
  javascript: {
    functions: [
      "function_declaration",
      "function_expression",
      //  "arrow_function",
    ],
    classes: ["class_declaration"],
    methods: ["method_definition"],
    imports: ["import_statement"],
    variables: ["variable_declaration", "lexical_declaration"],
  },
  typescript: {
    functions: [
      "function_declaration",
      "function_expression",
      //  "arrow_function",
    ],
    classes: ["class_declaration"],
    methods: ["method_definition"],
    interfaces: ["interface_declaration"],
    types: ["type_alias_declaration"],
    imports: ["import_statement"],
    variables: ["variable_declaration", "lexical_declaration", "public_field_definition"],
  },
  python: {
    functions: ["function_definition"],
    classes: ["class_definition"],
    methods: ["function_definition"], // Methods within classes are also function_definition
    imports: ["import_statement", "import_from_statement"],
    variables: ["assignment"], // Variable assignment in Python
  },
  go: {
    functions: ["function_declaration"],
    methods: ["method_declaration"],
    types: ["type_declaration"],
    imports: ["import_declaration"],
    variables: [
      "var_spec",
      "const_spec",
      "short_var_declaration",
    ],
  },
  rust: {
    functions: ["function_item"],
    structs: ["struct_item"],
    impls: ["impl_item"],
    traits: ["trait_item"],
    imports: ["use_declaration"],
    variables: ["let_declaration"],
  },
  java: {
    functions: ["method_declaration"],
    classes: ["class_declaration"],
    interfaces: ["interface_declaration"],
    imports: ["import_declaration"],
    variables: ["local_variable_declaration"],
  },
  csharp: {
    functions: ["method_declaration"],
    classes: ["class_declaration"],
    interfaces: ["interface_declaration"],
    imports: ["using_directive"],
    variables: ["local_variable_declaration"],
  },
  ruby: {
    functions: ["method"],
    classes: ["class"],
    modules: ["module"],
    imports: ["require", "load"],
    variables: ["assignment"],
  },
  c: {
    functions: ["function_definition"],
    structs: ["struct_specifier"],
    enums: ["enum_specifier"],
    typedefs: ["type_definition"],
    includes: ["preproc_include"],
    variables: ["declaration"],
  },
  cpp: {
    functions: ["function_definition"],
    classes: ["class_specifier"],
    structs: ["struct_specifier"],
    namespaces: ["namespace_definition"],
    templates: ["template_declaration"],
    includes: ["preproc_include"],
    variables: ["declaration"],
  },
  html: {
    elements: ["element"],
    scripts: ["script_element"],
    styles: ["style_element"],
  },
  css: {
    rules: ["rule_set"],
    media: ["media_statement"],
    keyframes: ["keyframes_statement"],
    imports: ["import_statement"],
  },
  bash: {
    functions: ["function_definition"],
    commands: ["command"],
    variables: ["variable_assignment"],
  },
} as const;

export type LanguageEnum = keyof typeof LANGUAGE_NODE_TYPES
// Collect all boundary node types
export const createBoundaryNodeTypes = (language: LanguageEnum): Set<string> => {
  const nodeTypes = new Set<string>();
  const langConfig =
    LANGUAGE_NODE_TYPES[language];

  if (!langConfig) {
    // Use default (JavaScript) if language config is not found
    const defaultConfig = LANGUAGE_NODE_TYPES.typescript;
    Object.values(defaultConfig)
      .flat()
      .forEach((type) => nodeTypes.add(type));
    return nodeTypes;
  }

  Object.values(langConfig)
    .flat()
    .forEach((type) => nodeTypes.add(type));
  return nodeTypes;
};

// Language-specific node name extraction implementation
export const createNodeNameExtractor = (language: string) => {
  return (node: SyntaxNode): string | undefined => {
    // Check for common 'name' field first
    const nameField = node.childForFieldName?.("name");
    if (nameField?.text) {
      return nameField.text;
    }

    // Language-specific processing
    switch (language) {
      case "javascript":
      case "typescript":
        // For Arrow functions, get the name from the parent variable_declarator
        if (node.type === "arrow_function") {
          const parent = node.parent
          if (parent) {
            const idNode = parent.childForFieldName("name")
            if (idNode?.text) {
              return idNode.text
            }
          }
        }
        if (node.type === "variable_declaration" || node.type === "lexical_declaration") {
          const child = node.children.find(c => c.type === "variable_declarator")
          if (child) {
            const idNode = child.childForFieldName("name");
            if (idNode?.text) {
              return idNode.text;
            }
          }
        }

        // For methods, get the name from the 'key' field
        if (node.type === "method_definition") {
          const keyNode = node.childForFieldName("key");
          if (keyNode?.text) {
            return keyNode.text;
          }
        }
        break;

      case "python":
        // In Python, the 'name' field is used in most cases
        break;

      case "go":
        // For Go's method_declaration
        if (node.type === "method_declaration") {
          const nameNode = node.childForFieldName("name");
          if (nameNode?.text) {
            return nameNode.text;
          }
        }
        let target = node;
        while (target.children.length > 0) {
          const nameCandidate = target.children.filter(c => c.type === "identifier")
          if (nameCandidate.length < 1) {
            if (target.firstChild) {
              target = target.firstChild
            } else {
              break
            }
          } else {
            return nameCandidate.at(0)?.text
          }
        }
        break;

      case "rust":
        // For Rust's function_item
        if (node.type === "function_item") {
          const nameNode = node.childForFieldName("name");
          if (nameNode?.text) {
            return nameNode.text;
          }
        }
        break;

      case "java":
      case "csharp":
        // For Java's method_declaration
        if (node.type === "method_declaration") {
          const nameNode = node.childForFieldName("name");
          if (nameNode?.text) {
            return nameNode.text;
          }
        }
        break;
    }

    // Fallback: look for an 'identifier' node
    const identifierChild = node.children?.find?.(
      (child: any) => child.type === "identifier",
    );
    return identifierChild?.text;
  };
};

export type DocsDetail = {
  hasDocs: true
  detail: CSTBoundary
} | { hasDocs: false }

// Factory function for extracting documentation comments (e.g., in Java, JS)
export const createDocsExtracor = (language: LanguageEnum) => {
  const extractOuterDocComment = (node: SyntaxNode): DocsDetail => {
    let doc_candidate = node.previousSibling
    switch (language) {
      case "javascript":
      case "typescript":
        if (node.parent?.type === "export_statement") {
          doc_candidate = node.parent.previousSibling
        }
        break;
      case "python":
      case "go":
      case "rust":
      case "java":
      case "ruby":
      case "c":
      case "cpp":
      case "html":
      case "css":
      case "bash":
        break;
    }
    let doc_candidate_start = doc_candidate
    let comment_text = ""
    while (
      doc_candidate_start?.previousSibling?.type.includes("comment") &&
      doc_candidate_start.startPosition.row - doc_candidate_start.previousSibling.startPosition.row === 1
    ) {
      comment_text = doc_candidate_start.text + "\n" + comment_text
      doc_candidate_start = doc_candidate_start.previousSibling
    }
    if (doc_candidate_start) {
      comment_text = doc_candidate_start.text + "\n" + comment_text
    }
    if (doc_candidate && doc_candidate_start && doc_candidate.type.includes("comment")) {
      return {
        hasDocs: true,
        detail: {
          text: comment_text,
          startIndex: doc_candidate_start.startIndex,
          endIndex: doc_candidate.endIndex,
        }
      }
    }
    return {
      hasDocs: false
    }

  }


  // Function to extract Python docstrings
  const extractPyDocComment = (node: SyntaxNode): DocsDetail => {

    const doc_candidate = node.lastChild?.firstChild?.firstChild
    if (doc_candidate && doc_candidate.type === "string") {
      return {
        hasDocs: true,
        detail: {
          text: doc_candidate.text,
          startIndex: doc_candidate.startIndex,
          endIndex: doc_candidate.endIndex,
        }
      }
    }
    return {
      hasDocs: false
    }

  }
  return (node: SyntaxNode): DocsDetail => {
    switch (language) {
      case "javascript":
      case "typescript":
      case "rust":
      case "java":
      case "ruby":
      case "c":
      case "cpp":
      case "go":
      case "csharp":
        return extractOuterDocComment(node)
      case "python":
        return extractPyDocComment(node)
      case "html":
      case "css":
      case "bash":
        return {
          hasDocs: false
        }
    }
  }
}
