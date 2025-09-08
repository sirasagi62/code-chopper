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

----
## License

This library is released under the **MIT License**. The full license text can be found in the [LICENSE](./LICENSE) file.

## Acknowledgments

This project partially utilizes code from [ushironoko/gistdex](https://github.com/ushironoko/gistdex).
