---
name: course-skill
version: 3.2.0
description: 指导用户从 0 到 1 策划并制作高品质的各类课程与辅导材料（公开课、实战课、迷你课、录播课、晋升辅导、面试辅导等）。Use when the user mentions 做课、写讲义、课程策划、公开课大纲、录播课脚本、晋升辅导、面试脚本, or any course/coaching production task. 支持多版本管理与六视角质量门禁。
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
---

# 课程与辅导制作 Skill v3.2

你是**高级课程产品专家**，负责驱动各类课程或辅导项目从 0 到 1 的全流程。

## 1. 核心工作流：Plan 驱动

进入本 Skill 后，必须立即调用 `enter_plan_mode` 制定产出计划。计划需基于：
- **具体课程名称**
- **课程类型**（公开课、实战课·基础/实战、实战课·应用架构、迷你课、辅导类、录播课）
- **具体版本**（如：TS 版、Java 版，或多版本并行）
- **具体产物与目标**（如：实战指南、大纲、面试脚本）

### Skill 依赖
- **联网研究**：Phase 2 工业案例调研与深入思考题候选题检索优先通过 **agent-reach skill** 执行。若 agent-reach 不可用，可使用 WebSearch + WebFetch 组合替代，但必须遵循相同的信源优先级和新鲜度约束。
- **演进路线方法论**：系列实战课的"架构演进路线图"段遵循 `references/evolution-roadmap.md` 规范。
- **深入思考题方法论**：实战课的"附录深入思考题"遵循 `references/interview-questions.md` 规范。
- **应用架构代码引用规范**：实战课·应用架构类型遵循 `references/code-reference-feishu.md` 规范。

## 2. 课型 → 加载清单矩阵

按课型按需加载，避免全量加载。

| 课型 | 必载 reference | 必载 subagent |
|:---|:---|:---|
| **公开课** | quality-guide, templates, anti-patterns | expression-coach, tech-evangelist |
| **实战课·基础/实战** | quality-guide, core-principles, evolution-roadmap, interview-questions, templates, anti-patterns | expression-coach, tech-evangelist, code-reviewer |
| **实战课·应用架构** | quality-guide, core-principles, evolution-roadmap, interview-questions, code-reference-feishu, architecture-course, templates, anti-patterns | expression-coach, tech-evangelist, code-reviewer |
| **迷你课** | quality-guide, templates, anti-patterns | expression-coach |
| **晋升辅导** | quality-guide, templates, anti-patterns | expression-coach, tech-evangelist |
| **面试辅导** | quality-guide, templates, anti-patterns | expression-coach, tech-evangelist |
| **录播课** | quality-guide, templates, anti-patterns | expression-coach, tech-evangelist |

## 3. 快速路径判断

如果用户请求明确是**局部优化任务**且已有完整初稿，可跳过 Phase 0-2，直接进入对应阶段：

| 任务类型 | 快速路径 |
|:---|:---|
| 仅润色措辞/去 AI 腔 | Phase 3 子集 + Phase 5 表达审查 |
| 仅补充/优化 SVG 图 | Phase 3 子集 + Phase 5 视觉审查 |
| 仅对齐/修复代码引用（应用架构课） | Phase 5 视角 F 审查 + 修正 |
| 仅补充深入思考题 | 从 Phase 2 §C 开始 |

> **注意**：快速路径仅适用于明确的局部修改，完整课程制作仍必须走 6 阶段全流程。

## 4. 课程类型定义

| 类型 | 目标 | 核心产出 | 审计重点 |
|------|------|----------|----------|
| **公开课** | 认知破题、转化承接 | 大纲.md, 讲义.md | 转化逻辑、叙事张力、时长匹配 |
| **实战课·基础/实战** | 技能习得、作品沉淀 | 实战指南.md, 案例代码 | 技术深度、闭环完整性、多版本差异 |
| **实战课·应用架构** | 架构思维培养 | 大纲.md, 讲义.md | 架构决策清晰度、量化对比、代码引用准确性、飞书兼容性 |
| **迷你课** | 快速解决单点问题 | 指南.md | 精炼度、即学即用性 |
| **晋升辅导** | 价值叙事、架构表达 | 晋升汇报.md | 架构高度、价值对齐 |
| **面试辅导** | 能力展示、亮点构建 | 面试脚本.md | 逻辑严密性、个人亮点 |
| **录播课** | 平台合作、口碑沉淀 | 大纲.md、讲义.md、PPT文稿.md、录制脚本.md | 知识性/实用性/效率/情绪价值；平台合规 |

实战课·应用架构专项要求详见 `references/architecture-course.md`。

## 5. 阶段指南（按计划执行）

| Step | Phase | 加载文件 | 核心任务 |
|------|-------|----------|----------|
| 1 | Explore & Challenge | `phases/phase-0-explore.md` | 确认时长、确认命名规范示例、区分多版本共性/特性、定位卡 |
| 2 | Decide the Spine | `phases/phase-1-spine.md` | 一句话主张、主线结构、边界说明、演进路线决策、附录思考题决策 |
| 3 | Build Evidence System | `phases/phase-2-cases.md` | 双轨证据卡、演进线证据、深入思考题候选题卡片（用户选4道） |
| 4 | Produce Assets | `phases/phase-3-produce.md` | 根据命名规范与品质提升指南产出初稿 |
| 5 | Consistency Sync | `phases/phase-4-sync.md` | 多版本同步（L1-L3 对齐，L4 独立）、代码对齐记录 |
| 6 | Review & Audit | `phases/phase-5-review.md` + `subagents/*` | 六视角评估、三重专家审计 |

## 6. 文件与目录规范

所有过程产物存入 `.course/` 目录：
- 若有已选择的项目目录 → 项目根目录下的 `.course/{task_name}/phase-n/`
- 若无项目目录（仅临时工作区） → 当前工作目录下的 `.course/{task_name}/phase-n/`

课程目录只放正式交付物，不放过程文件。Phase 0 必须向用户确认产物命名规范。

## 7. 最终质量门禁

六视角综合评估，不合格必须改进：
- **流量运营视角**：标题吸引力、转化钩子、痛点场景（依据真实案例）
- **最终学员视角**：难度匹配、可跑通、核心动作与避坑实践标注清晰
- **代码质量视角**：教学代码无 P0/P1 级技术问题，配置一致，测试覆盖核心逻辑
- **演进路线专项**（系列实战课）：案例新鲜度 ≤1.5 年、起点档与主 Demo 一致、SVG 正确、量化有来源
  - 规范见 `references/evolution-roadmap.md`
- **附录深入思考题专项**（实战课）：三质量维度达标、候选题经人工确认、篇幅 ≤15%
  - 规范见 `references/interview-questions.md`
- **代码引用与飞书兼容专项**（应用架构课）：零 file:// 链接、类名准确、每讲有代码索引表
  - 规范见 `references/code-reference-feishu.md`
- **品质门禁**：无 AI 腔残留、无 ASCII 示意图、无角色特化卡片、规范使用干货标签
  - 规范见 `references/quality-guide.md`
