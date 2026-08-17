/**
 * 会话分析模块。
 *
 * 组件只需说「给我这个会话的某种分析」，不必知道提示词长什么样、
 * 数据怎么序列化、输出要不要过滤。这些都在本模块内部。
 *
 * 三种分析刻意保持独立 —— 各自的提示词、序列化方式、后处理都不同，
 * 因为它们要产出不同的结果。调整其中一种不会影响另外两种：
 * 每种分析各占 kinds/ 下的一个文件。
 */

import { chatComplete } from '../lib/aiClient.js';

import * as summary from './kinds/summary.js';
import * as insights from './kinds/insights.js';
import * as orderProducts from './kinds/orderProducts.js';

/** 可用的分析类型。 */
export const AnalysisKind = {
  /** 会话概况：决策旅程 + 页面曝光时长，输出经敏感表述过滤 */
  SUMMARY: 'summary',
  /** 深度洞察：产品经理视角的 markdown 报告 */
  INSIGHTS: 'insights',
  /** 下单商品识别：仅依据 action_type_name 判定的事实结论 */
  ORDER_PRODUCTS: 'orderProducts',
};

const REGISTRY = {
  [AnalysisKind.SUMMARY]: summary,
  [AnalysisKind.INSIGHTS]: insights,
  [AnalysisKind.ORDER_PRODUCTS]: orderProducts,
};

/**
 * 对会话执行一次分析，返回可直接展示的文本。
 *
 * @param {object} session 会话对象
 * @param {string} kind AnalysisKind 之一
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] 中断信号
 * @returns {Promise<string>}
 */
export async function analyzeSession(session, kind, options = {}) {
  const analysis = REGISTRY[kind];
  if (!analysis) {
    throw new Error(`未知的分析类型：${kind}`);
  }

  const prompt = analysis.buildPrompt(session);
  const content = await chatComplete(prompt, { signal: options.signal });

  return analysis.postProcess ? analysis.postProcess(content) : content;
}

/**
 * 仅构建提示词而不发起请求。
 *
 * 提示词是这个工具真正的领域知识，把它单独暴露出来，
 * 就能在不消耗 token、不渲染 React 的前提下检查和测试它。
 *
 * @param {object} session 会话对象
 * @param {string} kind AnalysisKind 之一
 * @returns {string}
 */
export function buildAnalysisPrompt(session, kind) {
  const analysis = REGISTRY[kind];
  if (!analysis) {
    throw new Error(`未知的分析类型：${kind}`);
  }
  return analysis.buildPrompt(session);
}
