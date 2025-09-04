
import { createParserFactory } from "./chunking/parser-factory";
import { readDirectoryAndChunk } from "./io/file-operations.js";


const factory = createParserFactory()
const options = { maxChunkSize: 100, overlap: 10 };
const res = await readDirectoryAndChunk(factory, options, __dirname)

const indentFormat = (str: string, indentLevel: number, eachIndent?: string): string => {
  eachIndent = eachIndent ?? '  '
  return str.split('\n').map((line,i) => i===0 ? eachIndent.repeat(indentLevel) + line : line).join('\n')
}
res.forEach(r => {
  if (!r.boundary.name)
    return

  // 定数宣言で、関数でないものを削除
  if (r.content.startsWith("const") || r.content.startsWith("let")) {
    const firstLine = r.content.split("\n")[0]
    if (!firstLine?.includes("=>") && !firstLine?.endsWith("(")) {
      return
    }
  }


  console.log("===", r.filePath, r.boundary.parent?.join(">") ?? "", r.boundary.name)
  console.log("- type:", r.boundary.type)
  console.log("- desc: ", r.boundary.docs)
  console.log(indentFormat(r.content,r.boundary.parent?.length ?? 0))

})
