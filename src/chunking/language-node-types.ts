/*!
 * Copyright (c) ushirononeko 2025
 * Copyright (c) sirasagi62 2025
 * Published under MIT License
 * see https://opensource.org/licenses/MIT
 *
 * This code was originally created by ushirononeko and modified by sirasagi62
 * Original: https://github.com/ushironoko/gistdex
 */

import type { SyntaxNode } from "tree-sitter";
import type { CSTBoundary } from "./cst-operations";

// 各言語のノードタイプ定義
// Tree-sitter各パーサーのドキュメントとnode-types.jsonから抽出

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
    variables: ["variable_declaration", "lexical_declaration"],
  },
  python: {
    functions: ["function_definition"],
    classes: ["class_definition"],
    methods: ["function_definition"], // クラス内のメソッドも function_definition
    imports: ["import_statement", "import_from_statement"],
    variables: ["assignment"], // Pythonの変数代入
  },
  go: {
    functions: ["function_declaration"],
    methods: ["method_declaration"],
    types: ["type_declaration"],
    imports: ["import_declaration"],
    variables: [
      "var_declaration",
      "const_declaration",
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
// すべての境界ノードタイプを収集
export const createBoundaryNodeTypes = (language: LanguageEnum): Set<string> => {
  const nodeTypes = new Set<string>();
  const langConfig =
    LANGUAGE_NODE_TYPES[language];

  if (!langConfig) {
    // デフォルト（JavaScript）を使用
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

// ノード名抽出の言語別実装
export const createNodeNameExtractor = (language: string) => {
  return (node: SyntaxNode): string | undefined => {
    // 共通的な名前フィールドの確認
    const nameField = node.childForFieldName?.("name");
    if (nameField?.text) {
      return nameField.text;
    }

    // 言語固有の処理
    switch (language) {
      case "javascript":
      case "typescript":
        // Arrow function の場合、親の variable_declarator から名前を取得
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
          const child = node.children.find(c=>c.type==="variable_declarator")
          if (child) {
            const idNode = child.childForFieldName("name");
            if (idNode?.text) {
              return idNode.text;
            }
          }
        }

        // メソッドの場合、key フィールドから名前を取得
        if (node.type === "method_definition") {
          const keyNode = node.childForFieldName("key");
          if (keyNode?.text) {
            return keyNode.text;
          }
        }
        break;

      case "python":
        // Python の場合、name フィールドがほとんどの場合で使われる
        break;

      case "go":
        // Go の method_declaration の場合
        if (node.type === "method_declaration") {
          const nameNode = node.childForFieldName("name");
          if (nameNode?.text) {
            return nameNode.text;
          }
        }
        break;

      case "rust":
        // Rust の function_item の場合
        if (node.type === "function_item") {
          const nameNode = node.childForFieldName("name");
          if (nameNode?.text) {
            return nameNode.text;
          }
        }
        break;

      case "java":
        // Java の method_declaration の場合
        if (node.type === "method_declaration") {
          const nameNode = node.childForFieldName("name");
          if (nameNode?.text) {
            return nameNode.text;
          }
        }
        break;
    }

    // フォールバック: identifier ノードを探す
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

// java,jsなどのdocsを抽出する関数のfactory
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
    if (doc_candidate && doc_candidate.type.includes("comment")) {
      console.log(doc_candidate)
      console.log(doc_candidate.startIndex)
      console.log(doc_candidate.endIndex)
      console.log(doc_candidate.text)

      return {
        hasDocs: true,
        detail: {
          text: doc_candidate.text + '\n',
          startIndex: doc_candidate.startIndex,
          endIndex: doc_candidate.endIndex,
        }
      }
    }
    return {
      hasDocs: false
    }

  }


  // pythonのドキュメントを取ってくる関数
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
