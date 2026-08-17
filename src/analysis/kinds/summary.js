/**
 * 会话概况分析。
 *
 * 目标：还原用户的决策旅程，重点是提单状态与页面曝光停留时长。
 * 输出会经过敏感表述过滤（另外两种分析不过滤）。
 *
 * 提示词与格式化逻辑均从 SessionSummary.jsx 原样迁出，一字未改 ——
 * 改动提示词会直接改变分析结果，因此迁移时刻意不作「顺手优化」。
 */

import { analyzePageExposureTime, formatExposureTime } from '../../utils/pageExposureAnalysis.js';
import { filterSensitiveContent } from '../sensitiveFilter.js';

/** 把会话序列化成本分析所需的文本。 */
export function format(session) {
  // 按时间排序原始数据
  const sortedRawData = [...session.rawData].sort((a, b) =>
    new Date(a.fmt_time2) - new Date(b.fmt_time2)
  );

  // 进行页面曝光时长分析
  const { pageExposureTimes, totalAnalyzedEvents } = analyzePageExposureTime(session.rawData);

  // 统计各类行为的曝光次数 - 使用严格去重统计，按sequence确保每个sequence只计算一次
  const uniqueEvents = new Set();
  const uniquePages = new Set();
  const uniqueSearchWords = new Set();
  const uniqueStores = new Set();
  const uniqueProducts = new Set();
  const uniqueCategories = new Set();
  const uniqueActions = new Set();

  const eventCounts = {};
  const pageCounts = {};
  const searchWords = [];
  const visitedStores = [];
  const viewedProducts = [];
  const actionTypeCounts = {};

  sortedRawData.forEach(row => {
    // 统计事件曝光次数 - 使用时间戳+事件名去重
    if (row.event_name) {
      const eventKey = `${row.fmt_time2}_${row.event_name}`;
      if (!uniqueEvents.has(eventKey)) {
        uniqueEvents.add(eventKey);
        eventCounts[row.event_name] = (eventCounts[row.event_name] || 0) + 1;
      }
    }

    // 统计页面曝光次数 - 使用时间戳+页面名去重
    if (row.page_name) {
      const pageKey = `${row.fmt_time2}_${row.page_name}`;
      if (!uniquePages.has(pageKey)) {
        uniquePages.add(pageKey);
        pageCounts[row.page_name] = (pageCounts[row.page_name] || 0) + 1;
      }
    }

    // 收集搜索词 - 去重统计
    if (row.search_word) {
      const searchKey = `${row.fmt_time2}_${row.search_word}`;
      if (!uniqueSearchWords.has(searchKey)) {
        uniqueSearchWords.add(searchKey);
        searchWords.push(row.search_word);
      }
    }

    // 收集访问店铺 - 去重统计
    if (row.wm_poi_name) {
      if (!uniqueStores.has(row.wm_poi_name)) {
        uniqueStores.add(row.wm_poi_name);
        visitedStores.push(row.wm_poi_name);
      }
    }

    // 收集浏览商品 - 去重统计
    if (row.name) {
      const productKey = row.spu_id || row.sku_id || `${row.fmt_time2}_${row.name}`;
      if (!uniqueProducts.has(productKey)) {
        uniqueProducts.add(productKey);
        viewedProducts.push(row.name);
      }
    }

    // 收集商品分类 - 去重统计
    if (row.prod_first_category_name) {
      uniqueCategories.add(row.prod_first_category_name);
    }

    // 统计操作类型 - 按action_type_name和sequence去重统计，确保同一sequence下的相同操作只计算一次
    if (row.action_type_name && row.sequence) {
      const actionKey = `${row.action_type_name}_${row.sequence}`;
      if (!uniqueActions.has(actionKey)) {
        uniqueActions.add(actionKey);
        actionTypeCounts[row.action_type_name] = (actionTypeCounts[row.action_type_name] || 0) + 1;
      }
    }
  });

  // 计算总操作事件数（所有action_type_name的总和）
  const totalActionEvents = Object.values(actionTypeCounts).reduce((sum, count) => sum + count, 0);

  // 检查action_type_name中是否真实包含搜索相关操作
  const hasSearchAction = Object.keys(actionTypeCounts).some(actionType =>
    actionType.includes('搜索') || actionType.includes('search') || actionType.includes('Search')
  );

  // 构建页面曝光时长信息
  const pageExposureInfo = Object.entries(pageExposureTimes)
    .filter(([page, time]) => page && page.trim() && page.toLowerCase() !== 'null' && time > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([page, time]) => `- ${page}: 曝光时长${formatExposureTime(time)}`)
    .join('\n');

  const sessionInfo = `
会话基本信息：
- 会话ID: ${session.sessionId}
- 开始时间: ${session.startTime}
- 结束时间: ${session.endTime}
- 会话时长: ${session.duration}
- 总操作数: ${session.totalActions}

用户操作路径和步骤（按时间顺序，已去重统计）：
${sortedRawData.map((row, index) => {
  let step = `步骤${index + 1}: [${new Date(row.fmt_time2).toLocaleTimeString()}] ${row.page_name || '未知页面'}`;
  if (row.event_name) step += ` - ${row.event_name}`;
  if (row.element_name) step += ` (点击${row.element_name})`;
  if (row.search_word) step += ` - 搜索"${row.search_word}"`;
  if (row.wm_poi_name) step += ` - 访问店铺"${row.wm_poi_name}"`;
  if (row.name) step += ` - 查看商品"${row.name}"`;
  if (row.action_type_name) step += ` - 执行${row.action_type_name}`;
  if (row.wm_order_id || row.order_id) step += ` - 订单ID: ${row.wm_order_id || row.order_id}`;
  return step;
}).join('\n')}

页面曝光浏览时长分析（基于点击事件间隔的精确时长统计）：
分析说明：通过追踪第一个点击事件到第二个点击事件触发期间用户浏览的所有页面路径，统计每个页面的曝光总时长，不满足1秒的按照1秒计数。
总分析事件数: ${totalAnalyzedEvents}个
${pageExposureInfo || '- 暂无有效页面曝光时长数据'}

事件曝光统计（已去重）：
${Object.entries(eventCounts).map(([event, count]) => `- ${event}: 曝光${count}次（去重统计）`).join('\n')}

页面曝光统计（已去重）：
${Object.entries(pageCounts).map(([page, count]) => `- ${page}: 曝光${count}次（去重统计）`).join('\n')}

操作类型曝光统计（基于action_type_name字段，按sequence去重确保每个sequence仅曝光一次）：
总操作事件数: ${totalActionEvents}次曝光
${Object.entries(actionTypeCounts).map(([action, count]) => `- ${action}: ${count}次曝光（按sequence去重统计）`).join('\n')}

${hasSearchAction ? `搜索行为详情（已去重）：
${searchWords.map((word, index) => `- 第${index + 1}次搜索: "${word}"（去重统计）`).join('\n')}` : ''}

访问店铺详情（已去重）：
${visitedStores.map((store, index) => `- 店铺${index + 1}: ${store}（去重统计）`).join('\n')}

浏览商品详情（已去重）：
${viewedProducts.slice(0, 10).map((product, index) => `- 商品${index + 1}: ${product}（去重统计）`).join('\n')}

商品分类涉及（已去重）：
${Array.from(uniqueCategories).map((category, index) => `- 分类${index + 1}: ${category}（去重统计）`).join('\n')}

下单事件统计（优先使用订单ID去重）：
${sortedRawData
  .filter(row => row.wm_order_id || row.order_id)
  .map((row, index) => `- 下单${index + 1}: 订单ID ${row.wm_order_id || row.order_id} 时间 ${row.fmt_time2}`)
  .join('\n')}
    `.trim();

  return sessionInfo;
}

/** 构建提示词。 */
export function buildPrompt(session) {
  const sessionData = format(session);

  return `作为用户行为分析专家，请基于AI理解上下文深入分析用户的决策旅程，严格遵从action_type_name字段的提单状态，并且在对已提单和未提单的情况下对下单商品进行分析。

重要分析要求：
1. 严格按照action_type_name字段来判断提单状态，只有当action_type_name中明确包含"提单"、"下单"、"订单"等关键词时，才认为用户完成了下单
2. 重点分析提单状态序列之前点击加购行为sequence序列之间的关系
3. 对上下文进行理解，提取5-10个关键行为步骤，按时间描述用户的主要操作路径
4. 忽略无意义的行为和干扰噪音，不要过度分析
5. 不要出具建议，不要提出任何"搜索"或者相关的词汇和内容分析
6. 不要解读用户在提单后的行为
7. 连贯的会话谨慎使用markdown，不超过2000tokens
8. 严格避免出现"用户价格敏感"、"优惠敏感"、"受到品牌信任度驱使"等类似内容
9. 在识别到的关键页面后加入页面曝光停留的总时长信息，基于页面曝光浏览时长分析结果

特别关注以下用户行为模式：
① 用户在美食频道页进入【霸王茶几】的店铺页，浏览了XXX
② 用户在美食频道页进入了B版落地页，然后进入了【霸王茶几】的店铺页，浏览了XXX

分析内容：
- 用户核心行为流程：提取关键行为步骤，按时间顺序描述用户的主要操作路径，在关键页面后标注曝光停留时长
- 曝光次数数据：基于action_type_name字段统计的操作事件数据，按sequence去重确保每个sequence仅曝光一次
- 用户在寻找哪些商品和商家：具体说明用户浏览的商品类型和店铺名称
- 用户是否成功转化并且下单：需要有明细，包括订单信息

输出要求：
- 不使用markdown格式，保持流畅的叙述
- 限制在2000tokens以内
- 必须包含具体的商品名、店铺名和曝光数据
- 在关键页面描述后加入曝光停留时长信息
- 不要有衍生的内容，只基于实际数据进行分析
- 严格按照action_type_name字段来描述操作行为

用户行为数据：
${sessionData}

请用中文回答，提供深入的会话概况分析。`;
}

/** 输出后处理：剔除敏感表述。 */
export const postProcess = filterSensitiveContent;
