#!/usr/bin/env node
/**
 * course-lint —— 课程产物的机械闸门（Phase 5 Step 0 前置）
 * =============================================================================
 * 定位
 *   课程审查清单里的机械可检项（禁词 / ASCII 组图 / 占位标题 / 图片可达 /
 *   讲义↔课程文档结构对齐 / 段落体量）靠人眼勾稽不可复现：同一份讲义换个人、
 *   换一轮就漏。本脚本把这些项固化成可回归的闸门，Phase 5 开审前先跑一遍，
 *   人只处理脚本报出来的行与"脚本判不了"的语义问题。
 *
 * 用法
 *   node scripts/course-lint.mjs <子命令> <目标...> [选项]
 *
 * 子命令
 *   scan       红线扫描：禁用词 / ASCII 组图（含目录树、调用链）/ 占位标题 /
 *              图片引用不可达 / 内嵌 file:// 与 data:image / 代码围栏不成对
 *   structure  讲义 ↔ 课程文档 二级标题序列比对（归一化序号与【备课参考】↔【延伸阅读】）
 *   kiss       可读性量化：超阈值段落、最长段、代码块缺导语、单节概念密度
 *   all        依次执行 scan → structure → kiss
 *
 * 目标
 *   文件：`*-讲义.md`（讲义）或同名课程文档；也可直接传目录（默认只扫该层，
 *   加 -r 递归）。讲义与课程文档按"去掉 -讲义"自动配对。
 *
 * 选项
 *   --json                以 JSON 输出（便于 CI / 程序消费），仍保留退出码语义
 *   --max-chars <n>       kiss 的段落字数阈值，默认 380
 *   --ignore <name,...>   structure 比对时忽略的讲义专有段名（默认「课前准备」）
 *   -r, --recursive       目录递归
 *   -h, --help            本说明
 *
 * 退出码
 *   0 = 无命中（kiss 只出报告，恒 0）
 *   1 = scan / structure 有命中
 *   2 = 参数或路径错误
 *
 * 判据来源：references/review-checklist.md（九维）、references/quality-guide.md
 *          （禁词与 ASCII 边界）、references/executable-claims.md（I1-I5）。
 */

import fs from 'node:fs';
import path from 'node:path';

const MAX_CHARS_DEFAULT = 380;
const TREE_CHARS = /[├└│┬┴┼┤┌┐┘↳⇢]/;
const BANNED_PHRASES = [
  '综上所述', '总而言之', '值得注意的是', '需要指出的是',
  '不可否认的是', '扮演着不可或缺的角色', '如前所述', '正如前面所提到的',
  '具有里程碑意义的', '革命性的', '众所周知', '大家都知道',
  '让我们', '我们来看', '不得不说', '某种意义上',
];
/** 列举型词只在「句首/分句首 + 顿号逗号」时算 AI 腔；句中正常用法（"再次投递"）不报 */
const ENUMERATION_RE = /(^|[。；;！？!?]\s*|，\s*)(首先|其次|再次|最后)\s*[，,、]/;
const PLACEHOLDER_HEAD = /^#{1,6}\s*(?:第[一二三四五六七八九十百零\d]+[段讲节])?\s*[：:]\s*(破题|收口|开场钩子|钩子)(?:\s|$|——)/;
const PLACEHOLDER_TAIL = /^#{1,6}\s*(?:破题|收口|开场钩子|钩子)\s*(?:——|--|:)/;
const PLACEHOLDER_LONE = /^#{2,6}\s*(?:\d+(?:\.\d+)?\s*)?(?:破题|收口|开场钩子)\s*$/;
const LECTURE_ONLY_DEFAULT = ['课前准备'];

// ---------------------------------------------------------------- 文件发现

function expand(targets, recursive) {
  const files = [];
  for (const t of targets) {
    const p = path.resolve(t);
    if (!fs.existsSync(p)) {
      console.error(`路径不存在：${t}`);
      process.exit(2);
    }
    const st = fs.statSync(p);
    if (st.isFile()) {
      if (p.endsWith('.md')) files.push(p);
      continue;
    }
    const walk = (dir, depth) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (recursive && depth < 6) walk(fp, depth + 1);
        } else if (ent.name.endsWith('.md')) {
          files.push(fp);
        }
      }
    };
    walk(p, 0);
  }
  return [...new Set(files)];
}

/** 讲义与课程文档配对：key = 去掉 -讲义 的路径 */
function pair(files) {
  const map = new Map();
  for (const f of files) {
    const isLecture = f.endsWith('-讲义.md');
    const key = isLecture ? f.slice(0, -'-讲义.md'.length) : f.replace(/\.md$/, '');
    const slot = map.get(key) ?? {};
    slot[isLecture ? 'lecture' : 'doc'] = f;
    map.set(key, slot);
  }
  return map;
}

// ---------------------------------------------------------------- 公共解析

function readLines(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/);
}

/** 遍历行，标记代码块内/外 */
function* walkWithCodeState(lines) {
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith('```')) {
      yield { i, line, inCode: true, fence: true };
      inCode = !inCode;
      continue;
    }
    yield { i, line, inCode, fence: false };
  }
}

function stripInline(s) {
  return s
    .replace(/`[^`]*`/g, '')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}

// ---------------------------------------------------------------- scan

function scan(files) {
  const findings = [];
  const push = (file, line, rule, detail) =>
    findings.push({ file, line, rule, detail: detail.slice(0, 160) });

  for (const file of files) {
    const lines = readLines(file);
    const dir = path.dirname(file);
    let fenceCount = 0;

    for (const { i, line, inCode, fence } of walkWithCodeState(lines)) {
      const no = i + 1;
      if (fence) {
        fenceCount++;
        continue;
      }

      // ASCII 组图（含目录树 / 调用链）：代码块内也查——目录树常写在代码块里
      if (TREE_CHARS.test(line)) {
        push(file, no, 'ASCII图', line.trim());
      }
      if (inCode) continue;

      // 占位标题
      const h = line.trimStart();
      if (h.startsWith('#')) {
        if (PLACEHOLDER_HEAD.test(h) || PLACEHOLDER_TAIL.test(h) || PLACEHOLDER_LONE.test(h)) {
          push(file, no, '占位标题', h);
        }
      }

      // 禁用词：短语直接匹配，列举型词按语境匹配
      const plain = stripInline(line);
      for (const w of BANNED_PHRASES) {
        if (plain.includes(w)) {
          push(file, no, `禁用词:${w}`, line.trim());
          break;
        }
      }
      const enumHit = ENUMERATION_RE.exec(plain);
      if (enumHit) push(file, no, `禁用词:${enumHit[2]}（列举式）`, line.trim());

      // 内嵌资源
      if (line.includes('file://')) push(file, no, 'file协议链接', line.trim());
      if (/data:image\//.test(line)) push(file, no, '内嵌图片base64', '（行内 data:image）');

      // 图片可达
      const imgRe = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
      let m;
      while ((m = imgRe.exec(line))) {
        const target = m[1];
        if (/^(https?:)?\/\//.test(target) || target.startsWith('data:')) continue;
        if (path.isAbsolute(target)) {
          push(file, no, '绝对路径图片', target);
          continue;
        }
        const abs = path.resolve(dir, target.split('#')[0]);
        if (!fs.existsSync(abs)) push(file, no, '图片不可达', target);
      }
    }

    if (fenceCount % 2 !== 0) {
      findings.push({ file, line: lines.length, rule: '代码围栏不成对', detail: `围栏标记 ${fenceCount} 个` });
    }
  }
  return findings;
}

// ---------------------------------------------------------------- structure

const ORDINAL_PREFIX = [
  /^第[一二三四五六七八九十百零\d]+[段讲节部分]\s*[：:]\s*/,
  /^[一二三四五六七八九十]+\s*[、.．]\s*/,
  /^[（(][一二三四五六七八九十\d]+[）)]\s*/,
  /^\d+(?:\.\d+)*\s*[、.．]?\s*/,
];

function normalizeHeading(t) {
  let s = t.trim();
  for (const re of ORDINAL_PREFIX) s = s.replace(re, '');
  s = s.replace(/[（(]\s*\d+\s*[-–~]?\s*\d*\s*(?:min|分钟)\s*[）)]/gi, '');
  s = s.replace(/【备课参考】/g, '【延伸阅读】');
  s = s.replace(/^【延伸阅读】\s*本节延展阅读$/, '【延伸阅读】');
  return s.trim();
}

function headings(file, level = 2) {
  const re = new RegExp(`^${'#'.repeat(level)}\\s+(.+)$`);
  const out = [];
  for (const { line, inCode } of walkWithCodeState(readLines(file))) {
    if (inCode) continue;
    const m = re.exec(line.trimEnd());
    if (m) out.push(normalizeHeading(m[1]));
  }
  return out;
}

function structure(map, ignoreLectureOnly) {
  const rows = [];
  for (const [key, slot] of map) {
    if (!slot.lecture) continue;
    const name = path.basename(slot.lecture);
    if (!slot.doc) {
      rows.push({ file: name, status: 'missing-doc', diffs: [] });
      continue;
    }
    const a = headings(slot.lecture).filter((t) => !ignoreLectureOnly.includes(t));
    const b = headings(slot.doc);
    if (a.length === b.length && a.every((v, i) => v === b[i])) {
      rows.push({ file: name, status: 'ok', count: a.length, diffs: [] });
      continue;
    }
    const diffs = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] ?? '<缺>';
      const y = b[i] ?? '<缺>';
      if (x !== y) diffs.push({ index: i + 1, lecture: x, doc: y });
    }
    // 段数相同 = 仅措辞不同（双端文体差异，提示性）；段数不同 = 结构真的不对齐
    rows.push({
      file: name,
      status: a.length === b.length ? 'wording' : 'diff',
      count: `${a.length}/${b.length}`,
      diffs,
    });
  }
  return rows;
}

// ---------------------------------------------------------------- kiss

function kissStats(file, maxChars) {
  const lines = readLines(file);
  const paras = [];
  let cur = [];
  let section = null;
  const conceptsPerSection = new Map();
  const codeBlocks = [];
  let inCode = false;
  let prevMeaningful = null;

  const flush = () => {
    if (cur.length) {
      paras.push(cur.join(''));
      cur = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const s = raw.trim();

    if (s.startsWith('```')) {
      if (!inCode) codeBlocks.push({ line: i + 1, prev: prevMeaningful });
      inCode = !inCode;
      flush();
      prevMeaningful = s;
      continue;
    }
    if (inCode) continue;

    if (s.startsWith('#')) {
      flush();
      section = s;
      prevMeaningful = s;
      continue;
    }
    if (!s) {
      flush();
      continue;
    }
    if (/^(\||-\s|\*\s|\d+\.|>)/.test(s) || s.startsWith('![')) {
      flush();
      prevMeaningful = s;
      continue;
    }

    cur.push(stripInline(s));
    if (section && (s.includes('【知识点】') || /^\*\*[^*]{2,20}\*\*/.test(s))) {
      conceptsPerSection.set(section, (conceptsPerSection.get(section) ?? 0) + 1);
    }
    prevMeaningful = s;
  }
  flush();

  const lens = paras.map((p) => p.length);
  const long = paras.filter((p) => p.length > maxChars);
  const noLead = codeBlocks.filter((b) => {
    if (!b.prev) return true;
    // 小节标题可充当导语；表格/图片/紧邻上一个代码块则属实缺导语
    return /^(\||!\[|```)/.test(b.prev);
  });
  const maxConcept = conceptsPerSection.size ? Math.max(...conceptsPerSection.values()) : 0;

  return {
    file: path.basename(file),
    paras: paras.length,
    overThreshold: long.length,
    threshold: maxChars,
    longest: lens.length ? Math.max(...lens) : 0,
    codeBlocks: codeBlocks.length,
    codeNoLead: noLead.length,
    noLeadLines: noLead.map((b) => b.line),
    maxConceptsPerSection: maxConcept,
    longSamples: long
      .sort((x, y) => y.length - x.length)
      .slice(0, 5)
      .map((p) => ({ chars: p.length, head: p.slice(0, 28) })),
  };
}

// ---------------------------------------------------------------- 输出

function printScan(findings, json) {
  if (json) return;
  if (!findings.length) {
    console.log('## scan：无命中 ✅');
    return;
  }
  console.log('## scan');
  let last = null;
  for (const f of findings) {
    if (f.file !== last) {
      console.log(`\n### ${f.file}`);
      last = f.file;
    }
    console.log(`- L${f.line} [${f.rule}] ${f.detail}`);
  }
  const byRule = findings.reduce((acc, f) => ((acc[f.rule] = (acc[f.rule] ?? 0) + 1), acc), {});
  console.log('\n汇总：' + Object.entries(byRule).map(([k, v]) => `${k} × ${v}`).join('；'));
}

function printStructure(rows, json) {
  if (json) return;
  console.log('\n## structure（讲义 ↔ 课程文档）');
  for (const r of rows) {
    if (r.status === 'ok') {
      console.log(`- ${r.file}：✅ 对齐（${r.count} 段）`);
    } else if (r.status === 'missing-doc') {
      console.log(`- ${r.file}：⚠️ 未找到同名课程文档`);
    } else if (r.status === 'wording') {
      console.log(`- ${r.file}：🟡 段数一致（${r.count}），措辞不同 ${r.diffs.length} 处（双端文体差异，供参考）`);
      for (const d of r.diffs.slice(0, 6)) {
        console.log(`    [${d.index}] 讲义：${d.lecture}`);
        console.log(`         文档：${d.doc}`);
      }
      if (r.diffs.length > 6) console.log(`    …另有 ${r.diffs.length - 6} 处`);
    } else {
      console.log(`- ${r.file}：❌ 不一致（讲义/文档 ${r.count} 段）`);
      for (const d of r.diffs.slice(0, 12)) {
        console.log(`    [${d.index}] 讲义：${d.lecture}`);
        console.log(`         文档：${d.doc}`);
      }
      if (r.diffs.length > 12) console.log(`    …另有 ${r.diffs.length - 12} 处`);
    }
  }
}

function printKiss(rows, json, maxChars) {
  if (json) return;
  console.log(`\n## kiss（段字数阈值 ${maxChars}）`);
  console.log('| 文件 | 段>阈值 | 最长段 | 代码块 | 缺导语 | 单节最多概念 |');
  console.log('|:--|--:|--:|--:|--:|--:|');
  for (const r of rows) {
    console.log(
      `| ${r.file} | ${r.overThreshold} | ${r.longest} | ${r.codeBlocks} | ${r.codeNoLead} | ${r.maxConceptsPerSection} |`,
    );
  }
  const worst = rows.filter((r) => r.overThreshold > 0).sort((a, b) => b.longest - a.longest).slice(0, 3);
  for (const r of worst) {
    console.log(`\n- ${r.file} 最长段样本：` + r.longSamples.map((s) => `${s.chars} 字「${s.head}…」`).join('；'));
  }
  console.log('\n> 阈值只作提示：>380 字建议拆，220-380 字不强拆（拆开易成 1-2 句碎片段）。');
}

// ---------------------------------------------------------------- main

function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
    console.log(
      [
        'course-lint —— 课程产物机械闸门',
        '',
        '用法：node scripts/course-lint.mjs <scan|structure|kiss|all> <目标...> [选项]',
        '',
        '选项：--json  --max-chars <n>  --ignore <段名,...>  -r   -h',
        '',
        '目标可为文件或目录（目录默认只扫本层，-r 递归），讲义与课程文档按去掉 -讲义 自动配对。',
      ].join('\n'),
    );
    process.exit(argv.length ? 0 : 2);
  }

  const cmd = argv[0];
  if (!['scan', 'structure', 'kiss', 'all'].includes(cmd)) {
    console.error(`未知子命令：${cmd}`);
    process.exit(2);
  }

  const recursive = argv.includes('-r') || argv.includes('--recursive');
  const json = argv.includes('--json');
  const getOpt = (name, dflt) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
  };
  const maxChars = Number(getOpt('--max-chars', MAX_CHARS_DEFAULT)) || MAX_CHARS_DEFAULT;
  const ignore = getOpt('--ignore', LECTURE_ONLY_DEFAULT.join(',')).split(',').map((s) => s.trim()).filter(Boolean);

  const targets = argv.slice(1).filter((a) => !a.startsWith('-') && !/^\d+$/.test(a));
  if (!targets.length) {
    console.error('缺少目标路径');
    process.exit(2);
  }

  const files = expand(targets, recursive);
  if (!files.length) {
    console.error('未找到 .md 文件');
    process.exit(2);
  }
  const map = pair(files);

  const out = {};
  let bad = false;

  if (cmd === 'scan' || cmd === 'all') {
    out.scan = scan(files);
    if (out.scan.length) bad = true;
    printScan(out.scan, json);
  }
  if (cmd === 'structure' || cmd === 'all') {
    out.structure = structure(map, ignore);
    if (out.structure.some((r) => r.status === 'diff' || r.status === 'missing-doc')) bad = true;
    printStructure(out.structure, json);
  }
  if (cmd === 'kiss' || cmd === 'all') {
    out.kiss = files.map((f) => kissStats(f, maxChars));
    printKiss(out.kiss, json, maxChars);
  }

  if (json) {
    console.log(JSON.stringify({ command: cmd, files: files.length, ...out }, null, 2));
  }
  process.exit(bad ? 1 : 0);
}

main();
