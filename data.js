/* 项目数据：文案来自简历，运行链路节点来自 可以观测整体的运行链路，可调试/catalog.json */
const PROJECTS = [
  {
    id: "p1",
    num: "01",
    name: "基于 Harness 的跨境高客单自进化导购 Agent",
    short: "导购 Agent",
    period: "2023.10 — 2026.10",
    role: "核心开发 / 导购 Agent 与策略闭环 Owner",
    accent: "#f3b33d",
    desc: "面向红光面罩、光疗腰带、光疗垫等海外高客单 PBM 产品，历经三阶段演进：RAG 被动问答 → 意图识别 + 状态机促单 → 把价格、库存、禁忌下沉为原子 Tool，构建 Harness Agent Loop 的自主决策与话术自进化。",
    metrics: [
      { v: "28.6%", l: "咨询意向成单转化率提升" },
      { v: "40%", l: "高客单成交决策周期缩短" },
      { v: "40+ → 5", l: "状态机节点收敛为确定性 Tool" }
    ],
    bullets: [
      "统一 Agent Loop 与销售工具标准化：LLMProvider + Tool 双抽象与注册表解耦业务逻辑；新增模型只补一个 chat() 适配器，新增导购能力只登记一个 Tool。",
      "把 40+ 状态机分支收敛为选品、价格、库存、禁忌、优惠 5 个确定性 Tool；单步多工具并行，异常转 Observation 交回模型自纠，内置最大步数、超时、低置信转人工三层兜底。",
      "业务主管用「问题 + 标准话术 + SOP」做一次对话式教学，LLM 归纳话术原则注入提示词；服务时向量 Top-K 召回相似案例，Prompt 按红线 → 话术 → 案例分层治理。"
    ],
    evidence: "本地可跑：Agent Loop / 5 个确定性 Tool / 混合检索 / 预算降载；生产数字为业务口径。",
    stack: ["FastAPI", "Agent Loop", "Hybrid RAG", "pgvector", "Cross-Encoder", "Prompt 版本化"],
    nodes: [
      { code: "01", layer: "ENTRY", title: "对话入口", endpoint: "POST /api/chat", desc: "浏览器把用户问题、session_id 和可选 trace_id 交给 FastAPI。入口不直接选模型，而是把请求交给 ChatService。", source: "p1-agent/app/main.py" },
      { code: "02", layer: "CONTEXT", title: "上下文装配", endpoint: "history + memory + budget", desc: "读取会话历史与用户事实，按预算裁剪上下文。关键事实先保留，长对话再做降载，避免把完整历史硬塞给模型。", source: "p1-agent/app/context/budget.py" },
      { code: "03", layer: "RETRIEVAL", title: "知识检索", endpoint: "Dense + BM25 → rerank", desc: "语义切片与 metadata 过滤先缩小候选，再做混合召回和 Cross-Encoder 重排。知识命中是后续回答的产品依据。", source: "p1-agent/app/knowledge/hybrid_search.py" },
      { code: "04", layer: "ORCHESTRATION", title: "Agent Loop", endpoint: "intent → plan → act → observe", desc: "Agent 先识别意图，再决定是否调用工具。循环受最大步数、超时和低置信兜底约束，不会无休止自言自语。", source: "p1-agent/app/agent/loop.py" },
      { code: "05", layer: "TOOLS", title: "确定性工具", endpoint: "5 deterministic tools", desc: "选品、算价、库存、禁忌筛查、优惠规则交给确定性代码。价格和库存不从模型「记忆中」编造。", source: "p1-agent/app/main.py" },
      { code: "06", layer: "GUARD / HANDOFF", title: "作答与兜底", endpoint: "answer → guard → ticket", desc: "模型综合知识与工具结果作答；低置信、禁忌或多次失败时转人工并生成工单，失败样本还能回流教学库。", source: "p1-agent/app/agent/loop.py" }
    ]
  },
  {
    id: "p2",
    num: "02",
    name: "实时语音与多模态售后排障 Agent（RTC）",
    short: "RTC 语音",
    period: "2024.08 — 2025.03",
    role: "核心开发 / 实时语音与检索链路 Owner",
    accent: "#65c9d7",
    desc: "家用高客单 PBM 产品售后排障场景复杂、海外大件退货物流昂贵。项目融合火山引擎 RTC、豆包大模型、CustomLLM 回调桥接与 pgvector 单表多模态检索，打造低延迟实时语音售后排障链路。",
    metrics: [
      { v: "< 800ms", l: "免检索链路端到端延迟" },
      { v: "54% → 88%", l: "长尾故障精准召回率" },
      { v: "34%", l: "非质量类大件售后退货率降低" }
    ],
    bullets: [
      "集成火山引擎 RTC 与 CustomLLM 回调服务，串联流式 ASR → LLM → TTS 低延迟语音管线；传输层复用 RTC SDK 的弱网抗丢包与自适应抖动缓冲。",
      "RTC 云端 VAD 捕捉用户开口瞬间，前端立即清空本地音频播放缓冲并停播，同时经 DataChannel 下发截断信令，中止后端 LLM / TTS 输出流。",
      "PostgreSQL + pgvector 构建 1024 维 HNSW 单表 rag_assets；Int8 量化把向量存储开销降低 75%，Int8 粗召 Top-20 + Float32 Cross-Encoder 精排 Top-5。"
    ],
    evidence: "本地可跑：CustomLLM 回调 / pgvector 检索 / Barge-in；云端 RTC 房间需独立 AppId，延迟为样本口径而非 p95。",
    stack: ["Volc RTC", "CustomLLM", "Streaming ASR", "TTS", "pgvector", "Barge-in"],
    nodes: [
      { code: "01", layer: "DEVICE", title: "麦克风采集", endpoint: "browser microphone", desc: "浏览器采集音频流，按 RTC SDK 要求编码后加入房间。用户感知到的第一段延迟从这里开始计时。", source: "p2-rtc/src/App.tsx" },
      { code: "02", layer: "SIGNALING", title: "登录与签发", endpoint: "POST /getScenes", desc: "服务端根据用户 / 房间签发真实 AppId、RoomId 与 Token。前端不持有长期密钥，只在会话内使用短期凭证。", source: "p2-rtc/server_python/main.py" },
      { code: "03", layer: "ASR", title: "语音转文本", endpoint: "cloud ASR", desc: "云端流式识别把语音转成文本；识别置信度与静音切分会影响后续 RAG 与回答速度。", source: "p2-rtc/rag_llm_server/services/voice_chat_service.py" },
      { code: "04", layer: "RAG", title: "实时知识检索", endpoint: "pgvector HNSW + filters", desc: "在单表里同时完成属性过滤与向量相似度召回，再按需要在两阶段策略里补长尾候选。", source: "p2-rtc/rag_llm_server/services/rag_service.py" },
      { code: "05", layer: "LLM STREAM", title: "首 token 回传", endpoint: "CustomLLM callback / SSE", desc: "模型以流式 SSE 返回增量文本，服务端边收边下发，让 TTS 尽早启动。首 token 不等于整段回答完成。", source: "p2-rtc/rag_llm_server/services/llm_service.py" },
      { code: "06", layer: "TTS", title: "语音合成与播放", label: "合成与播放", endpoint: "cloud TTS → RTC downlink", desc: "TTS 增量合成并下发音频。文本流和音频流不是同一节奏，需要缓冲与取消策略配合。", source: "p2-rtc/rag_llm_server/services/voice_chat_service.py" },
      { code: "07", layer: "BARGE-IN", title: "用户打断", endpoint: "cancel stream + flush", desc: "检测用户插话后取消 LLM / TTS 输出，清空待播音频。打断是否真正生效，要看旧流是否停止而不是只看按钮。", source: "p2-rtc/rag_llm_server/services/barge_in.py" }
    ]
  },
  {
    id: "p3",
    num: "03",
    name: "AIGC 社媒内容生产与运营 Agent",
    short: "内容工作流",
    period: "2024.01 — 2025.06",
    role: "核心开发 / 内容工作流 Owner",
    accent: "#f1cf68",
    desc: "面向海外私域与社媒运营，把选题策划、脚本撰写、多语种本地化、配图生成与多平台分发拆成可恢复的 LangGraph 内容工作流；通过 SSE、异步任务与模型分级调用提升产能与稳定性。",
    metrics: [
      { v: "7.5×", l: "月度营销内容矩阵生成产能" },
      { v: "70%", l: "批量配图生成耗时缩减" },
      { v: "40%", l: "多模型分级调用成本降低" }
    ],
    bullets: [
      "基于 LangGraph 构建选题、写作、配图与本地化多阶段工作流，以 StateGraph / SubGraph 拆独立编排单元；AsyncPostgresSaver 持久化状态，支持节点级回滚、重试与人工审核断点。",
      "astream_events 对接前端 ReadableStream 捕获 Token 级流式输出；批量配图用豆包 Seedream + nano banana 多模型异步调用，asyncio.gather + run_in_executor 并行，指数退避应对模型抖动。",
      "MetricsContext 采集各节点 Token、延迟与错误率并做成本归因，按任务复杂度分级调用轻量 / 旗舰模型；LangSmith + structlog + request_id 完成 Graph 级链路追踪。"
    ],
    evidence: "本地可跑：LangGraph 两处 interrupt / SSE 续传 / Mock 开关；生图结果区分 mock 成功与真实模型出图。",
    stack: ["LangGraph", "AsyncPostgresSaver", "SSE", "HITL", "Seedream", "LangSmith"],
    nodes: [
      { code: "01", layer: "ENTRY", title: "运营发起任务", endpoint: "POST workflow/run", desc: "前端提交主题、渠道、语言等参数，FastAPI 创建运行实例并把 thread_id 留给后续恢复。", source: "p3-content/app/main.py" },
      { code: "02", layer: "LANGGRAPH", title: "选题与大纲", endpoint: "topic_selection node", desc: "图从 START 进入选题节点，结合产品与渠道生成候选方向，再把状态传给写作节点。", source: "p3-content/app/graph/workflow.py" },
      { code: "03", layer: "GENERATION", title: "写作草稿", endpoint: "write_draft node", desc: "模型基于选题、渠道和语言生成草稿。草稿先进入人工审核，不直接发布。", source: "p3-content/app/graph/workflow.py" },
      { code: "04", layer: "HITL", title: "人工审稿", endpoint: "interrupt(human_review)", desc: "图在人工审核节点中断，checkpointer 持久化状态；审核通过后从原位置继续，不重跑前面。", source: "p3-content/app/graph/workflow.py" },
      { code: "05", layer: "VISUAL", title: "视觉拆解与配图", label: "配图生成", endpoint: "extract_visuals → generate_images", desc: "从正文中提取需要视觉表达的段落并生成配图；失败时由节点错误处理器决定重试或降级。", source: "p3-content/app/graph/workflow.py" },
      { code: "06", layer: "OUTPUT", title: "本地化与归档", endpoint: "localize_article → END", desc: "根据目标语言完成本地化，组装最终文章与图片清单，写入产物目录供前端展示。", source: "p3-content/app/graph/workflow.py" }
    ]
  },
  {
    id: "p4",
    num: "04",
    name: "全链路 AI 语料数据中台",
    short: "数据中台",
    period: "2023.08 — 2024.10",
    role: "数据治理链路 Owner",
    accent: "#7ee787",
    desc: "面向跨境独立站、私域社媒与售后工单，构建从原始数据接入、会话结构化、质量清洗与脱敏、人工审核到 RAG / 微调 / 评测多下游供数的数据中台；用统一数据源解决多源口径不一致与复用效率低。",
    metrics: [
      { v: "99.1%", l: "高危敏感 PII 隐私脱敏召回率" },
      { v: "5×", l: "数据预标注效率提升" },
      { v: "35万+", l: "清洗脱敏真实业务对话语料" }
    ],
    bullets: [
      "统一接入海外独立站、私域聊天与售后工单，保留不可变 raw_chats 原始层；ETL、5 分钟时间窗切分、同角色连续发言合并与去重生成标准化会话单元。",
      "9 级优先级内容过滤 + 正则表达式 / 轻量 NER 双层脱敏，覆盖手机号、地址、支付账号与订单号；价格与内部折扣作为硬红线字段，贯穿清洗、写入与导出链路。",
      "自动生成意图分类、质量评分、敏感标记与候选问答进入 staging；只有人工 approve 的数据进入下游，一键导出 ShareGPT / Alpaca / OpenAI JSONL / RAG CSV，失败样本回流评测集。"
    ],
    evidence: "本地可跑：raw → staging → approved / 9 级过滤 / 双层 PII / 多格式导出；35 万+ 为累计业务口径。",
    stack: ["FastAPI", "PostgreSQL", "ETL", "9 级过滤", "Regex + NER", "Dataset Export"],
    nodes: [
      { code: "01", layer: "INGEST", title: "多源接入", endpoint: "Shopify / social / ticket adapters", desc: "不同来源的数据先被适配成统一记录，再写入 raw / staging。来源和批次必须保留，否则后续无法追责。", source: "p4-data/backend/app/services/ingest/multi_source.py" },
      { code: "02", layer: "NORMALIZE", title: "清洗与会话切分", label: "清洗与切分", endpoint: "ETL → staging", desc: "时间、角色、内容和会话边界被标准化，形成可定位的 staging 会话。", source: "p4-data/backend/app/services/etl.py" },
      { code: "03", layer: "FILTER", title: "9 级优先级过滤", label: "9 级过滤", endpoint: "filter / classify", desc: "按 9 个优先级识别内部折扣、价格口径、无效闲聊与噪声；硬红线命中直接 drop。", source: "p4-data/backend/app/routers/governance.py" },
      { code: "04", layer: "PII", title: "双层脱敏", endpoint: "regex + NER", desc: "手机号、支付账号、订单号等由规则覆盖，人名地址等长尾交给 NER。输出保留命中类型供审计。", source: "p4-data/backend/app/services/pii/engine.py" },
      { code: "05", layer: "APPROVAL", title: "人工审批门禁", endpoint: "approved only", desc: "只有 approved 会话才能进入知识构建与训练导出。绕过门禁必须显式操作并留审计。", source: "p4-data/backend/app/services/knowledge.py" },
      { code: "06", layer: "DATASET", title: "评测集与多格式导出", label: "评测集与导出", endpoint: "eval / extract → export", desc: "从 approved 会话抽取评测用例，失败回复进入 bad_cases；支持 ShareGPT / Alpaca / DPO 等格式。", source: "p4-data/backend/app/services/eval_feedback.py" },
      { code: "07", layer: "FEEDBACK", title: "Badcase 回流", endpoint: "bad_cases → reflow", desc: "评测失败样本保留 question / reply / fail_type，经复核后回流为回归用例或知识修复任务。", source: "p4-data/backend/app/routers/governance.py" }
    ]
  },
  {
    id: "p5",
    num: "05",
    name: "销售风格 SFT / DPO 微调与评测",
    short: "SFT / DPO",
    period: "2024.10 — 2025.03",
    role: "数据与评测链路负责人",
    accent: "#c9a7ff",
    desc: "在数据中台完成语料治理后，基于高质量销售对话做风格微调与偏好对齐，让 AI 客服从通用表达转为业务销售话术；价格、库存与政策保留在 RAG / Tool 链路。",
    metrics: [
      { v: "58 → 91", l: "销冠话术风格盲测对齐" },
      { v: "QLoRA → LoRA", l: "本地验证到云端训练策略" },
      { v: "SFT + DPO", l: "风格模仿与偏好对齐" }
    ],
    bullets: [
      "坚持「微调管风格、RAG 管知识、Tool 管实时」三级解耦：微调专注共情表达、答疑节奏与促单话术；产品规格与政策由 RAG 注入；价格、库存、优惠资格由确定性 Tool 按 SKU 实时取数。",
      "本地 LLaMA-Factory + Qwen2.5 运行 LoRA / QLoRA 验证语料质量与训练方向，方案通过后转云端 LoRA；SFT 学话术风格，DPO 用销售主管标注的 chosen / rejected 偏好对优化回答质量。",
      "从 Product Knowledge、Objection Handling、Closing、Policy Enforcement、Empathy 五维构建评估集，用位置交换盲评与裁判校准控制模型上线质量。"
    ],
    evidence: "本地实测：0.5B LoRA 的 SFT + DPO 已跑通（98 条 SFT / 74 对 DPO）；3B QLoRA 与云端 LoRA 为配置就绪、未执行。",
    stack: ["LLaMA-Factory", "Qwen2.5", "LoRA", "DPO", "TRL", "五维盲评"],
    nodes: [
      { code: "01", layer: "SOURCE", title: "真实对话抽取", endpoint: "PostgreSQL read-only", desc: "从 raw_chats 只读抽取客户问题与销售回复，保留真实业务语言，不手工编造。", source: "gaps/sft-dpo/scripts/prepare_data.py" },
      { code: "02", layer: "SPLIT", title: "去重与防泄漏", endpoint: "unique prompt split", desc: "先划分 20 条唯一 prompt 作为留出评测，训练集删除同 prompt。交集为 0 才能报告评测。", source: "gaps/sft-dpo/scripts/prepare_data.py" },
      { code: "03", layer: "SFT", title: "监督微调", endpoint: "LoRA r16 / 50 steps", desc: "在 Qwen2.5-0.5B 上训练 8.8M 可训练参数，学习销售领域的产品表达与话术结构。", source: "gaps/sft-dpo/scripts/train_sft.py" },
      { code: "04", layer: "DPO", title: "偏好优化", endpoint: "preference pairs / 19 steps", desc: "在 SFT adapter 上继续优化偏好；负例集中在虚假承诺、贬低竞品和强推逼单。", source: "gaps/sft-dpo/scripts/train_dpo.py" },
      { code: "05", layer: "EVAL", title: "三版本盲评", endpoint: "Base / SFT / SFT+DPO", desc: "对 20 条留出 prompt 生成三版回答，交换 A/B 位置做五维盲评，降低单一裁判位置偏置。", source: "gaps/sft-dpo/scripts/evaluate.py" },
      { code: "06", layer: "ARTIFACT", title: "适配器与部署边界", label: "产物与边界", endpoint: "adapter + config", desc: "输出可加载的 SFT / DPO adapter、loss 曲线和评测明细。3B QLoRA 配置就绪但没有真实 CUDA 运行。", source: "gaps/sft-dpo/REPORT.md" }
    ]
  },
  {
    id: "p6",
    num: "06",
    name: "企业级 MCP 共享服务与统一模型网关",
    short: "MCP / 网关",
    period: "2025.04 — 2025.10",
    role: "模块 Owner / 平台共建者",
    accent: "#ff8a7a",
    desc: "导购、售后、营销与数据治理等业务线重复实现库存、算价、RAG、Memory 与 Prompt 能力，且各自持有模型 Key、直连不同供应商。项目把通用能力下沉为 MCP 共享服务，并在其上收敛统一模型网关、鉴权、Trace 与 Token 配额。",
    metrics: [
      { v: "4 类", l: "LLM / RAG / Memory / Prompt 共享服务" },
      { v: "1 个入口", l: "多供应商模型调用统一收敛" },
      { v: "按项目", l: "鉴权 · Trace · Token 配额" }
    ],
    bullets: [
      "将 LLM 网关、RAG 检索、会话记忆、Prompt 管理抽离为 4 个独立 MCP Service，经 Streamable HTTP 暴露标准化 Tool / Prompt 原语；新业务只实现 Agent 编排层。",
      "基于 FastAPI 收敛模型调用入口：API Key → project_id 映射鉴权、Trace ID 链路追踪、按项目 Token 日配额与 429 前置拦截；逻辑模型名屏蔽底层供应商差异。",
      "跨 Agent 买家画像：导购识别出的肤质、敏感史、起搏器等禁忌写入 user_facts（user_id + fact_key 唯一），售后 Agent 按 user_id 直接读取，跨业务画像互通。"
    ],
    evidence: "本地可跑：4 类 MCP + 网关 + 白名单 + Trace + 配额 + Console；部署为 Docker Compose，Serverless 是目标态、未做真机部署。",
    stack: ["FastAPI", "MCP Streamable HTTP", "API Key → project", "Trace", "Quota 429", "Docker Compose"],
    nodes: [
      { code: "01", layer: "CLIENT", title: "业务接入", endpoint: "P1 / P2 → HTTP", desc: "自进化导购和 RTC 是业务接入方。它们只依赖 HTTP 网关，不保存每个 MCP 服务的地址和协议细节。", source: "p6-mcp/gateway/config.yaml" },
      { code: "02", layer: "AUTH", title: "项目级认证", endpoint: "X-API-Key → project_id", desc: "中间件把 API Key 映射为 project_id 与 role。后续配额、日志、路由都使用这个身份，不让业务自己声明身份。", source: "p6-mcp/gateway/auth.py" },
      { code: "03", layer: "TRACE", title: "Trace 贯穿", endpoint: "X-Trace-ID", desc: "入口、认证、路由、MCP 转发和返回都写同一 trace_id，Console 可以按 ID 拼出瀑布图。", source: "p6-mcp/gateway/logger.py" },
      { code: "04", layer: "QUOTA", title: "配额与成本", endpoint: "pre-check → metering", desc: "请求前检查项目和日配额，超限直接 429；模型返回 usage 后回填 token 与可配置成本。", source: "p6-mcp/gateway/quota.py" },
      { code: "05", layer: "ROUTER", title: "服务与模型路由", label: "服务路由", endpoint: "logical service → MCP endpoint", desc: "网关按 service 找到 MCP Server，模型网关再按逻辑模型名解析上游；连接管理带健康检查。", source: "p6-mcp/gateway/router.py" },
      { code: "06", layer: "MCP", title: "MCP Client 转发", label: "MCP 转发", endpoint: "initialize → list_tools → call_tool", desc: "客户端与 MCP Server 建立 Streamable HTTP 会话，发现 Tool schema，再发送 call_tool 请求。", source: "p6-mcp/gateway/mcp_client_manager.py" },
      { code: "07", layer: "CAPABILITY", title: "五组共享能力", endpoint: "9001–9005", desc: "LLM 网关、RAG、Memory、Prompt Hub 与业务工具各自独立进程；业务通过统一入口复用。", source: "p6-mcp/gateway/config.yaml" }
    ]
  }
];
