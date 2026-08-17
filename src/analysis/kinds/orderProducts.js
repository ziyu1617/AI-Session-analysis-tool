/**
 * 下单商品识别。
 *
 * 目标：仅依据 action_type_name 判定提单状态，识别每一次提单对应的商品。
 * 与另外两种分析刻意不同：这里要的是可判定的事实结论，不要叙事、不要推测。
 *
 * 提示词与格式化逻辑均从 OrderProductExtractor.jsx 原样迁出，一字未改。
 */

/** 把会话序列化成本分析所需的文本。 */
export function format(session) {
  return session.rawData
    .sort((a, b) => new Date(a.fmt_time2) - new Date(b.fmt_time2))
    .map((row, index) => {
      let context = `${index + 1}. [${row.fmt_time2}] ${row.page_name || '未知页面'}`;
      if (row.action_type_name) context += ` - ${row.action_type_name}`;
      if (row.event_name) context += ` - ${row.event_name}`;
      if (row.element_name) context += ` (${row.element_name})`;
      if (row.search_word) context += ` - 搜索: ${row.search_word}`;
      if (row.wm_poi_name) context += ` - 店铺: ${row.wm_poi_name}`;
      if (row.name) context += ` - 商品: ${row.name}`;
      if (row.prod_first_category_name) context += ` - 分类: ${row.prod_first_category_name}`;
      if (row.wm_order_id || row.order_id) context += ` - 订单: ${row.wm_order_id || row.order_id}`;
      if (row.actual_price) context += ` - 价格: ¥${row.actual_price}`;
      return context;
    }).join('\n');
}

/** 提单相关事件，按时间排序。提示词需要据此说明提单次数。 */
function findOrderActions(session) {
  return session.rawData.filter(row =>
    row.action_type_name && (
      row.action_type_name.includes('提单') ||
      row.action_type_name.includes('下单') ||
      row.action_type_name.includes('订单')
    )
  ).sort((a, b) => new Date(a.fmt_time2) - new Date(b.fmt_time2));
}

/** 构建提示词。 */
export function buildPrompt(session) {
  const sessionContext = format(session);
  const orderActions = findOrderActions(session);
  const hasMultipleOrders = orderActions.length > 1;

  return `请根据以下用户行为数据，严格遵从action_type_name字段的提单状态，智能识别用户的所有下单行为和对应的商品名称。

重要分析要求：
1. 必须严格按照action_type_name字段来判断提单状态，只有当action_type_name中明确包含"提单"、"下单"、"订单"等关键词时，才认为用户完成了下单
2. 特别注意：用户可能存在多次提单行为，需要识别每一次提单操作及其对应的商品
3. 如果action_type_name中没有提单相关操作，则用户未完成下单，输出"用户未完成下单"
4. 在已提单的情况下，需要谨慎分析每次下单的商品：
   - 按时间顺序分析每次提单操作
   - 每次提单前的加购商品不一定都完成下单
   - 需要结合每次提单sequence的上下文信息来判断实际下单的商品
   - 优先考虑在每次提单操作sequence附近出现的商品名称
   - 分析商品的时间顺序和操作关联性
5. 如果确实完成提单但无法确定具体商品，请说明原因
6. 多次提单时，请分别列出每次提单的商品，格式为："第1次提单：商品A、商品B；第2次提单：商品C、商品D"

检测到的提单次数：${orderActions.length}次
${hasMultipleOrders ? '注意：检测到多次提单行为，请分别分析每次提单的商品' : ''}

分析步骤：
第一步：检查action_type_name字段中是否存在提单相关操作，统计提单次数
第二步：如果存在提单操作，按时间顺序分析每次提单sequence前后的商品信息
第三步：结合每次商品浏览、加购、点击等行为上下文，推断每次提单对应的商品
第四步：排除可能只是浏览或加购但未实际下单的商品
第五步：如果是多次提单，分别列出每次提单的商品清单

用户行为数据：
会话ID: ${session.sessionId}
会话时长: ${session.duration}
总操作数: ${session.totalActions}

详细行为序列：
${sessionContext}

请直接输出分析结果，不要包含表格数据证明和序列号描述：
- 如果用户未完成下单，输出"用户未完成下单"
- 如果用户完成单次下单且能确定商品，输出具体商品名称（多个商品用"、"分隔）
- 如果用户完成多次下单，按格式输出："第1次提单：商品A、商品B；第2次提单：商品C、商品D"
- 如果用户完成下单但无法确定具体商品，输出"已提单但无法确定具体商品"并说明原因`;
}
