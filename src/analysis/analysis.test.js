import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildAnalysisPrompt, AnalysisKind } from './index.js';
import { filterSensitiveContent } from './sensitiveFilter.js';
import * as summary from './kinds/summary.js';
import * as insights from './kinds/insights.js';
import * as orderProducts from './kinds/orderProducts.js';

/** 一个带下单行为的会话，足以让三种分析都产出完整提示词。 */
const session = {
  sessionId: 's_1001',
  startTime: '2025-08-01 10:00:02',
  endTime: '2025-08-01 10:02:35',
  duration: '2分33秒',
  totalActions: 4,
  pages: ['首页', '商品详情页', '提单页'],
  rawData: [
    {
      fmt_time2: '2025-08-01 10:00:02', page_name: '首页', event_name: '页面浏览',
      action_type_name: '曝光', sequence: '1', search_word: '咖啡',
    },
    {
      fmt_time2: '2025-08-01 10:00:46', page_name: '商品详情页', event_name: '点击商品',
      action_type_name: '点击', sequence: '2', name: '拿铁', wm_poi_name: '某咖啡店',
      prod_first_category_name: '饮品',
    },
    {
      fmt_time2: '2025-08-01 10:01:51', page_name: '商品详情页', event_name: '加入购物车',
      action_type_name: '加购', sequence: '3', name: '拿铁',
    },
    {
      fmt_time2: '2025-08-01 10:02:35', page_name: '提单页', event_name: '下单成功',
      action_type_name: '下单', sequence: '4', name: '拿铁', actual_price: '29.9',
      wm_order_id: 'o_777',
    },
  ],
};

describe('三种分析必须保持彼此独立', () => {
  test('三个提示词互不相同', () => {
    // 这是本模块存在的前提：三种分析要产出不同结果。
    // 若哪天有人「顺手合并」了提示词，这条会立刻失败。
    const prompts = [
      buildAnalysisPrompt(session, AnalysisKind.SUMMARY),
      buildAnalysisPrompt(session, AnalysisKind.INSIGHTS),
      buildAnalysisPrompt(session, AnalysisKind.ORDER_PRODUCTS),
    ];
    assert.equal(new Set(prompts).size, 3, '三个提示词不应有任何两个相同');
  });

  test('每种分析都带着自己的标志性指令', () => {
    const cases = [
      [AnalysisKind.SUMMARY, '作为用户行为分析专家'],
      [AnalysisKind.INSIGHTS, '你是一个产品经理'],
      [AnalysisKind.ORDER_PRODUCTS, '智能识别用户的所有下单行为'],
    ];
    for (const [kind, marker] of cases) {
      assert.ok(
        buildAnalysisPrompt(session, kind).includes(marker),
        `${kind} 的提示词应包含「${marker}」`
      );
    }
  });

  test('三种分析各有各的输出约定，不可互换', () => {
    const summaryPrompt = buildAnalysisPrompt(session, AnalysisKind.SUMMARY);
    const insightsPrompt = buildAnalysisPrompt(session, AnalysisKind.INSIGHTS);
    const orderPrompt = buildAnalysisPrompt(session, AnalysisKind.ORDER_PRODUCTS);

    // 概况分析明确要求「不使用markdown」，深度洞察恰恰要求「使用markdown」
    assert.ok(summaryPrompt.includes('不使用markdown格式'));
    assert.ok(insightsPrompt.includes('使用markdown格式组织你的回答'));

    // 商品识别要的是可判定结论，不是叙事
    assert.ok(orderPrompt.includes('用户未完成下单'));
  });

  test('只有概况分析做敏感表述过滤', () => {
    assert.equal(typeof summary.postProcess, 'function');
    assert.equal(insights.postProcess, undefined);
    assert.equal(orderProducts.postProcess, undefined);
  });
});

describe('提示词内容', () => {
  test('会话数据被真正嵌入提示词，而非只拼了模板', () => {
    for (const kind of Object.values(AnalysisKind)) {
      const prompt = buildAnalysisPrompt(session, kind);
      assert.ok(prompt.includes('s_1001'), `${kind} 应包含会话ID`);
      assert.ok(prompt.includes('拿铁'), `${kind} 应包含商品名`);
    }
  });

  test('商品识别提示词会报出检测到的提单次数', () => {
    const prompt = buildAnalysisPrompt(session, AnalysisKind.ORDER_PRODUCTS);
    assert.ok(prompt.includes('检测到的提单次数：1次'));
  });

  test('未知分析类型立即报错，不静默返回空提示词', () => {
    assert.throws(() => buildAnalysisPrompt(session, 'nope'), /未知的分析类型/);
  });

  test('空会话不抛错', () => {
    const empty = { sessionId: 's_0', pages: [], rawData: [], totalActions: 0 };
    for (const kind of Object.values(AnalysisKind)) {
      assert.doesNotThrow(() => buildAnalysisPrompt(empty, kind), `${kind} 不应因空会话抛错`);
    }
  });
});

describe('filterSensitiveContent', () => {
  test('剔除含敏感表述的句子，保留同段其他句子', () => {
    const input = '用户浏览了商品。用户价格敏感，反复比价。最终完成下单。';
    const output = filterSensitiveContent(input);
    assert.ok(!output.includes('价格敏感'));
    assert.ok(output.includes('用户浏览了商品'));
    assert.ok(output.includes('最终完成下单'));
  });

  test('全部提示词里被点名禁止的表述，过滤器都真的覆盖', () => {
    // 提示词第 8 条列了禁止表述，但模型未必遵守，过滤器是兜底。
    // 这条把「提示词的要求」和「兜底实现」锁在一起。
    for (const banned of ['用户价格敏感', '优惠敏感', '受到品牌信任度驱使']) {
      const output = filterSensitiveContent(`前一句。${banned}的描述。后一句。`);
      assert.ok(!output.includes(banned), `应过滤「${banned}」`);
    }
  });

  test('空输入原样返回', () => {
    assert.equal(filterSensitiveContent(''), '');
    assert.equal(filterSensitiveContent(null), null);
  });
});
