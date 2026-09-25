import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".json"]);
const BAD = /(?:\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2[\u0080-\u00BF]|\u00F0[\u0080-\u00BF]{2}|\uFFFD)/u;

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(full);
    else if (EXTENSIONS.has(path.extname(entry.name))) {
      const text = fs.readFileSync(full, "utf8");
      if (BAD.test(text)) {
        console.error(`ERRO DE ENCODING: ${path.relative(process.cwd(), full)}`);
        process.exitCode = 1;
      }
    }
  }
}

scan(ROOT);

if (process.exitCode) {
  console.error("Build bloqueado: possível corrupção de encoding detectada.");
} else {
  console.log("ENCODING OK");
}


