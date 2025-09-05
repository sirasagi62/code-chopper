import { createParserFactory } from "./chunking/parser-factory.ts";
import { readDirectoryAndChunk, type Options } from "./io/file-operations.ts";
import path from "path";
import fs from "fs"

const factory = createParserFactory()
const options: Options = {
  filter: (_, node) => {
    if (node.type.includes("import")) {
      return false
    }
    return true
  }
};
const arg2 = process.argv.at(2)
let p = arg2 ? path.join(process.cwd(), arg2) : __dirname

if (!fs.existsSync(p)) {
  console.log("The given directory does not exist, so check the following directory instead: ", __dirname)
  p = __dirname
}

const res = await readDirectoryAndChunk(factory, options, p)
const eachIndent = '  '
const indentFormat = (str: string, indentLevel: number): string => {
  return str.split('\n').map((line, i) => i === 0 ? "|" + eachIndent.repeat(indentLevel) + line : "|" + line).join('\n')
}
let filename = ""

res.forEach(r => {
  //if (!r.boundary.name) return
  if (r.filePath && r.filePath !== filename) {
    console.log("\n" + r.filePath + ":")
    filename = r.filePath
    console.log("|...")
  }
  if (r.boundary.docs) console.log(indentFormat(r.boundary.docs, r.boundary.parent?.length ?? 0))
  const content = r.content.split("\n")
  console.log("|" + eachIndent.repeat(r.boundary?.parent?.length ?? 0) + content[0])
  if (content.length > 1) console.log("|...")
})
