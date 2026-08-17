/**
 * DeepSeek 适配器。
 *
 * 这是整个后端唯一知道「大模型长什么样」的地方：密钥、鉴权头、
 * 请求/响应格式、错误语义都收敛在此。换模型厂商只需替换本文件。
 */

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-v4-flash';

/**
 * 读取运行时配置。缺少密钥时立即抛错，避免把问题拖到第一次请求才暴露。
 */
export function readConfig(env = process.env) {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      '缺少 DEEPSEEK_API_KEY。请在项目根目录的 .env.local 中配置后重启后端。'
    );
  }
  return {
    apiKey,
    baseUrl: env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL,
    model: env.DEEPSEEK_MODEL || DEFAULT_MODEL,
  };
}

/**
 * 发起一次对话补全，返回模型输出的纯文本。
 *
 * 依赖以参数传入而非在内部创建，便于测试时替换 fetch 与 config。
 *
 * @param {object} params
 * @param {string} params.prompt 用户提示词
 * @param {string} [params.system] 系统提示词
 * @param {object} params.config readConfig() 的结果
 * @param {typeof globalThis.fetch} [params.fetchImpl] 便于测试注入
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{content: string, usage: object|undefined}>}
 */
export async function complete({
  prompt,
  system = 'You are a helpful assistant.',
  config,
  fetchImpl = globalThis.fetch,
  signal,
}) {
  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const error = new Error(
      `DeepSeek 接口返回 ${response.status}${detail ? `：${detail.slice(0, 300)}` : ''}`
    );
    error.status = response.status;
    throw error;
  }

  const result = await response.json();

  if (result.error) {
    const error = new Error(result.error.message || 'DeepSeek 接口返回错误');
    error.status = 502;
    throw error;
  }

  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error('DeepSeek 接口未返回有效内容');
    error.status = 502;
    throw error;
  }

  return { content, usage: result.usage };
}
