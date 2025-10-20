<div align="center">
<img src="assets/logo.png" alt="CodeChopper Logo"/>
<h1>CodeChopper</h1>
</div>




CodeChopper is a TypeScript library that parses and splits source code of various programming languages into semantic chunks such as functions and classes, using syntax analysis. It allows efficient extraction of specific code blocks, automatic documentation generation, and code summarization when working with large codebases.

> [!TIP]
> [DeepWiki](https://deepwiki.com/sirasagi62/code-chopper) is available.
>
> [llms-full.md](/llms-full.md) is also available. You can provide an overview of code-chopper to the AI coding tool using the following URL:
>
> `https://raw.githubusercontent.com/sirasagi62/code-chopper/refs/heads/main/llms-full.md`

## Main Features

* **Multi-language Support**: Supports parsing of various languages including TypeScript, JavaScript, Python, Ruby, Java, and C++.
* **Semantic Splitting**: Instead of simple line-by-line splitting, it uses tree-sitter to split the code based on the Concrete Syntax Tree (CST), identifying functions, classes, methods, and variable declarations.
* **Flexible Configuration**: You can customize the splitting granularity and extract only specific types of code blocks.

### Supported languages
- typescript
- javascript
- python
- c
- c++
- ruby
- rust
- golang
- java
- c#
- bash

-----

## Installation

You can install it using npm or bun.

```bash
npm install code-chopper
# or
bun add code-chopper
```

**You need to execute postinstall script to install tree-sitter dependencies.**

```bash
## Check postinstalls
bun pm untrusted

## To execute postinstalls
bun pm trust --a
```
-----


### Examples

For more advanced usage and examples, please see the following repository:

* **[sirasagi62/code-chopper-examples](https://github.com/sirasagi62/code-chopper-examples)**

----
# API Documentation

## Core Components

### ParserFactory

The `ParserFactory` is responsible for creating and managing `tree-sitter` parsers for various programming languages.

#### `createParserFactory()`

Creates and returns a new instance of `ParserFactory`.

```typescript
import { createParserFactory } from "code-chopper";

const factory = createParserFactory();
```

#### `ParserFactory.createParser(language: string)`

Asynchronously creates and returns a `tree-sitter` parser for the specified language. Returns `null` if the language is not supported or if there's an error loading the language module.

```typescript
const parser = await factory.createParser("typescript");
if (parser) {
  // Use the parser
}
```

#### `ParserFactory.dispose()`

Cleans up all resources used by the `ParserFactory`, including all created parsers.

```typescript
factory.dispose();
```

### File Operations

These functions handle reading, parsing, and chunking files.

#### `readFileAndChunk(factory: ParserFactory, options: Options, baseDirPath: string, relativeFilePath: string)`

Reads a file, determines its language, and parses it into chunks.

*   `factory`: An instance of `ParserFactory`.
*   `options`: Configuration options for chunking, including a `filter` function.
*   `baseDirPath`: The root directory path of the repository.
*   `relativeFilePath`: The path to the file to read and parse, relative to `baseDirPath`.

Returns a `Promise` that resolves to an array of `BoundaryChunk`.

#### `readDirectoryAndChunk(factory: ParserFactory, options: Options, baseDirPath: string)`

Recursively reads all supported files in a directory and its subdirectories, parsing each into chunks.

*   `factory`: An instance of `ParserFactory`.
*   `options`: Configuration options for chunking, including a `filter` function.
*   `baseDirPath`: The root directory path of the repository.

Returns a `Promise` that resolves to an array of `BoundaryChunk` from all parsed files.

#### `parseCodeAndChunk(code: string, language: LanguageEnum, factory: ParserFactory, options: Options)`

Parses a given code string into chunks based on the specified language.

*   `code`: The code string to parse.
*   `language`: The programming language of the code (e.g., "typescript", "python").
*   `factory`: An instance of `ParserFactory`.
*   `options`: Configuration options for chunking, including a `filter` function.

Returns a `Promise` that resolves to an array of `BoundaryChunk`.

## Types

### `Options`

Configuration options for chunking.

*   `filter`: An optional function `(language: LanguageEnum, node: SyntaxNode) => boolean` that determines whether a node should be included in the chunks. (Default value: `()=>true`)
*   `excludeDirs?`: An optional RegExp array of regular expressions to exclude directories. e.g. `[/node_modules/,/\.git/]`

### `BoundaryInfo`

Metadata about a code boundary.

*   `type`: The type of the boundary (e.g., "function_declaration", "class_declaration").
*   `level?`: The nesting level of the boundary.
*   `name?`: The name of the boundary (e.g., function name, class name).
*   `parent?`: An array of strings representing the parent boundaries.
*   `docs?`: Documentation string associated with the boundary.
*   `title?`: A title for the boundary.

### `BoundaryChunk`

Represents a chunk of code with associated boundary information.

*   `content`: The code content of the chunk.
*   `startOffset`: The starting character offset of the chunk within the original file.
*   `endOffset`: The ending character offset of the chunk within the original file.
*   `boundary`: An object of type `BoundaryInfo` describing the code boundary.
*   `filePath`: The path to the file from which the chunk was extracted.

### `LanguageEnum`

An enum representing the supported programming languages.

### `ParserFactory` (Interface)

An interface defining the methods available on a `ParserFactory` instance.

*   `createParser(language: string): Promise<Parser | null>`
*   `dispose(): void`

### `CSTBoundary`

Represents a raw boundary detected by the CST (Concrete Syntax Tree) parser.

*   `startIndex`: The starting index of the boundary in the source code.
*   `endIndex`: The ending index of the boundary in the source code.
*   `text`: The text content of the boundary.

### `CSTBoundaryWithMeta`

A `CSTBoundary` with additional metadata.

*   `type`: The type of the boundary.
*   `parentInfo`: An array of strings representing parent boundary information.
*   `name`: The name of the boundary, if available.
*   `docsText`: Documentation text associated with the boundary.

### `DocsDetail`

Represents detailed documentation information.

*   `hasDocs`: A boolean indicating if documentation is present.
*   `detail`: A `CSTBoundary` object containing the documentation details.

----
## License

This library is released under the **MIT License**. The full license text can be found in the [LICENSE](./LICENSE) file.

## Acknowledgments

This project partially utilizes code from [ushironoko/gistdex](https://github.com/ushironoko/gistdex).
