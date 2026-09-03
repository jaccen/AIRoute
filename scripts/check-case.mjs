// 全量扫描 src/ 下 import/require 路径与磁盘文件大小写是否匹配（修正版 v3）
// 用法: node scripts/check-case.mjs
import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";

const SRC = resolve("src");
const EXTS = [".ts", ".tsx", ".mjs", ".js", ".jsx"];

function walk(dir) {
  const out = {};
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out[name] = walk(p);
    else out[name] = "file";
  }
  return out;
}
const tree = walk(SRC);

function findEntry(node, name, exact = false) {
  if (!node || typeof node !== "object") return null;
  const keys = Object.keys(node);
  for (const k of keys) {
    if (exact ? k === name : k.toLowerCase() === name.toLowerCase()) return k;
  }
  return null;
}

// 从 fromRel（相对 src 的目录路径，如 "app/(dashboard)/dashboard"）解析 spec
function resolvePath(fromRel, spec) {
  let base = spec.startsWith("@/")
    ? []
    : fromRel.split(/[\\/]/).filter(Boolean);
  let rest = spec.startsWith("@/") ? spec.slice(2) : spec;
  if (!spec.startsWith("@/") && !spec.startsWith(".")) return null; // bare module

  // 处理相对路径 . 和 ..
  const rawParts = rest.split("/").filter((p) => p && p !== ".");
  for (const p of rawParts) {
    if (p === "..") base.pop();
    else base.push(p);
  }
  rest = base.join("/");

  let node = tree;
  let curRel = "";
  const parts = rest.split("/").filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    const isLast = i === parts.length - 1;
    if (!isLast) {
      const actual = findEntry(node, seg);
      if (!actual) return null;
      node = node[actual];
      curRel = curRel ? curRel + "/" + actual : actual;
    } else {
      // 最后一个段：先精确匹配（含扩展名）
      let actual = findEntry(node, seg, true);
      if (actual && node[actual] !== "file") {
        for (const ext of EXTS) {
          const idx = findEntry(node[actual], "index" + ext, true);
          if (idx) return { path: curRel + "/" + actual + "/" + idx, caseOk: true };
        }
        return { path: curRel + "/" + actual, caseOk: true };
      }
      if (actual) return { path: curRel + "/" + actual, caseOk: true };
      // 精确 + 扩展名
      for (const ext of EXTS) {
        actual = findEntry(node, seg + ext, true);
        if (actual) return { path: curRel + "/" + actual, caseOk: true };
      }
      // 精确 index
      for (const ext of EXTS) {
        actual = findEntry(node, "index" + ext, true);
        if (actual) return { path: curRel + "/" + actual, caseOk: true };
      }
      // 大小写不敏感回退
      actual = findEntry(node, seg);
      if (actual) return { path: curRel + "/" + actual, caseOk: false };
      for (const ext of EXTS) {
        actual = findEntry(node, seg + ext);
        if (actual) return { path: curRel + "/" + actual, caseOk: false };
      }
      for (const ext of EXTS) {
        actual = findEntry(node, "index" + ext);
        if (actual) return { path: curRel + "/" + actual, caseOk: false };
      }
      return null;
    }
  }
  return null;
}

function collect(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...collect(p));
    else if (/\.(ts|tsx|mjs|js|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

const files = collect(SRC);
const problems = [];

for (const f of files) {
  const content = readFileSync(f, "utf8");
  const re = /(?:import\s+(?:[^'"]*?\s+from\s+)?|from\s+|require\s*\(\s*)["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(content))) {
    const spec = m[1];
    if (!spec.startsWith(".") && !spec.startsWith("@/")) continue;
    const fromRel = relative(SRC, dirname(f)).replace(/\\/g, "/");
    const resolved = resolvePath(fromRel, spec);
    if (!resolved) {
      problems.push({ file: relative(SRC, f), spec, issue: "NOT_FOUND" });
      continue;
    }
    if (!resolved.caseOk) {
      problems.push({ file: relative(SRC, f), spec, actual: resolved.path, issue: "CASE_MISMATCH" });
    }
  }
}

console.log(`Scanned ${files.length} files under src/`);
if (problems.length === 0) {
  console.log("OK: no case mismatches found");
} else {
  console.log(`Found ${problems.length} problem(s):`);
  for (const p of problems) {
    console.log(`  ${p.file} -> ${p.spec} | ${p.issue}${p.actual ? " (disk: " + p.actual + ")" : ""}`);
  }
}