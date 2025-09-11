import { readFileAndChunk, readDirectoryAndChunk, parseCodeAndChunk } from "./file-operations.js";
import { createParserFactory } from "../chunking/parser-factory.js";
import { join } from "node:path";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import fs from "node:fs"
import { describe, beforeEach, afterEach, it, expect } from "bun:test"
describe("file-operations", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(os.tmpdir(), "file-operations-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("readFileAndChunk", () => {
    it("should read a file and chunk it", async () => {
      const filePath = join(tempDir, "test.js");
      const fileContent = `
        function greet(name) {
          console.log(\`Hello, \${name}!\`);
        }
        greet("World");
      `;
      await writeFile(filePath, fileContent);

      const factory = createParserFactory();
      // Provide a filter function to satisfy the Options type
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await readFileAndChunk(factory, options, tempDir, "test.js");

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.some(chunk => chunk.content.includes("function greet"))).toBe(true);

      factory.dispose();
    });

    it("should return an empty array for unsupported file extensions", async () => {
      const filePath = join(tempDir, "test.txt");
      await writeFile(filePath, "This is a text file.");

      const factory = createParserFactory();
      // Provide a filter function to satisfy the Options type
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };

      expect(await readFileAndChunk(factory, options, tempDir, "test.txt")).toBeEmpty()

      factory.dispose();
    });

    it("should parse code and chunk it (javascript)", async () => {
      const code = `
        // This is greet!
        function greet(name) {
          console.log(\`Hello, \${name}!\`);
        }
        greet("World");
        const useGreet=()=>{
          function konnnichiha() {
            console.log("こんにちは")
          }
          return {
            konnichiha
          }
        }
      `;
      const language = "typescript";
      const factory = createParserFactory();
      // Provide a filter function to satisfy the Options type
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await parseCodeAndChunk(code, language, factory, options);
      console.log("Chunk:\n", JSON.stringify(chunks))
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.some(chunk => chunk.content.includes("function greet"))).toBe(true);

      factory.dispose();
    });

    it("should parse code and chunk it (python)", async () => {
      const code = `
def add(a: int, b: int) -> int:
    """2つの整数を加算して返す。

    Args:
        a (int): 最初の整数。
        b (int): 2番目の整数。

    Returns:
        int: a と b の和。

    Raises:
        ValueError: 入力の値が大きすぎて処理できない場合。
    """
    result = a + b
    # 必要に応じて範囲チェック
    return result`;
      const language = "python";
      const factory = createParserFactory();
      // Provide a filter function to satisfy the Options type
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await parseCodeAndChunk(code, language, factory, options);
      console.log("Chunk:\n", JSON.stringify(chunks))
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.some(chunk => chunk.content.includes("def add"))).toBe(true);

      factory.dispose();
    });

    it("should parse code and chunk it (golang)", async () => {
      const code = `
package main

import "fmt"

func main() {
    fmt.Println("Hello, Golang!")
}
      `;
      const language = "go";
      const factory = createParserFactory();
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await parseCodeAndChunk(code, language, factory, options);
      console.log("Chunk:\n", JSON.stringify(chunks))
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.some(chunk => chunk.content.includes("func main"))).toBe(true);

      factory.dispose();
    });

    it("should parse code and chunk it (c++)", async () => {
      const code = `
#include <iostream>

int main() {
    std::cout << "Hello, C++!" << std::endl;
    return 0;
}
      `;
      const language = "cpp";
      const factory = createParserFactory();
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await parseCodeAndChunk(code, language, factory, options);
      console.log("Chunk:\n", JSON.stringify(chunks))
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.some(chunk => chunk.content.includes("int main"))).toBe(true);

      factory.dispose();
    });

    it("should parse code and chunk it (java)", async () => {
      const code = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
      `;
      const language = "java";
      const factory = createParserFactory();
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await parseCodeAndChunk(code, language, factory, options);
      console.log("Chunk:\n", JSON.stringify(chunks))
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.some(chunk => chunk.content.includes("public class HelloWorld"))).toBe(true);

      factory.dispose();
    });
    it("should parse code and chunk it (c#)", async () => {
      const code = `
// Import: 必要な名前空間をインポートします
using System;
using System.Collections.Generic;

// --- クラス全体がひとつのチャンク ---
/// <summary>
/// 商品情報を管理するクラスです。
/// </summary>
/// <remarks>
/// 商品のID、名前、価格、在庫数、カテゴリを扱います。
/// </remarks>
public class Product
{
    // --- プロパティ（チャンク候補1） ---
    /// <summary>
    /// 商品を一意に識別するためのIDを取得または設定します。
    /// </summary>
    public int ProductId { get; set; }

    /// <summary>
    /// 商品名を取得または設定します。
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// 商品の価格を取得または設定します。
    /// </summary>
    public decimal Price { get; set; }

    // --- メソッド（チャンク候補2） ---
    /// <summary>
    /// 商品の在庫数を増やすメソッドです。
    /// </summary>
    /// <param name="quantity">増やす数量。</param>
    public void AddStock(int quantity)
    {
        // 在庫の増加ロジック
        if (quantity > 0)
        {
            // 在庫数フィールドの更新
        }
    }

    /// <summary>
    /// 商品の在庫数を減らすメソッドです。
    /// </summary>
    /// <param name="quantity">減らす数量。</param>
    public void DecreaseStock(int quantity)
    {
        // 在庫の減少ロジック
        if (quantity > 0)
        {
            // 在庫数フィールドの更新
        }
    }

    /// <summary>
    /// 商品情報をコンソールに出力するメソッドです。
    /// </summary>
    public void DisplayProductInfo()
    {
    	int a = 10;
        Console.WriteLine($"Product ID: {ProductId}");
        Console.WriteLine($"Name: {Name}");
        Console.WriteLine($"Price: {Price:C}");
    }
}

// --- 別クラスの例 ---
/// <summary>
/// 注文情報を管理するクラスです。
/// </summary>
public class Order
{
    public int OrderId { get; set; }
    public List<Product> Items { get; set; }
    public decimal TotalPrice { get; set; }

    public void CalculateTotalPrice()
    {
        TotalPrice = 0;
        foreach (var item in Items)
        {
            TotalPrice += item.Price;
        }
    }
}

/// <summary>
/// 記事投稿者用のQiitaPostインターフェイス
/// </summary>
interface IAuthorQiitaPost
{
    /// <summary>
    /// LGTM数を取得する
    /// </summary>
    int LGTMCount { get; }
    /// <summary>
    /// ストック数を取得する
    /// </summary>
    int StockCount { get; }
    /// <summary>
    /// 記事を削除する
    /// </summary>
    void Delete();
}
      `;
      const language = "csharp";
      const factory = createParserFactory();
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await parseCodeAndChunk(code, language, factory, options);
      console.log("Chunk:\n", JSON.stringify(chunks))
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.some(chunk => chunk.content.includes("public class Order"))).toBe(true);
      expect(chunks.some(chunk => chunk.content.includes("interface IAuthorQiitaPost"))).toBe(true);

      factory.dispose();
    });


    it("should parse code and chunk it (ruby)", async () => {
      const code = `
def greet
  puts "Hello, Ruby!"
end
greet
      `;
      const language = "ruby";
      const factory = createParserFactory();
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await parseCodeAndChunk(code, language, factory, options);
      console.log("Chunk:\n", JSON.stringify(chunks))
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.some(chunk => chunk.content.includes("def greet"))).toBe(true);

      factory.dispose();
    });
  });

  describe("readDirectoryAndChunk", () => {
    it("should read all supported files in a directory and chunk them", async () => {
      // Create dummy files
      await writeFile(join(tempDir, "file1.js"), "function hi(){}");
      await writeFile(join(tempDir, "file2.ts"), "let b: number = 2;");
      await writeFile(join(tempDir, "file3.txt"), "plain text");
      const subDir = join(tempDir, "subdir");
      await fs.promises.mkdir(subDir, { recursive: true });
      const pycode = `
def hi():
  pass
`
      await writeFile(join(subDir, "file4.py"), pycode);

      const factory = createParserFactory();
      // Provide a filter function to satisfy the Options type
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await readDirectoryAndChunk(factory, options, tempDir);

      expect(chunks.length).toBeGreaterThan(0);
      console.log(JSON.stringify(chunks))
      expect(chunks.filter(chunk => chunk.boundary.type === "function_declaration").length).toBe(1); // For file1.js
      expect(chunks.filter(chunk => chunk.boundary.type === "lexical_declaration").length).toBe(1); // For file2.ts
      expect(chunks.filter(chunk => chunk.boundary.type === "function_definition").length).toBe(1); // For file4.py

      factory.dispose();
    });

    it("should handle empty directories", async () => {
      const factory = createParserFactory();
      // Provide a filter function to satisfy the Options type
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await readDirectoryAndChunk(factory, options, tempDir);

      expect(chunks).toEqual([]);

      factory.dispose();
    });

    it("should ignore unsupported files within a directory", async () => {
      await writeFile(join(tempDir, "unsupported.dat"), "binary data");

      const factory = createParserFactory();
      // Provide a filter function to satisfy the Options type
      const options = { maxChunkSize: 100, overlap: 10, filter: () => true };
      const chunks = await readDirectoryAndChunk(factory, options, tempDir);

      expect(chunks).toEqual([]);

      factory.dispose();
    });
  });
});
