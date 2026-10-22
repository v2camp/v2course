#!/usr/bin/env node
/**
 * ownership-scan —— 跨文件近似重复扫描（判据「多安家」检测）
 * =============================================================================
 * 定位
 *   course-lint 管的是「产物层面的红线」（禁词 / ASCII 图 / 段落体量），管不到
 *   **规范自身的重复**：同一个判据在 references / phases / subagents 里被各自
 *   完整声明了两遍，改一处必漏另一处。这种重复靠人读不出来，靠 review 也容易
 *   放过（两边都"看着对"），只能靠机械比对。
 *
 *   与 course-lint 的分工：lint 判产物，本脚本判规范；两者互不调用。
 *
 * 原理
 *   1. 抽取"条目行"（`- ` / `* ` / `1. ` 开头），跳过代码围栏与表格；
 *   2. 归一化（去 markdown 标记、标点、空白、大小写）；
 *   3. 两两算 bigram Jaccard 相似度；
 *   4. 超过阈值的对按相似度降序报出，供人工裁决「是分工还是重复」。
 *
 *   ⚠️ 本脚本只负责**发现疑似重复**，不负责裁决。「速查 + 指针」是合理分工，
 *   不算重复——见到命中先读两处原文，再决定是否收敛。
 *
 * 用法
 *   node scripts/ownership-scan.mjs [目标...] [选项]
 *
 *   目标可为文件或目录，默认扫 SKILL.md + references/ + phases/ + subagents/。
 *
 * 选项
 *   --min-sim <n>   相似度阈值，默认 0.72（0-1）
 *   --min-len <n>   条目最小归一化长度，默认 14（过滤短句噪声）
 *   --top <n>       最多列出多少对，默认 30
 *   --json          以 JSON 输出
 *   -h, --help      本说明
 *
 * 退出码
 *   0 = 无命中（低于阈值）    1 = 有命中    2 = 参数或路径错误
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const DEFAULT_TARGETS = ['SKILL.md', 'references', 'phases', 'subagents'];
const SKIP_FILES = new Set(['CHANGELOG.md', 'README.md']);

const HELP = [
  'ownership-scan —— 跨文件近似重复扫描（判据「多安家」检测）',
  '',
  '用法：node scripts/ownership-scan.mjs [目标...] [选项]',
  '',
  '选项：',
  '  --min-sim <n>   相似度阈值，默认 0.72',
  '  --min-len <n>   条目最小归一化长度，默认 14',
  '  --top <n>       最多列出多少对，默认 30',
  '  --json          以 JSON 输出',
  '  -h, --help      本说明',
  '',
  '目标可为文件或目录，默认：SKILL.md references/ phases/ subagents/',
  '退出码：0 无命中  1 有命中  2 参数/路径错误',
  '',
  '提示：命中不等于重复。「速查 + 指针」是合理分工；先读两处原文再裁决。',
].join('\n');

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const opts = { targets: [], minSim: 0.72, minLen: 14, top: 30, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') return { help: true };
    else if (a === '--json') opts.json = true;
    else if (a === '--min-sim') opts.minSim = Number(argv[++i]);
    else if (a === '--min-len') opts.minLen = Number(argv[++i]);
    else if (a === '--top') opts.top = Number(argv[++i]);
    else if (a.startsWith('-')) return { error: `未知选项：${a}` };
    else opts.targets.push(a);
  }
  if (!Number.isFinite(opts.minSim) || opts.minSim <= 0 || opts.minSim > 1) {
    return { error: '--min-sim 需在 (0, 1] 之间' };
  }
  if (!Number.isFinite(opts.minLen) || opts.minLen < 1) return { error: '--min-len 需 ≥ 1' };
  if (!Number.isFinite(opts.top) || opts.top < 1) return { error: '--top 需 ≥ 1' };
  if (!opts.targets.length) opts.targets = DEFAULT_TARGETS;
  return { opts };
}

// ---------------------------------------------------------------- collect

function collect(path, out) {
  if (!existsSync(path)) return;
  const st = statSync(path);
  if (st.isFile()) {
    if (path.endsWith('.md') && !SKIP_FILES.has(path.split('/').pop())) out.push(path);
    return;
  }
  for (const name of readdirSync(path).sort()) {
    if (name.startsWith('.')) continue;
    const p = join(path, name);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (name.endsWith('.md') && !SKIP_FILES.has(name)) out.push(p);
  }
}

// ---------------------------------------------------------------- extract

/** 归一化：去 markdown 标记、标点、空白、大小写，只留可比对的字面 */
function normalize(s) {
  return s
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[，。；：、！？（）《》「」『』“”‘’【】—…·]/g, '')
    .replace(/[\s,.;:!?()"'\-\u3000]+/g, '')
    .toLowerCase();
}

/** 抽取条目行；跳过代码围栏与表格行（表格结构差异大，噪声高） */
function extractEntries(file, minLen) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const out = [];
  let fence = false;
  lines.forEach((raw, i) => {
    if (/^\s*```/.test(raw)) {
      fence = !fence;
      return;
    }
    if (fence) return;
    const m = raw.match(/^\s*(?:[-*+]|\d+\.)\s+(.*\S)\s*$/);
    if (!m) return;
    const norm = normalize(m[1]);
    if (norm.length < minLen) return;
    out.push({ file, line: i + 1, text: m[1].trim(), norm });
  });
  return out;
}

// ---------------------------------------------------------------- similarity

function bigrams(s) {
  const m = new Map();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    m.set(g, (m.get(g) || 0) + 1);
  }
  return m;
}

function jaccard(a, b) {
  let inter = 0;
  let union = 0;
  for (const [g, c] of a) {
    const cb = b.get(g) || 0;
    inter += Math.min(c, cb);
    union += Math.max(c, cb);
  }
  for (const [g, c] of b) if (!a.has(g)) union += c;
  return union ? inter / union : 0;
}

// ---------------------------------------------------------------- main

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(HELP);
    process.exit(0);
  }
  if (parsed.error) {
    console.error(`[ownership-scan] ${parsed.error}\n\n${HELP}`);
    process.exit(2);
  }
  const { opts } = parsed;

  const cwd = process.cwd();
  const files = [];
  for (const t of opts.targets) {
    const abs = resolve(cwd, t);
    if (!existsSync(abs)) {
      console.error(`[ownership-scan] 路径不存在：${t}`);
      process.exit(2);
    }
    collect(abs, files);
  }
  if (!files.length) {
    console.error('[ownership-scan] 未找到可扫描的 .md 文件');
    process.exit(2);
  }

  const entries = files.flatMap((f) => extractEntries(f, opts.minLen));
  const grams = entries.map((e) => bigrams(e.norm));
  const hits = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (a.file === b.file && a.line === b.line) continue;
      // 同文件内只报高相似（同文件重复多为并列条目，噪声大）
      const sim = jaccard(grams[i], grams[j]);
      if (sim >= opts.minSim) hits.push({ sim, a, b, sameFile: a.file === b.file });
    }
  }
  hits.sort((x, y) => y.sim - x.sim);
  const shown = hits.slice(0, opts.top);

  const rel = (p) => relative(cwd, p) || p;
  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          scannedFiles: files.length,
          scannedEntries: entries.length,
          threshold: opts.minSim,
          hitCount: hits.length,
          hits: shown.map((h) => ({
            similarity: Number(h.sim.toFixed(3)),
            sameFile: h.sameFile,
            a: { file: rel(h.a.file), line: h.a.line, text: h.a.text },
            b: { file: rel(h.b.file), line: h.b.line, text: h.b.text },
          })),
        },
        null,
        2,
      ),
    );
    process.exit(hits.length ? 1 : 0);
  }

  console.log(`\n## ownership-scan（阈值 ${opts.minSim}，条目最小长度 ${opts.minLen}）`);
  console.log(`扫描 ${files.length} 个文件 / ${entries.length} 条条目`);
  if (!hits.length) {
    console.log('\n无命中 ✅  没有跨文件的高相似条目。\n');
    process.exit(0);
  }

  // 降噪分组：同文件多为模板重复行；两个 subagent 之间多为报告格式对称（必要，非重复）
  const tagOf = (h) => {
    if (h.sameFile) return '同文件';
    const a = h.a.file.includes('/subagents/');
    const b = h.b.file.includes('/subagents/');
    return a && b ? '模板对称' : '跨文件';
  };
  const counts = { 同文件: 0, 模板对称: 0, 跨文件: 0 };
  for (const h of hits) counts[tagOf(h)]++;
  console.log(
    `\n命中 ${hits.length} 对：跨文件 ${counts['跨文件']}（需逐条裁决）/ 模板对称 ${counts['模板对称']}（多为报告格式必要重复）/ 同文件 ${counts['同文件']}（多为模板重复行）`,
  );
  console.log(`\n以下按相似度排序列出前 ${shown.length}：\n`);
  for (const h of shown) {
    console.log(
      `  ${h.sim.toFixed(2)}  [${tagOf(h)}] ${rel(h.a.file)}:${h.a.line}  ↔  ${rel(h.b.file)}:${h.b.line}`,
    );
    console.log(`        A: ${h.a.text.slice(0, 70)}`);
    console.log(`        B: ${h.b.text.slice(0, 70)}`);
  }
  console.log(
    '\n> 命中不等于重复：「速查 + 指针」是合理分工。先读两处原文，再决定是否收敛到唯一家。',
  );
  console.log(`> 涉及文件：${new Set(hits.flatMap((h) => [h.a.file, h.b.file])).size} 个\n`);
  process.exit(1);
}

main();
