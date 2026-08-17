# AI Session Analysis Tool

一个基于大模型的用户会话行为分析工具。上传埋点数据（CSV / Excel），自动按会话切分用户行为路径，并调用大模型生成会话概况、深度洞察与下单商品识别。

## 功能

- **数据上传** —— 支持 CSV、Excel（.xlsx / .xls），按 `session_id` 自动切分会话
- **会话分析** —— 页面访问、行为类型、曝光时长等维度统计
- **AI 分析** —— 三种独立的分析视角，各自使用不同的提示词：
  - 会话概况：还原用户决策旅程与页面停留时长
  - 深度洞察：产品视角的 markdown 分析报告
  - 商品识别：依据行为字段判定下单状态与对应商品

## 环境要求

- Node.js ≥ 18（项目使用 Vite 5，不支持 Node 16 及以下）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置大模型密钥

在项目根目录创建 `.env.local`：

```
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

该文件已在 `.gitignore` 中，不会被提交。密钥只在本地后端进程中使用，**不会进入前端构建产物**。

### 3. 启动

```bash
npm run dev
```

会同时启动：

- 后端 `http://127.0.0.1:3001` —— 持有密钥，代理大模型请求
- 前端 `http://localhost:8080`

### 其他命令

```bash
npm test     # 运行单元测试
npm run build # 构建前端产物
```

## 数据格式

| 字段 | 说明 |
| --- | --- |
| `session_id` | **必需**，会话标识 |
| `fmt_time2` | **必需**，事件时间 |
| `page_name` | 页面名称 |
| `event_name` | 事件名称 |
| `action_type_name` | 行为类型，用于判定曝光 / 点击 / 加购 / 下单 |
| `sequence` | 事件序号，用于去重 |

## 项目结构

```
server/          本地后端，持有密钥并转发大模型请求
src/analysis/    会话分析模块（提示词、序列化、后处理）
src/components/  React 组件
src/utils/       通用计算逻辑
```

## 架构说明

密钥只存在于后端进程。前端通过 `/api/ai/complete` 调用，不感知模型厂商，浏览器中不存在任何密钥。若要更换模型提供方，只需修改 `server/deepseek.js`。

## License

MIT
