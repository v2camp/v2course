# Course Skill

这是一个高级课程产品制作 Skill。它旨在指导从 0 到 1 策划并制作高品质的各类课程与辅导材料（包括公开课、实战课、录播课、迷你课、晋升/面试辅导等），支持多版本管理与多视角评估。录播课:与三节课等平台合作的线上课,1–8 小时、8–20 分钟章节;course-skill 管到脚本层(选题/大纲/讲义/PPT文稿/录制脚本),视频录制/剪辑留给人。

## 📂 目录结构

```text
.
├── SKILL.md                  # Skill 的核心入口与主控逻辑
├── README.md                 # 本文件
├── phases/                   # 6 大核心执行阶段
│   ├── phase-0-explore.md    # 探索与挑战（确认时长、规范、定位、演进位置；应用架构课需先探索代码架构）
│   ├── phase-1-spine.md      # 决定主心骨（主线结构、演进路线决策、附录思考题决策）
│   ├── phase-2-cases.md      # 构建证据系统（双轨+演进线+候选题，agent-reach 调研规范）
│   ├── phase-3-produce.md    # 资产生产（初稿撰写，含演进路线段+附录思考题写作规范）
│   ├── phase-4-sync.md       # 一致性对齐（L1-L4 分层同步）
│   └── phase-5-review.md     # 审查与审计（六视角+三重专家，含应用架构课专项审查）
├── references/               # 规范与参考指南
│   ├── anti-patterns.md      # 反模式（绝对禁止的写法）
│   ├── architecture-case-writing.md # 架构案例分析书写作规范（李智慧风格基准）
│   ├── architecture-course.md # 实战课·应用架构专项方法论
│   ├── boundary.md           # 边界说明
│   ├── core-principles.md    # 核心原则（含应用架构课专项原则）
│   ├── domain-adaptation.md  # 领域适配指南（新领域使用）
│   ├── evolution-roadmap.md  # 架构演进路线方法论（S0-S4 模型+工业案例规范）
│   ├── interview-questions.md # 附录深入思考题方法论（三质量维度+候选题路径+写作规范）
│   ├── quality-guide.md      # 品质提升指南（去 AI 腔、制图规范（archsvg 驱动）、三域配色）
│   └── templates.md          # 常用模板
└── subagents/                # 辅助子 Agent 设定
    ├── code-reviewer.md     # 代码审查专家（技术栈自适应）
    ├── expression-coach.md   # 表达教练（语调/张力/排版/制图(archsvg)/演进路线/思考题表达）
    └── tech-evangelist.md   # 技术布道师（讲义技术准确性与代码一致性、关联阅读来源验证、应用架构课代码引用校验）
```

## 🚀 如何使用

在支持 Agent Skill 的 IDE（如 Trae）中，当用户意图涉及"写讲义"、"做大纲"、"课程策划"时，Agent 会自动触发此 Skill。

你也可以通过显式指令调用：
```text
Use Skill: course-skill 帮我为《XX实战课》写一份大纲
```

### Skill 依赖
- **agent-reach**：Phase 2 工业案例调研与深入思考题候选题检索必须通过 agent-reach skill 执行联网研究。
- **architecture-case-writing**：创作架构案例分析书等长文档时，遵循该 reference 的写作规范（风格基准为李智慧《大型网站技术架构》）。

### 架构案例分析书
从一组场景题/素材创作架构案例分析书时，触发 course-skill 并遵循 `references/architecture-case-writing.md` 的六步生产流程（场景拆解 → 案例调研 → 大纲设计 → 分章撰写 → 合并统稿 → 质量审查）。

## 🤝 贡献与维护

本 Skill 作为一个独立的 Git Submodule 维护。如需修改课程生产的底层逻辑、Prompt 或排版规范，请直接在此仓库中提交 PR。
