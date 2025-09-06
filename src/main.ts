
import { createParserFactory } from "./chunking/parser-factory.ts";
import { readDirectoryAndChunk, type Options } from "./io/file-operations.ts";
import path from "node:path";
import fs from "node:fs";

const factory = createParserFactory();
const options: Options = {
  filter(lang, node) {
    switch (lang) {
      case "javascript":
      case "typescript":
        if (node.type === "variable_declaration" || node.type === "lexical_declaration") {
          // Filter out variables that are not arrow functions
          const isArrowFunction = node.children.find(c => c.type === "variable_declarator")?.childForFieldName("value")?.type === "arrow_function";
          return isArrowFunction;
        }
    }
    return true;
  },
};

const arg2 = process.argv.at(2);
let p = arg2 ? path.join(process.cwd(), arg2) : __dirname;

if (!fs.existsSync(p)) {
  console.log("The given directory does not exist, so check the following directory instead: ", __dirname);
  p = __dirname;
}
const res = await readDirectoryAndChunk(factory, options, p);

const indentFormat = (str: string, indentLevel: number, eachIndent?: string): string => {
  eachIndent = eachIndent ?? "  ";
  return str.split('\n').map((line, i) => i === 0 ? eachIndent.repeat(indentLevel) + line : line).join('\n');
};
res.forEach(r => {
  if (!r.boundary.name)
    return;

  const parent = r.boundary.parent?.join(" > ");
  const parentText = parent ? parent + " > " : "";
  console.log("\n[[code_chunk]]");
  console.log("path = ", r.filePath);
  console.log("entity = ", parentText + r.boundary.name);
  console.log("type = ", r.boundary.type);
  console.log("docs = ", r.boundary.docs ? '\n' + r.boundary.docs : 'nil');
  console.log("code = \n", indentFormat(r.content, r.boundary.parent?.length ?? 0));

});
