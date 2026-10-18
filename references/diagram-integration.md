# 制图集成规范（course-skill × v2svg）

> 本文件定义 course-skill 生成矢量图（架构图 / 流程图 / 序列图）的统一入口。
> 凡涉及制图，一律先读本文件，再动手；禁止让模型直接手写 SVG 坐标或主观评判配色。

---

## 0. 概述与定位

- **v2svg 是独立 skill，course-skill 是它的消费者之一**。course-skill 只调用 v2svg 的 CLI 接口，**v2svg 不得反向依赖 course-skill 的任何文件**（封装铁律）。
- **唯一制图入口**：架构图 / 流程图 / 序列图全部走 `v2svg` —— 先写 IR JSON → `svg validate` 校验 → `svg render` 出图。模型**禁止手写 SVG 文件、手写坐标、主观选择配色**。
- **边界（关键）**：v2svg 只管**矢量图**（architecture / flow / sequence）。截图、位图、PPT 用图、外部企业架构图仍走 `quality-guide.md §3.3` 的普适图片规范，**不在此管线内**，详见 §7。

---

## 1. 调用约定（CLI）

所有命令通过 `node <v2svg>/bin/svg.mjs` 执行（`v2svg` 根目录的探测见 §3，禁止硬编码绝对路径）。

```bash
node <v2svg>/bin/svg.mjs doctor
node <v2svg>/bin/svg.mjs guide "<场景>"
node <v2svg>/bin/svg.mjs validate <type> <input.json> [--quality standard|showcase] [--variant-pair <dir>] [--json]
node <v2svg>/bin/svg.mjs render   <type> <input.json> <output.svg> [--quality standard|showcase] [--variant-pair <dir>] [--json]
```

- `<type>` ∈ `architecture` / `flow` / `sequence`
- `--quality`：`standard` 跑 12 项检查，`showcase` 跑满 15 项检查（默认建议用 `showcase`）
- `--variant-pair <dir>`：传**双轨根目录**（其下各轨为子目录），启用 `variant_parity` 检查各轨 `images/*.svg` 数量与文件名是否一致；不传则该项按"跳过"处理（仍计入总数但恒为 `ok`）
- **退出码**：`0` 通过 / `1` 验证失败 / `2` 用法错误
- 质量档位只由 `--quality` 决定，不写进 IR

### IR（中间表示）JSON 契约

三种图共用 `role` 枚举：

| role | 含义 | 配色 |
|:---|:---|:---|
| `control` | 控制流（编排/调度/状态） | 紫 |
| `capability` | 能力域（工具/算子/外部系统） | 绿 |
| `interaction` | 交互域（协议/接口/数据契约） | 蓝 |
| `warn` | 警告/冲突节点 | 橙红 |
| `neutral` | 中性节点 | 灰 |

- **architecture**：`groups?` + `nodes[]` + `edges?`
- **flow**：`stages?`（演进路线档位）+ `nodes[]`（kind: start/step/decision/terminal）+ `edges?`
- **sequence**：`participants[]` + `messages[]`（kind: sync/async/return/self）

具体字段以 v2svg 自带 schema 文件与该技能的 **diagram-spec** 说明文档为准（二者均在 v2svg 仓，不在本 skill 内；course-skill 不重述色值/坐标）。

### `--json` 回执形状

`validate` / `render` 加 `--json` 输出机器可读回执，质量门禁必须读取它：

```json
{
  "schemaVersion": 1,
  "ok": true,
  "command": "render",
  "type": "architecture",
  "input": "...", "output": "...",
  "checks": [{ "name": "...", "ok": true, "details": [] }],
  "composition": {
    "profile": "showcase",
    "status": "pass",
    "summary": { "total": 15, "passed": 15, "failed": 0 }
  },
  "artifact": { "bytes": 27959, "sha256": "..." }
}
```

---

## 2. 各课型图类型选用指南

| 场景 | 图类型 | 说明 |
|:---|:---|:---|
| 系统/组件的拓扑、模块关系、应用架构课代码映射 | `architecture` | 用 `nodes`/`edges` 描述结构，类名/包名须与代码一致（见 §6） |
| 流程、步骤、分支判断、演进路线图 | `flow` | 演进路线用 `stages` 承载各档位 |
| 多角色/多系统按时间顺序的交互 | `sequence` | 用 `participants` + `messages` 描述调用顺序 |

简判原则：**静态结构用 architecture，带步骤/阶段用 flow，带时间顺序用 sequence**。一图只表达一种主关系，避免把架构与流程混在一张图里。

---

## 3. 路径探测（禁止硬编码）

course-skill **不得写死** v2svg 的绝对路径。运行时按已知位置顺序探测 v2svg 的 `SKILL.md`，找到后用其所在目录推算 `bin/svg.mjs`：

1. `./.agents/skills/v2svg/SKILL.md`（当前项目下的 submodule 安装位）
2. `<repo>/.agents/skills/v2svg/SKILL.md`（仓库根的 .agents）
3. `~/.workbuddy/skills/v2svg/SKILL.md`（全局 WorkBuddy 技能位）
4. `~/.codebuddy/skills/v2svg/SKILL.md` 等常见全局技能目录

探测到第一个存在即停止，取其目录拼出 `bin/svg.mjs`。若全部未命中，按 §5 降级，**禁止静默回退到手写 SVG**。

> 推荐做法：在调用前用一个探测命令（如向上查找 `v2svg/SKILL.md`）拿到根目录，赋给变量 `<v2svg>`，后续命令统一用 `node "$ARCHSVG/bin/svg.mjs"`。

---

## 4. 回执驱动的质量门禁

不要主观评判"图好不好看"。进入 Phase 5 审查前，所有矢量图必须：

1. 已通过 `svg render --quality showcase --json`，回执 `ok: true`；
2. 读取 `composition.summary`：`passed === total`（showcase 档须 **15/15**）方算通过；
3. 逐条核对 `checks[]` 中的 6 项文档集成专项是否全过：`no_ascii` / `no_base64` / `ref_reachable` / `caption_present` / `theme_readable` / `variant_parity`；
4. 9 项构图检查（finite_svg / node_overlap / relationship_crossings / label_route_clearance / orthogonal_arrows / relationship_corridors / container_border_runs / route_rhythm / legend_clearance）须全部 `ok`。

**有界重试**：若 `validate` 报错，按回执 `supportedFixes` 修复后重跑；连续两轮修复未降低错误数即**停止并如实报告**未解决诊断，禁止以裁剪内容、`overflow:hidden`、缩小字号等手段伪造通过。

---

## 5. 降级策略（关键，禁止静默）

当 §3 探测不到 v2svg（未安装 / 环境缺失）时：

- **必须明确告知用户**：当前环境无 v2svg 自动化验证，制图质量门禁从"机械校验"降级为"主观审查"，不再有 15/15 回执保证。
- **回落方式**：仅当确需出图时，由人工手写 SVG 并**严格遵守 `quality-guide.md §3.3` 普适图片规范**（禁 base64 内嵌、禁 ASCII 图、独立文件存 `images/`、相对路径引用、数据表优先 Markdown）。这只在已向用户声明降级后才允许。
- **禁止静默回退**：不得假装已验证通过，不得在报告里写"15/15"。在 `phase-4 sync-record` / `phase-5` 评估报告中如实记录"v2svg 缺失，已降级为主观审查"。

---

## 6. 课程特有要求

| 课型 | 对图的特有特殊要求 | v2svg 落地 |
|:---|:---|:---|
| **实战课（含演进路线）** | 演进路线图：总图（S0→S4 横向卡片、本课档位高亮）+ 每档 ≥1 张拓扑图；起点档描述须与主 Demo 代码一致 | 类型 `flow` + `stages`（档位即 stage）；course 检查 `caption_present` + 图数量；起点对齐由人工/技术布道师核对代码 |
| **实战课·应用架构** | 图中类名/包名须与真实代码 100% 一致；指标对比、评测结果等结构化数据用 **Markdown 表格**，不配图 | `architecture` 类型；代码一致性 v2svg **不校验**，须由技术布道师审 G2–G7；对比表走 Markdown |
| **双轨（TS/Java）** | `images/` 图数量与语义对齐，两轨语义对应、布局可由 v2svg 不同但含义一致 | `variant_parity` 检查（图数量）；两轨各自渲染、成对产出，不漏轨；**语义对齐** v2svg 不校验，须人工/技术布道师核 |
| **录播课** | 文档内架构/流程/序列图走本管线；**PPT 用图**可接受位图（见 §3.3），不强制 v2svg | 文档矢量图 → architecture/flow/sequence；PPT 用图见 §3.3 |
| **架构案例分析书** | 图遵循底线规范（禁 ASCII、走 v2svg），无额外专项；封面/架构图用 v2svg | architecture/flow 由 v2svg 渲染；无 variant_parity 要求 |

> 共性底线（所有课型）：禁 ASCII、禁 base64/内嵌、独立文件存 `images/`、相对路径引用、数据表优先 Markdown、截图/位图单列（§3.3 保留）。

**横向折行流程图两端齐平**（v2svg ≥ 0.2.0）：`flow` + `layout:horizontal` 的 S 型折行图，布局器默认保证每行最左盒左缘统一齐平、最右盒右缘统一齐平（行内间隙 justify 拉宽、折回边锚齐平缘内缩处保持直竖线）。瘦高竖向主链图应改横向折行以节约版面；存量横向图重渲染即生效。发现两端错位**不得手改坐标伪造对齐**——核对 v2svg 版本，低于 0.2.0 先升级，高于仍错位则按 §4 回执报障。

**竖向长条机械拦截**（v2svg ≥ 0.3.0）：`flow` 图成品高宽比 > 1.2 且节点 ≥ 4，`portrait_strip` 检查直接判 FAIL——瘦高竖向图嵌入竖排讲义后两侧留白过大，必须改 `layout:horizontal` + 宽幅 `viewBox`（如 `[1000,720]`）。确需纵向的层级语义（决策树、纵深分层）在 `meta.allowPortrait` 写 ≥ 8 字理由豁免，豁免理由会进回执供 Phase 5 复核。Phase 3B 制图时即按此判据选布局，不要等检查拦截再返工；近方形（高宽比 ≤ 1.2）与小图（节点 < 4）不受约束。

### 6.1 图资产的复用与随课次迁移

课程结构变更（课次合并／拆分／课型混编／内容折入邻课）会让一批图失去引用方。处理规则：

- **迁移前先查内嵌文案是否绑定课次**：v2svg 产出物会把 `meta.caption`（形如「图 10-2 · …」）渲染进 SVG 正文，`grep` 一次即可判定。未绑定课次的可整文件改名到新课次系列（`trip10-*` → `trip12-*`）并挂回新引用；已绑定的必须**从 IR 重出**，改名改不动正文。
- **无 IR 的图不可校准**：手工 SVG 与历史遗留图没有 IR，换口径后无法重渲染，只能整文件复用——此时须人工核对图内文案与新技术口径无冲突，并在收尾声明「未经 IR 校准」。**此类图不应再新增**（IR 与 SVG 同目录同基名入库，见技能目录 `AGENTS.md`）。
- **迁移后做两向核对**：① 文中引用的图都存在（无悬空引用）；② `images/` 内没有无人引用的图（无孤儿）。两者 `grep` 即可过，属收尾必做项。
- **迁移随当轮提交入库**：改名／删除与当轮改动一起提交，不留在工作区过夜——否则下一轮会把孤儿当成在用资产，也可能被误当作「在途改动」阻塞收尾。

---

## 7. 与 quality-guide §3.3 的边界（重申）

v2svg 与 §3.3 是**互补**而非替代关系：

**v2svg 负责**（矢量图生成 + 机械校验）：
- 架构图 / 流程图 / 序列图的自动布局、三域 role 配色、暗色自适应、零 JS 静态 SVG 产出
- 15 项检查（9 构图 + 6 课程专项）的自动验证
- 单图 < 35 KB 的产物约束

**§3.3 普适图片规范继续适用**（覆盖所有图片，含截图/位图/外部图）：
- 禁 base64 / data URI 内嵌，图片独立文件存 `images/`
- 引用路径相对，如 `![RAG 四步链路](./images/rag-4-steps.svg)`
- 数据表格优先用 Markdown 表格，不要截图
- 绝对禁止 ASCII 图
- 位图/图表、PPT 用图、外部企业架构图（含 attribution）仍按 §3.3 处理，不走 v2svg

> 一句话：矢量图交给 v2svg，其余图片按 §3.3。两套规则都对"禁 ASCII / 禁内嵌 / 独立文件 / 相对路径"达成一致，不冲突。
