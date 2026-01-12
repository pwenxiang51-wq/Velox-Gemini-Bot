# 🤖 Velo-Gemini-Bot (Cloudflare Workers Edition)

<p align="center">
  <img src="https://img.shields.io/badge/Gemini-3.0%20%7C%202.0-blue?style=for-the-badge&logo=googlegemini" alt="Gemini">
  <img src="https://img.shields.io/badge/Runtime-Cloudflare%20Workers-orange?style=for-the-badge&logo=cloudflare" alt="Cloudflare">
  <img src="https://img.shields.io/badge/Paint-SDXL%20Lightning-purple?style=for-the-badge&logo=stabilityai" alt="SDXL">
</p>

---

## ✨ 项目简介

这是一个运行在 **Cloudflare Workers** 上的全能型 Telegram 机器人。它不仅拥有 **Google Gemini 3.0** 的最强智商，还具备画画、识图和过目不忘的本领。

> **Created by [Velo.x](https://github.com/pwenxiang51-wq)**

### 🚀 核心特性
- **🧠 智商在线**：优先调用 **Gemini 3.0 Flash Preview**，故障自动降级 **2.0 Flash**，保证永不掉线。
- **🎨 灵魂画师**：支持 `/draw`, `/img`, `/pic` 指令，调用 Cloudflare AI 毫秒级生成图像。
- **💾 长期记忆**：通过 Cloudflare KV 数据库保存上下文，它是真正“认识”你的 AI。
- **🔒 私密独享**：内置 `ALLOWED_ID` 鉴权，防止你的 API 额度被陌生人白嫖。
- **💸 零成本**：完全依托 Cloudflare 和 Google 的免费层额度，实现 0 元部署。

---

## 🛠️ 快速开始

### 1. 准备工作
- 获取 Telegram Bot Token (@BotFather)
- 获取 Google Gemini API Key (Google AI Studio)
- 准备一个 Cloudflare 账号

### 2. 环境变量配置
在 Cloudflare Worker 的 **Settings -> Variables** 中添加：
- `TG_TOKEN`: 机器人 Token
- `GEMINI_KEY`: Google API Key
- `ALLOWED_ID`: 你的 Telegram 数字 ID

### 3. 资源绑定 (Bindings)
- **KV Namespace**: 绑定变量名为 `DB`
- **Workers AI**: 绑定变量名为 `AI`

### 4. 部署
将本仓库中的 `worker.js` 代码粘贴至 Worker 编辑器，点击 **Deploy**，最后访问 `/init` 激活。

---

## 👨‍💻 作者与支持

如果你觉得这个项目好用，欢迎给我一个 **Star ⭐**！

### 🍵 请我喝杯咖啡
如果你想支持我的持续开发，可以通过微信扫码请我喝杯咖啡，这将是我最大的动力！

| 微信赞赏 (WeChat Pay) |
| :---: |
| <img src="https://raw.githubusercontent.com/pwenxiang51-wq/Velo-Gemini-Bot/main/wechat_pay.jpg" width="300" /> |

---

## 📄 开源协议
本项目遵循 [MIT License](LICENSE) 协议。
