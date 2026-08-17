/**
 * 本地后端。
 *
 * 存在的唯一理由：让 DEEPSEEK_API_KEY 待在这个进程里，永远不进浏览器。
 * 前端只知道 POST /api/ai/complete，不知道背后是哪家模型。
 */

import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { complete, readConfig } from './deepseek.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 3001;

// 单个请求体上限，防止误传大文件把进程撑爆
const MAX_BODY_BYTES = 1024 * 1024;

/**
 * 极简 .env 解析：只处理 KEY=VALUE，够用且无需引入依赖。
 * 已存在的真实环境变量优先，不被文件覆盖。
 */
function loadEnvFile(filename) {
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, filename), 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('请求体过大'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function handleComplete(req, res, config) {
  const raw = await readBody(req);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    sendJson(res, 400, { error: '请求体不是合法 JSON' });
    return;
  }

  const { prompt, system } = payload ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    sendJson(res, 400, { error: 'prompt 必须是非空字符串' });
    return;
  }

  const startedAt = Date.now();
  const { content, usage } = await complete({ prompt, system, config });
  console.log(
    `[ai] 完成 ${Date.now() - startedAt}ms  tokens=${usage?.total_tokens ?? '?'}`
  );
  sendJson(res, 200, { content, usage });
}

function start() {
  loadEnvFile('.env.local');

  let config;
  try {
    config = readConfig();
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/api/health') {
      sendJson(res, 200, { ok: true, model: config.model });
      return;
    }

    if (url.pathname === '/api/ai/complete') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: '仅支持 POST' });
        return;
      }
      try {
        await handleComplete(req, res, config);
      } catch (err) {
        console.error('[ai] 失败:', err.message);
        if (!res.headersSent) {
          sendJson(res, err.status ?? 500, { error: err.message });
        }
      }
      return;
    }

    sendJson(res, 404, { error: '未找到该接口' });
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ 后端已启动  http://127.0.0.1:${PORT}`);
    console.log(`   模型: ${config.model}`);
    console.log(`   密钥: 已加载（仅存于本进程，不会下发到浏览器）`);
  });
}

start();
