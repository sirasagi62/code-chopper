# CodeChopper

CodeChopper is a TypeScript library that parses and splits source code of various programming languages into semantic units such as functions and classes, using syntax analysis. It allows efficient extraction of specific code blocks, automatic documentation generation, and code summarization when working with large codebases.

## Main Features

* **Multi-language Support**: Supports parsing of various languages including TypeScript, JavaScript, Python, Ruby, Java, and C++. 
* **Semantic Splitting**: Instead of simple line-by-line splitting, it uses tree-sitter to split the code based on the Concrete Syntax Tree (CST), identifying functions, classes, methods, and variable declarations. 
* **Flexible Configuration**: You can customize the splitting granularity and extract only specific types of code blocks.

### Supported languages
typescript,javascript,python,c,c++,ruby,rust,golang,java,bash

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

-----

# Example Code
This is a basic example code for CodeChopper. This example extracts the definitions of functions, variables, classes, etc. across the entire project, in a format similar to Aider's repomap or ctags.
```typescript
import { createParserFactory, readDirectoryAndChunk, type Options } from "code-chopper";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const factory = createParserFactory();
const options: Options = {
  filter: (_, node) => {
    // Exclude import statements
    if (node.type.includes("import")) {
      return false;
    }
    return true;
  }
};
const arg2 = process.argv.at(2);
let p = arg2 ? path.join(process.cwd(), arg2) : path.dirname(fileURLToPath(import.meta.url));

if (!fs.existsSync(p)) {
  console.log("The given directory does not exist, so check the following directory instead: ", p);
  p = __dirname;
}

const res = await readDirectoryAndChunk(factory, options, p);
const eachIndent = '  ';
const indentFormat = (str: string, indentLevel: number): string => {
  return str.split('\n').map((line, i) => i === 0 ? "|" + eachIndent.repeat(indentLevel) + line : "|" + line).join('\n');
};
let filename = "";

res.forEach(r => {
  // If the file path has changed, print the new file path and a separator
  if (r.filePath && r.filePath !== filename) {
    console.log("\n" + r.filePath + ":");
    filename = r.filePath;
    console.log("|...");
  }
  // Print documentation if available
  if (r.boundary.docs) console.log(indentFormat(r.boundary.docs, r.boundary.parent?.length ?? 0));
  const content = r.content.split("\n");
  // Print the first line of the code chunk, indented by its parent level
  console.log("|" + eachIndent.repeat(r.boundary?.parent?.length ?? 0) + content[0]);
  // Indicate if there's more content in the chunk
  if (content.length > 1) console.log("|...");
});
```
