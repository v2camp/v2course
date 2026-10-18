---
name: course-skill
version: 4.11.0
agent_created: true
description: This skill should be used when the user mentions 做课、写讲义、课程策划、公开课大纲、录播课脚本、晋升辅导、面试脚本、架构案例分析书、写架构书、案例书, or any course/coaching production task. 指导从 0 到 1 策划并制作高品质的各类课程与辅导材料（公开课、实战课、迷你课、录播课、晋升辅导、面试辅导等），也可创作架构案例分析书等长文档。支持多版本管理与视角 A-H 质量门禁。产物体系按「课型默认 × 消费者判定」裁剪——课型给默认（公开课三产物、实战课二产物、录播课五产物），消费者不存在时对应产物降级为过程产物。
triggers:
- 公开课
- 实战课
- 迷你课
- 晋升辅导
- 面试辅导
- 课程大纲
- 课程制作
- course
- cs
- 做课
- 开发课程
- 讲义
- 课程方案
- 辅导方案
- 录播课
- PPT文稿
- 录制脚本
- 架构案例分析书
- 架构书
- 案例分析书
- 案例书
- 架构案例分析
---

# 课程与辅导制作 Skill v4.11

你是**高级课程产品专家**，负责驱动各类课程或辅导项目从 0 到 1 的全流程。

**适用范围 / 不适用范围**与**6 阶段方法论骨架速查**见 `references/boundary.md`。

## 0. 启用前版本自检（必做）

进入本 Skill、产出任何内容前，必须先执行版本自检并向用户汇报：

- 读 `SKILL.md` frontmatter `version`；
- 读 `CHANGELOG.md` 最新一条目，摘出最近变更要点；
- 读 `AGENTS.md`「当前版本」表的 `revision`（对应提交 hash）。

汇报格式：`course-skill v<版本号>（revision <hash>）· 最近变更：<要点>`。
若用户期望的版本与汇报不一致（例如用户以为已升级、实际加载的是旧目录），停止产出并提示先同步技能目录。

## 1. 核心工作流：Plan 驱动

进入本 Skill 后，必须立即调用 `enter_plan_mode` 制定产出计划。计划需基于：
- **具体课程名称**
- **课程类型**（公开课、实战课·基础/实战、实战课·应用架构、迷你课、辅导类、录播课）
- **具体版本**（如：TS 版、Java 版，或多版本并行）
- **具体产物与目标**（依**消费者**而定，课型给默认，见 §4「产物体系」；如实战课的讲义+课程文档、公开课的讲义、面试脚本）

### Skill 依赖
- **联网研究**：Phase 2 工业案例调研与深入思考题候选题检索优先通过 **agent-reach skill** 执行。若 agent-reach 不可用，可使用 WebSearch + WebFetch 组合替代，但必须遵循相同的信源优先级和新鲜度约束。
- **演进路线方法论**：系列实战课的"架构演进路线图"段遵循 `references/evolution-roadmap.md` 规范。
- **深入思考题方法论**：实战课的"附录深入思考题"遵循 `references/interview-questions.md` 规范。
- **应用架构代码引用规范**：实战课·应用架构类型遵循 `references/code-reference-feishu.md` 规范。
- **课程文档文体规范**：面向学员的课程文档遵循 `references/quality-guide.md §4` 规范。
- **活人感写作层**：句段中文如何“像人在认真讲清楚”遵循 `references/human-prose.md`（材料门、说话位置、动作级禁令、中文力学；改稿规则只在初稿后加载）。与 quality-guide **同时满足**，冲突按 `human-prose.md` §0 优先级。
- **架构案例写作规范**：架构类长文档（应用架构课课程文档、架构案例分析书等）遵循 `references/architecture-case-writing.md` 规范，风格基准为李智慧《大型网站技术架构》。
- **架构叙述方式规范**：架构类长文档的句段级叙述质量（去电报体/清单体、演进线显性化、表后解读、术语首现即释、代码引用为锚、案例入正文）遵循 `references/architecture-narrative.md` 规范（八大病灶），与 architecture-case-writing.md 配套使用。
- **风格锚点样本**：应用架构课与架构书动笔写正文前，通读 `examples/architecture-style-anchor.md` 对齐"李智慧式"质感（开场/演进叙事/小结/语言四个样本）。检查清单定底线，锚点样本给质感——两者配套。

## 2. 课型 → 加载清单矩阵

按课型按需加载，避免全量加载。

| 课型 | 必载 reference | 必载 subagent |
|:---|:---|:---|
| **公开课** | quality-guide, templates, anti-patterns | expression-coach, tech-evangelist, 运营专员 |
| **实战课·基础/实战** | quality-guide, **diagram-integration**, core-principles, evolution-roadmap, interview-questions, multi-track-production, templates, anti-patterns | expression-coach, tech-evangelist, code-reviewer, 运营专员 |
| **实战课·应用架构** | quality-guide, **diagram-integration**, **architecture-case-writing**, **architecture-narrative**, **examples/architecture-style-anchor**, core-principles, evolution-roadmap, interview-questions, code-reference-feishu, architecture-course, multi-track-production, templates, anti-patterns | expression-coach, tech-evangelist, code-reviewer, 运营专员 |
| **迷你课** | quality-guide, templates, anti-patterns | expression-coach |
| **晋升辅导** | quality-guide, templates, anti-patterns | expression-coach, tech-evangelist |
| **面试辅导** | quality-guide, templates, anti-patterns | expression-coach, tech-evangelist |
| **录播课** | quality-guide, templates, anti-patterns | expression-coach, tech-evangelist, 运营专员 |
| **架构案例分析书** | quality-guide, **architecture-case-writing**, **architecture-narrative**, **examples/architecture-style-anchor**, templates, anti-patterns | expression-coach, tech-evangelist |

> **写作层默认同载**：上表凡有 `quality-guide` 的课型，创作与改稿均同时遵循 `references/human-prose.md`（初稿用 §1–2，成稿后用 §3–5）。

## 3. 快速路径判断

如果用户请求明确是**局部优化任务**且已有完整初稿，可跳过 Phase 0-2，直接进入对应阶段：

| 任务类型 | 快速路径 |
|:---|:---|
| 仅润色讲义措辞/去 AI 腔 | **加载 `human-prose.md` 全文 + quality-guide 教学底线**，按改稿顺序 §5 清句；不重跑全流程 |
| 仅生成课程文档（从已有讲义转换） | Phase 3C + Phase 5 表达+技术审查（课程文档） |
| 仅补充/优化制图（走 v2svg：IR→validate→render） | Phase 3B 子集 + Phase 5 视觉审查（读 v2svg 回执）；详见 `references/diagram-integration.md` |
| 仅对齐/修复代码引用（应用架构课） | Phase 5 **视角 G**（代码引用与飞书兼容）审查 + 修正；取值与调用点核验见 `references/multi-track-production.md` §2.5 |
| 审查/复核/重新审已完成的课程产物（讲义/课程文档，非局部润色） | **先按 §2 课型矩阵对该课型加载完整必载 reference 清单**，再执行 Phase 5 全量视角 A-H 审查 + 四专家审计；审查纪律与九维勾稽见 `references/review-checklist.md`。**禁止跳过必载清单降格为单文档文体润色** |
| 跨版本转换/复制（已有某版本完整产物） | Phase 3D（转换子代理）+ Phase 4 L0 红线扫描 + Phase 5 表达+技术审查 |
| 双轨/多轨净新建（从单一源头派生第二/第三轨） | 新流程（契约映射表先行 → 反向派生，见 `references/multi-track-production.md`）+ Phase 4 L0 红线扫描 |
| 仅补充深入思考题 | 从 Phase 2 §C 开始 |
| 仅优化大纲（运营视角，公开课/录播课） | Phase 3A 子集 + Phase 5 运营专员审查 |
| 仅优化讲义运营面（实战课） | Phase 3B 子集 + Phase 5 运营专员审查（审讲义的标题/痛点/转化/物料可用性） |
| 从一组场景题/素材生成架构案例分析书 | 架构书专用流程（见 §5 下方说明）+ Phase 5 技术+表达审查 |

> **注意**：快速路径仅适用于明确的局部修改，完整课程制作仍必须走 6 阶段全流程。

## 4. 课程类型定义

| 类型 | 目标 | 核心产出 | 审计重点 |
|------|------|----------|----------|
| **公开课** | 认知破题、转化承接 | 大纲.md, 讲义.md, 课程文档.md | 转化逻辑、叙事张力、三产物角色清晰 |
| **实战课·基础/实战** | 技能习得、作品沉淀 | 讲义.md, 课程文档.md, images/（**二产物，无大纲**） | 技术深度、闭环完整性、多版本差异；入门规格：basic DoD 红线、预置/现场写分界、成品预览 |
| **实战课·应用架构** | 架构思维培养 | 讲义.md, 课程文档.md, images/（**二产物，无大纲**） | 架构决策清晰度、量化对比、代码引用准确性、飞书兼容性、basic→full 对照锚点 |
| **迷你课** | 快速解决单点问题 | 指南.md | 精炼度、即学即用性 |
| **晋升辅导** | 价值叙事、架构表达 | 晋升汇报.md | 架构高度、价值对齐 |
| **面试辅导** | 能力展示、亮点构建 | 面试脚本.md | 逻辑严密性、个人亮点 |
| **录播课** | 平台合作、口碑沉淀 | 大纲.md、讲义.md、课程文档.md、PPT文稿.md、录制脚本.md | 知识性/实用性/效率/情绪价值；平台合规；五产物一致性 |
| **架构案例分析书** | 架构思维体系化呈现 | 一本成体系的书（`.md`，多章节） | 结构模板遵循、数字量化、案例可靠性、兜底思维、小结提炼原则 |

> **组内混编**：同一组实战课可前段用「基础/实战」（入门规格，从零做出能跑的 basic）、后段用「应用架构」（讲 basic→full 工业级增强），两课型共用一条演进叙事。入门规格结构骨架、90 分钟节奏、预置/现场写分界见 `references/templates.md §3.2`；basic/full 工程组织与 DoD 红线见 `references/multi-track-production.md` §5。

实战课·应用架构专项要求详见 `references/architecture-course.md`。

### 产物体系（课型默认 × 消费者判定）

**产物是"消费者"的函数，不是"课型"的固定属性。** 每条产物线都对应一类消费者；消费者不存在时，该产物**降级为过程产物**（存入 `.course/`，不交付、不审计），而不是被"跳过"——它仍是下游派生的来源。

| 消费者 | 对应产物 | 消费者不存在时 |
|:---|:---|:---|
| 运营 / 营销（做海报、详情页、推文） | 大纲 | 大纲非交付物；其结构信息由讲义 / 课程文档承担 |
| 真人讲师（现场或录制授课） | 讲义 | 讲义降级为**内部底稿**：3C 仍从它派生，但不进课程目录、不参与审计 |
| 学员（自学 / 课后复习） | 课程文档 | 无学员即无交付物，须回 Phase 1 重定目标 |
| 录制 / 剪辑 | PPT文稿 ＋ 录制脚本 | 两者免产 |

判定时机：Phase 0 产出「产物裁剪卡」，勾选本课**实际消费者**并据此推出交付物集合；未勾选即取课型默认（下表），因此默认行为不变。

| 课型 | 默认交付物（= 默认消费者组合） |
|:---|:---|
| **公开课** | 大纲 → 讲义 → 课程文档（运营 ＋ 讲师 ＋ 学员） |
| **实战课**（基础/实战、应用架构） | 讲义 → 课程文档（**默认无运营消费者，故无大纲**） |
| **录播课** | 大纲 → 讲义 → 课程文档 ＋ PPT文稿 ＋ 录制脚本 |

> 实战课"不产出大纲"正是本机制的历史实例——其运营面由讲义承担。判定机制只是把这条既有经验显式化，并推广到全部课型。

链式派生：后一个基于前一个的结构与素材改写，结构 **1:1 对齐**。**上游降级为过程产物时派生链照常执行**（3C 仍从 3B 底稿派生），只是该上游不进课程目录、不参与 Phase 5 审计。

> **交付物 vs 过程产物**：交付物进课程目录、参与 Phase 5 审计；过程产物存 `.course/{task_name}/`，仅供派生与追溯。同一份内容（如讲义）在某课是交付物、在另一课可能只是过程产物。

各产物的角色定位：

| 产物 | 服务角色 | 核心价值 | 文体风格 |
|:---|:---|:---|:---|
| **大纲** | 运营人员 | 把课程结构说清楚，用于做流量物料、海报文案、课程详情页（仅公开课/录播课） | 结构清单式、要点化、无口语 |
| **讲义** | 讲师 | 备课+授课的完整底稿，含讲课节奏、演示动作、备课参考 | 工程口语化、讲师视角、有张力 |
| **课程文档** | 学员 | 课后复习、自主学习的主文档，可直接当作教程阅读 | 书面技术文、客观中立、知识密度高 |

## 5. 阶段指南（按计划执行）

| Step | Phase | 加载文件 | 核心任务 |
|------|-------|----------|----------|
| 1 | Explore & Challenge | `phases/phase-0-explore.md` | 确认时长、确认命名规范示例、区分多版本共性/特性、定位卡 |
| 2 | Decide the Spine | `phases/phase-1-spine.md` | 一句话主张、主线结构、边界说明、演进路线决策、附录思考题决策 |
| 3 | Build Evidence System | `phases/phase-2-cases.md` | 双轨证据卡、演进线证据、深入思考题候选题卡片（用户选4道） |
| 4 | Produce Assets | `phases/phase-3-produce.md` | **公开课/录播课**：3A 大纲 → 3B 讲义 → 3C 课程文档；**实战课**：跳过 3A，3B 讲义 → 3C 课程文档。链式生产；多版本复制转换走 3D（转换子代理） |
| 5 | Consistency Sync | `phases/phase-4-sync.md` | 多版本同步（L0 版本独立红线 + L1-L3 对齐 + L4 独立）、产物结构一致性、时间标记拉齐、附录对齐、代码对齐记录 |
| 6 | Review & Audit | `phases/phase-5-review.md` + `subagents/*` | 视角 A-H 评估、四专家审计（表达教练/技术布道师/代码审查/运营专员） |

### 架构案例分析书专用流程（非课程，独立长文档）

架构案例分析书不从"大纲→讲义→课程文档"链条派生，而是从一组场景题/素材直接产出一本成体系的书。遵循 `references/architecture-case-writing.md` 的六步流程：

1. **场景拆解**：确定本书有几个场景、每个场景的核心问题、场景间的递进关系
2. **案例调研**：每个场景收集 ≥3 个工业界真实案例（案例卡片格式，交叉验证）
3. **大纲设计**：确定章节结构，分配知识点和案例，遵循"挑战→策略→架构→治理→小结"五段式
4. **分章撰写**：按大纲逐章完成初稿（可并行），每章严格遵循结构模板
5. **合并统稿**：统一风格、术语、格式，检查案例重复、数字一致性、衔接流畅
6. **质量审查**：AI 腔扫描、结构完整性、数字量化、案例可靠性、兜底思维、小结质量

> 架构书与课程质量门禁的差异：架构书不检查演进路线（S0-S4）、思考题、代码引用等课程专项，但必须满足 `quality-guide.md` 的底线规范（去 AI 腔、无 ASCII 图、制图走 v2svg，详见 `references/diagram-integration.md`）与 `architecture-case-writing.md` 的高阶文体要求。

## 6. 文件与目录规范

所有过程产物存入 `.course/` 目录：
- 若有已选择的项目目录 → 项目根目录下的 `.course/{task_name}/phase-n/`
- 若无项目目录（仅临时工作区） → 当前工作目录下的 `.course/{task_name}/phase-n/`

课程目录只放正式交付物，不放过程文件。Phase 0 必须向用户确认产物命名规范与**产物裁剪卡**（见 §4）。

### 正式交付物命名

| 课型 | 文件命名 |
|:---|:---|
| **公开课** | `第N讲：标题（大纲）.md`、`第N讲：标题（讲义）.md`、`第N讲：标题.md`（课程文档，无前缀） |
| **实战课** | `标题-讲义.md`、`标题.md`（课程文档，无前缀）——**二产物，无大纲** |
| **录播课** | `课程名-大纲.md`、`课程名-讲义.md`、`课程名.md`（课程文档，无前缀）、`课程名-PPT文稿.md`、`课程名-录制脚本.md` |

仅**交付物**按上表命名并进课程目录；被降级为过程产物的内容存 `.course/{task_name}/phase-n/`，不受本表约束。

课程文档（面向学员的主文档）不带后缀，用纯标题命名，是该课程最"原生"的文档。大纲与讲义通过后缀标识为"辅助/内部"文档——**是否交付取决于消费者判定**（见 §4）。

## 7. 最终质量门禁

视角 A-H 综合评估 + 四专家审查，不合格必须改进：
- **流量运营视角**：标题吸引力、转化钩子、痛点场景（依据真实案例）—— 运营专员专项审查
- **最终学员视角**：课程文档可读性、难度匹配、可跑通、核心动作与避坑实践标注清晰
- **讲师视角**：讲义口语化质量、备课参考完备性、演示动作清晰度
- **代码质量视角**：教学代码无 P0/P1 级技术问题，配置一致，测试覆盖核心逻辑
- **教学代码生产级门禁专项**（实战课）：代码可真实编译/运行并写明可复现运行环境，评测指标有基线对照与回退红线，课程内量化数字全部实测后写入
  - 规范见 `references/multi-track-production.md` §2（**2.1-2.3、2.5**；应用架构课另加 2.4）；在 Phase 5 视角 H 执行
- **入门实战规格专项**（实战课·基础/实战）：讲义含成品预览（跑起来的效果 + 一条命令）；预置/现场写分界清晰（starter 预置脚手架 + 完整类型契约 + mock 数据，现场只写 3-4 个关键决策文件）；basic DoD 红线达标（一条命令跑通主动线、mock 可跑不依赖 LLM key、核心代码 ≤8 文件 ≤500 行、3-5 条 smoke case）；代码索引只列 basic 内文件
  - 规范见 `references/templates.md §3.2` 与 `references/multi-track-production.md` §5；在 Phase 5 视角 H 执行
- **应用架构课工业落地验收专项**（实战课·应用架构）：应用架构课代码以**工业项目落地标准**驱动，而非仅为完成课程演示。验收须"主要用户动线端到端跑通 + 无明显体验问题 + 评测指标达标"三者同过，禁止"演示可跑、指标不达标"的双轨验收；教学脚手架必须透明演化为生产级交付物并过评测，不得保留为可丢弃的 demo
  - 规范见 `references/multi-track-production.md` §2.4；在 Phase 5 视角 H 执行
- **演进路线专项**（系列实战课）：案例新鲜度 ≤1.5 年、起点档与主 Demo 一致、图正确（v2svg 渲染、引用路径正确、回执通过）、量化有来源
  - 规范见 `references/evolution-roadmap.md`
- **附录深入思考题专项**（实战课）：三质量维度达标、候选题经人工确认、篇幅 ≤15%
  - 规范见 `references/interview-questions.md`
- **代码引用与飞书兼容专项**（应用架构课）：零 file:// 链接、类名准确、每讲有代码索引表
  - 规范见 `references/code-reference-feishu.md`
- **品质门禁**：三产物角色边界清晰、无 AI 腔残留（讲义）、无讲师口语残留（课程文档）、无 ASCII 示意图（矢量图统一走 v2svg，见 `references/diagram-integration.md`）、规范使用干货标签
  - 规范见 `references/quality-guide.md`
- **架构叙述专项**（实战课·应用架构、架构案例分析书）：八大病灶逐段核对，其中病灶三（演进静态化）、四（术语无释）、五（开场没代入）、七（代码细节前置）、八（案例隔离）为必查项，不得抽样
  - 规范见 `references/architecture-narrative.md`；写作前质感对齐见 `examples/architecture-style-anchor.md`
