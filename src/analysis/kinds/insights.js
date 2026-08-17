/**
 * 深度洞察分析。
 *
 * 目标：以产品经理视角解读用户需求的演变与决策逻辑，输出 markdown 报告。
 * 与「会话概况分析」刻意不同：这里要的是解释性叙事，不做敏感表述过滤。
 *
 * 提示词与格式化逻辑均从 DeepInsights.jsx 原样迁出，一字未改。
 */

/** 把会话序列化成本分析所需的文本。 */
export function format(session) {
  // 按时间排序原始数据
  const sortedRawData = [...session.rawData].sort((a, b) =>
    new Date(a.fmt_time2) - new Date(b.fmt_time2)
  );

  const sessionInfo = `
会话基本信息：
- 会话ID: ${session.sessionId}
- 开始时间: ${session.startTime}
- 结束时间: ${session.endTime}
- 会话时长: ${session.duration}
- 总操作数: ${session.totalActions}
- 访问页面数: ${session.pages.length}

按时间顺序的详细行为序列：
${sortedRawData.map((row, index) => {
  let eventDesc = `${index + 1}. [${new Date(row.fmt_time2).toLocaleTimeString()}] ${row.page_name || '未知页面'}`;
  if (row.event_name) eventDesc += ` - ${row.event_name}`;
  if (row.element_name) eventDesc += ` (${row.element_name})`;
  if (row.search_word) eventDesc += ` - 搜索: ${row.search_word}`;
  if (row.wm_poi_name) eventDesc += ` - 店铺: ${row.wm_poi_name}`;
  if (row.name) eventDesc += ` - 商品: ${row.name}`;
  if (row.action_type_name) eventDesc += ` - 操作: ${row.action_type_name}`;
  if (row.module_name) eventDesc += ` - 模块: ${row.module_name}`;
  if (row.prod_first_category_name) eventDesc += ` - 分类: ${row.prod_first_category_name}`;
  if (row.wm_order_id || row.order_id) eventDesc += ` - 订单: ${row.wm_order_id || row.order_id}`;
  return eventDesc;
}).join('\n')}

搜索行为统计：
${[...new Set(sortedRawData.filter(row => row.search_word).map(row => row.search_word))].map(word => `- ${word}`).join('\n')}

访问店铺统计：
${[...new Set(sortedRawData.filter(row => row.wm_poi_name).map(row => row.wm_poi_name))].map(poi => `- ${poi}`).join('\n')}

浏览商品统计：
${[...new Set(sortedRawData.filter(row => row.name).map(row => row.name))].slice(0, 10).map(product => `- ${product}`).join('\n')}

商品分类统计：
${[...new Set(sortedRawData.filter(row => row.prod_first_category_name).map(row => row.prod_first_category_name))].map(category => `- ${category}`).join('\n')}
    `.trim();

  return sessionInfo;
}

/** 构建提示词。 */
export function buildPrompt(session) {
  const sessionData = format(session);

  return `你是一个产品经理，请在最后在深度洞察中请注意分析以下方面，对ai 归因报告中对内容进行提升，请提供详细的分析报告，使用markdown格式组织你的回答，在报告中请具体说明用户浏览的商品店铺名和商品名，其他功能保持不变，包括：

核心行为流程

提取5-10个关键行为步骤，按时间顺序描述用户的主要操作路径

忽略无意义的重复行为和干扰噪音

用户意图分析

用户的主要目标是什么？

用户在寻找什么类型的商品/服务？

用户的决策考虑因素有哪些（如价格、评分、距离等）？

用户路径分析

用户的搜索/浏览过程是否顺畅？

是否存在反复操作或犹豫不决的情况？并且说明原因是什么

用户是否成功转化并且下单？完成下单

最后再用一段话进行总结用户的行为，并且不需要出具平台的优化建议，不要超过6000tokens：【作为用户行为分析专家，请深入解读用户的决策旅程，揭示表层行为背后的需求演变与决策逻辑。首先，追踪用户完整的行为路径，识别从初始接触到最终转化之间的关键转折点，特别关注用户在不同功能模块（如首页、搜索框、分类频道）之间的跳转动机。观察用户需求是如何从模糊渐趋清晰的—它可能始于笼统的类别浏览，而后受平台功能引导逐步聚焦，直至形成具体选择。

关注那些改变用户行为轨迹的关键时刻，比如从随意浏览切换至主动搜索，或从单一商品关注扩展至相关品类探索。分析平台元素（如金刚区分类、搜索推荐、评价内容）如何引导和塑造用户决策，以及这些元素是否恰当满足了用户当时的心智状态。探究用户展现的决策模式—是先确定品类再选商家，还是基于品牌忠诚直接定向选择？观察搜索行为中词汇的调整策略，它往往揭示了用户如何逐步精炼自己的真实需求。

留意组合购买行为中的主次商品关系，次要商品通常代表被平台激发的附加需求，这些是潜在的交叉销售机会。通过识别用户在决策过程中的犹豫、反复和障碍。最终，你的分析应呈现为一个连贯专业性强的叙事，包含完整行为路径描述、关键行为洞察、用户决策模式特点、潜在体验障碍。每项洞察都应有行为数据支持，推断需明确标注并解释依据，确保分析既有深度又有实用价值。】

这是总结示例："用户想吃点小食，但首页列表里正餐较多，因此转向甜点饮品金刚，而频道页激发了用户具体的口味需求（实际上频道页并没有曝光后续的搜索内容，但很可能通过大量商品曝光让用户自发收敛了对"甜点饮品"的需求），因此开始使用搜索，通过不断调整搜索词找到意向商家商品

引申：

用户可能遇到的阻碍：在对食材、口味产生需求时，用户需要自己提炼关键词，并不断调整使搜索结果匹配预期

用户的加购偏好：店内加购多个商品时，可能往往只有1个是明确需要的，其他内容很可能是通过搭配组合激发出的新需求（如：用户突然店内搜索"多芒"，推测是因为下挂菜组合里有"芒果"且用户在4天前买过"多芒小丸子""

用户行为数据：
${sessionData}

请用中文回答，提供深度的行为洞察分析，不要提供平台优化建议。`;
}
