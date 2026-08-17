import { Badge } from '@/components/ui/badge';
import { Eye, MousePointer, BarChart3, Filter, Layers } from 'lucide-react';

const PageDetailBubbles = ({ session, pageStats }) => {
  // 数据清洗函数：与PageVisitStats保持一致
  const isValidPageName = (pageName) => {
    if (!pageName) return false;
    if (typeof pageName !== 'string') return false;
    const cleanName = pageName.trim().toLowerCase();
    if (cleanName === '' || cleanName === 'null' || cleanName === 'undefined') return false;
    return true;
  };

  // 判断是否为排除的事件类型（与PageVisitStats保持一致）
  const isExcludedEventType = (actionTypeName) => {
    if (!actionTypeName || typeof actionTypeName !== 'string') return false;
    const actionType = actionTypeName.toLowerCase();
    return actionType.includes('加购') || 
           actionType.includes('点击') || 
           actionType.includes('提单') ||
           actionType.includes('下单') ||
           actionType.includes('订单');
  };

  // 如果传入了pageStats，使用新的统计数据；否则使用原有逻辑
  let sortedPages;
  let filteredEntries = 0;
  let excludedEvents = 0;
  let validSequences = 0;
  
  if (pageStats) {
    // 使用基于action_type_name的新统计逻辑，并确保数据清洗
    sortedPages = Object.entries(pageStats)
      .filter(([page, count]) => isValidPageName(page) && count > 0)
      .sort(([,a], [,b]) => b - a);
  } else {
    // 保持原有的简单统计逻辑作为后备，但添加数据清洗
    const totalRawPages = session.rawData.filter(row => row.page_name).length;
    const pageStatsBasic = session.rawData.reduce((acc, row) => {
      const page = row.page_name;
      if (isValidPageName(page)) {
        acc[page] = (acc[page] || 0) + 1;
      }
      return acc;
    }, {});

    // 计算被过滤的数据量
    const validPages = session.rawData.filter(row => isValidPageName(row.page_name)).length;
    filteredEntries = totalRawPages - validPages;

    sortedPages = Object.entries(pageStatsBasic)
      .filter(([page, count]) => isValidPageName(page) && count > 0)
      .sort(([,a], [,b]) => b - a);
  }

  // 计算统计摘要信息
  const totalPages = sortedPages.length;
  const totalExposures = sortedPages.reduce((sum, [, count]) => sum + count, 0);
  
  // 计算有效的点击事件数量（排除加购、点击、提单）
  const validClickEvents = session.rawData.filter(row => {
    return row.action_type_name && 
           !isExcludedEventType(row.action_type_name) &&
           row.action_type_name.trim() !== '' &&
           row.action_type_name !== 'page_view' &&
           row.action_type_name !== '页面浏览';
  }).length;

  // 计算被排除的事件数量
  excludedEvents = session.rawData.filter(row => 
    row.action_type_name && isExcludedEventType(row.action_type_name)
  ).length;

  // 计算有效的sequence数量
  const uniqueValidSequences = new Set();
  session.rawData.forEach(row => {
    if (row.sequence && isValidPageName(row.page_name) && !isExcludedEventType(row.action_type_name)) {
      uniqueValidSequences.add(row.sequence);
    }
  });
  validSequences = uniqueValidSequences.size;

  // 计算被过滤的数据量（如果没有通过pageStats传入）
  if (pageStats) {
    const totalRawEntries = session.rawData.filter(row => row.page_name).length;
    const validEntries = session.rawData.filter(row => isValidPageName(row.page_name) && row.sequence).length;
    filteredEntries = totalRawEntries - validEntries;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-4 w-4 text-blue-600" />
        <h4 className="font-medium text-sm">页面访问详情（基于sequence序列去重汇总，排除加购/点击/提单事件）</h4>
        {filteredEntries > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <Filter className="h-3 w-3" />
            <span>已过滤{filteredEntries}条无效数据</span>
          </div>
        )}
      </div>

      {/* 页面详情标签 */}
      <div className="flex flex-wrap gap-2">
        {sortedPages.length > 0 ? (
          sortedPages.map(([page, count], index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-sm bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {page} ({count} 次去重曝光)
            </Badge>
          ))
        ) : (
          <div className="text-gray-500 text-sm py-2">
            暂无有效页面访问数据
            {filteredEntries > 0 && (
              <span className="text-orange-600"> （已过滤{filteredEntries}条无效数据）</span>
            )}
            {excludedEvents > 0 && (
              <span className="text-red-600"> （已排除{excludedEvents}个加购/点击/提单事件）</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageDetailBubbles;
