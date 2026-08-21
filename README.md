# 超级表达训练营

![超级表达训练营界面预览](docs/ui-preview.png)

超级表达训练营是一个面向中文口语练习的本地桌面工具。它把实时语音识别、表达习惯分析、AI 对话和限时挑战放在同一个练习工作台里，帮助你更清楚、更直接、更有条理地表达自己。

> 仓库中的语音模型不放入 Git 历史（其中一个文件超过 GitHub 单文件限制），请从本项目的 [Releases](https://github.com/m44359973-bot/super-expression-training-camp/releases) 下载模型包。

## 核心功能

- **实时语音识别**：基于 Sherpa-ONNX，本地完成中文和英文识别。
- **实时表达分析**：识别填充词、犹豫词、笼统词，并给出更精准的替代表达。
- **AI 对话练习**：配置自己的 OpenAI 兼容 API 后，可与 AI 进行表达训练对话。
- **60 秒挑战**：随机生成通用题目，限时发表看法，完成后获得评分、记录和调整建议。
- **完整分析报告**：从逻辑、直接性、词语使用、表达密度和亮点等维度复盘练习。
- **个性化界面**：支持字幕字号和字体选择，适合长时间练习。
- **本地记录**：挑战记录保存在本机，不上传到服务器。

## 安装

### 1. 获取代码并安装依赖

```bash
git clone https://github.com/m44359973-bot/super-expression-training-camp.git
cd super-expression-training-camp
npm install
```

### 2. 下载并放置语音识别模型

从 [Releases](https://github.com/m44359973-bot/super-expression-training-camp/releases) 下载 `sherpa-onnx-streaming-paraformer-bilingual-zh-en.zip`，解压后确保目录结构如下：

```bash
models/sherpa-onnx-streaming-paraformer-bilingual-zh-en/encoder.int8.onnx
models/sherpa-onnx-streaming-paraformer-bilingual-zh-en/decoder.int8.onnx
models/sherpa-onnx-streaming-paraformer-bilingual-zh-en/tokens.txt
```

### 3. 启动（Windows）

```bash
start.bat
```

也可以运行 `npm start`。

### 4. 配置 AI

打开应用右上角设置，填写你自己的 API Key、Base URL 和模型名称。支持 DeepSeek、OpenAI、Ollama 等 OpenAI 兼容接口。语音识别和词库分析无需联网，AI 反馈需要网络和有效 API Key。

| 后端 | 费用 | 速度 | 获取方式 |
|------|------|------|----------|
| DeepSeek | 极低 | 快 | [platform.deepseek.com](https://platform.deepseek.com) |
| OpenAI | 中等 | 快 | [platform.openai.com](https://platform.openai.com) |
| Ollama | 免费 | 取决于硬件 | [ollama.com](https://ollama.com) 本地运行 |

## 使用流程

1. 选择“独自表达”“AI 对话”或“挑战模式”。
2. 点击“开始录制”，对着麦克风说话。
3. 观察中央字幕、左侧词语统计和右侧实时反馈。
4. 点击“结束”后生成分析报告；挑战模式会额外保存本地成绩。

没有麦克风时，也可以使用“粘贴逐字稿”完成分析。

## 字幕颜色含义

| 颜色 | 含义 |
|------|------|
| 🔴 红色波浪下划线 | 填充词（嗯、啊、那个、然后…） |
| 🟠 橙色 | 犹豫词（可能、也许、我觉得…） |
| 🟡 黄色虚线 | 笼统词（有精准替代建议） |
| 🟢 绿色 | 有力表达（好句子！） |

## 技术架构

```
┌─────────────────────────────────────────┐
│ Electron 主进程                          │
│  ├── Sherpa-ONNX (离线语音识别)          │
│  ├── 词库匹配 (emotion-lexicon.json)     │
│  └── AI反馈 (多后端 HTTP API)            │
├─────────────────────────────────────────┤
│ 渲染进程 (Chromium)                      │
│  ├── 全屏字幕显示                        │
│  ├── 实时统计面板                        │
│  └── 分析报告弹窗                        │
└─────────────────────────────────────────┘
```

## 项目归属

本项目由 GitHub 用户 [m44359973-bot](https://github.com/m44359973-bot) 维护。项目中的 Sherpa-ONNX、Electron 及其他依赖仍遵循各自的开源许可证。

## 词库说明

`data/emotion-lexicon.json` 基于大连理工情感词库7大类结构，包含：

- **130+ 情绪词**：分类（喜怒哀惧恶惊）+ 强度（1-9）
- **笼统词→精准词映射**：25组高频替代建议
- **填充词表**：24个常见口头禅
- **犹豫词表**：19个弱化表达
- **程度词梯度**：弱→中→强→极 四级
- **画面化描述**：10组「抽象→具象」转换
- **犹豫→直接转换**：8组对照示例

## 开发

```bash
# 开发模式（带DevTools）
npm run dev

# 目录结构
├── main.js              # Electron主进程
├── preload.js           # preload脚本
├── src/
│   ├── index.html       # 主界面
│   ├── settings.html    # 设置页
│   ├── styles.css       # 样式
│   ├── app.js           # 前端逻辑
│   └── settings.js      # 设置逻辑
├── lib/
│   ├── asr.js           # 语音识别
│   ├── lexicon.js       # 词库匹配
│   ├── ai-feedback.js   # AI反馈
│   └── prompts.js       # Prompt模板
├── data/
│   └── emotion-lexicon.json
└── models/              # Sherpa-ONNX模型（需下载）
```

## 系统要求

- macOS 12+ / Windows 10+ / Linux
- Node.js 18+
- 麦克风权限
- （可选）网络连接（用于AI反馈，词库分析可离线）

## 许可证

本项目采用“超级表达训练营项目专用许可证（个人使用与非商业授权）”。允许个人学习、研究、非营利训练和修改；分发时必须保留项目名称、许可证和原项目地址。商业售卖、付费部署、付费课程配套或冒充官方版本，需要先取得版权所有者书面许可。完整条款见 [LICENSE](LICENSE)。

