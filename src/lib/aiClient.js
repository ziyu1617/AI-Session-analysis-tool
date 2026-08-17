/**
 * 大模型调用（前端侧）。
 *
 * 前端只知道「给一段提示词，拿回一段文本」。模型厂商、密钥、鉴权、
 * 请求格式全部由后端 /api/ai/complete 承担，浏览器里不存在任何密钥。
 */

const ENDPOINT = '/api/ai/complete';

/**
 * 发起一次分析，返回模型输出的纯文本。
 *
 * @param {string} prompt 用户提示词
 * @param {object} [options]
 * @param {string} [options.system] 系统提示词
 * @param {AbortSignal} [options.signal] 中断信号
 * @returns {Promise<string>}
 */
export async function chatComplete(prompt, options = {}) {
  const { system, signal } = options;

  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({ prompt, system }),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    // 后端没起来是本地开发最常见的失败，直接给出可执行的提示
    throw new Error('无法连接后端服务，请确认已运行 npm run dev');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`分析服务返回异常（HTTP ${response.status}）`);
  }

  if (!response.ok) {
    throw new Error(payload?.error || `分析服务返回异常（HTTP ${response.status}）`);
  }

  if (!payload?.content) {
    throw new Error('分析服务未返回有效内容');
  }

  return payload.content;
}
