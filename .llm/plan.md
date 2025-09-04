# Library Plan: Semantic Code Chunking with Tree-sitter

## Goal
To create a library that semantically splits code into meaningful chunks using the tree-sitter parsing library.

## Core Technology
*   **tree-sitter**: For parsing code into Abstract Syntax Trees (ASTs).

## Current State
The `src` directory contains the following modules:
*   `chunking/boundary-aware-chunking.ts`: Handles the logic for identifying chunk boundaries.
*   `chunking/cst-operations.ts`: Contains utility functions for manipulating the Concrete Syntax Tree (CST) or AST.
*   `chunking/file-extensions.ts`: Maps file extensions to their corresponding tree-sitter parsers and language identifiers.
*   `chunking/language-node-types.ts`: Defines the specific AST node types relevant for different programming languages.
*   `chunking/parser-factory.ts`: Responsible for creating tree-sitter parsers based on language.
*   `io/file-operations.ts`: (New) Will contain functions for reading and parsing files.

## Development Plan

### Phase 1: Core Functionality & Refinement

1.  **Understand Existing Code**: Thoroughly analyze the current `src` files to understand their roles and how they interact.
2.  **Define Chunking Strategy**:
    *   Identify key AST node types that represent semantic units (e.g., functions, classes, statements, expressions).
    *   Develop logic to traverse the AST and group related nodes into chunks.
    *   Consider how to handle different programming language syntaxes and their specific AST structures.
3.  **Implement Boundary Awareness**: Refine chunking to be "boundary-aware," meaning chunks should respect logical code boundaries (e.g., not splitting a function definition across two chunks).
4.  **Add Support for More Languages**: Expand `chunking/file-extensions.ts` and `chunking/language-node-types.ts` to support a wider range of programming languages. This will involve identifying the correct tree-sitter parsers for each language.
5.  **Testing**:
    *   Write unit tests for each module in `src`.
    *   Develop integration tests that parse various code snippets and verify the generated chunks.

### Phase 2: API Design & Usability

1.  **Define Public API**: Design a clear and intuitive API for the library. This might include functions to:
    *   Parse a file or code string.
    *   Generate chunks from the parsed AST.
    *   Specify language or parser.
2.  **Documentation**: Write comprehensive documentation for the API, including usage examples.
3.  **Error Handling**: Implement robust error handling for parsing errors, unsupported languages, etc.

### Phase 3: Advanced Features & Optimization

1.  **Contextual Chunking**: Explore more advanced chunking strategies that consider the context of code (e.g., grouping related functions or variables).
2.  **Performance Optimization**: Profile the library and optimize performance for large codebases.
3.  **Integration**: Consider how this library could be integrated with other tools (e.g., IDEs, code analysis tools).

## Next Steps
*   Begin by thoroughly reviewing the existing code in the `src` directory.
*   Start defining the core chunking logic and identifying relevant AST node types for a primary language (e.g., TypeScript or JavaScript).
