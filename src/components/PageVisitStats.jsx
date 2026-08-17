
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { AlertCircle, BarChart3 } from 'lucide-react';
import PageDetailBubbles from '@/components/PageDetailBubbles';

const PageVisitStats = ({ session }) => {
  // 数据清洗函数：过滤无效的页面名称
  const isValidPageName = (pageName) => {
    if (!pageName) return false;
    if (typeof pageName !== 'string') return false;
    const cleanName = pageName.trim().toLowerCase();
    if (cleanName === '' || cleanName === 'null' || cleanName === 'undefined') return false;
    return true;
  };

  // 判断是否为排除的事件类型（加购、点击、提单）
  const isExcludedEventType = (actionTypeName) => {
    if (!actionTypeName || typeof actionTypeName !== 'string') return false;
    const actionType = actionTypeName.toLowerCase();
    return actionType.includes('加购') || 
           actionType.includes('点击') || 
           actionType.includes('提单') ||
           actionType.includes('下单') ||
           actionType.includes('订单');
  };

  // 实现基于action_type_name字段的严格页面访问统计逻辑
  const processPageVisitStatsWithStrictRules = () => {
    // 按时间排序原始数据，同时进行数据清洗
    const sortedData = [...session.rawData]
      .filter(row => isValidPageName(row.page_name) && row.sequence) // 必须有有效的页面名和sequence
      .sort((a, b) => new Date(a.fmt_time2) - new Date(b.fmt_time2));

    if (sortedData.length === 0) {
      return { pageStats: {}, processedSequences: [], clickEventCount: 0, browsingEventCount: 0 };
    }

    // 识别所有有效的点击事件（排除加购、点击、提单事件）
    const validClickEvents = sortedData.filter(row => {
      // 必须有action_type_name，且不是排除的事件类型，且不是纯浏览事件
      return row.action_type_name && 
             !isExcludedEventType(row.action_type_name) &&
             row.action_type_name.trim() !== '' &&
             row.action_type_name !== 'page_view' &&
             row.action_type_name !== '页面浏览';
    });

    // 页面曝光统计结果
    const pageExposureStats = {};
    const processedSequences = new Set(); // 记录已处理的sequence，确保严格去重
    const detailedProcessingLog = []; // 处理过程日志

    if (validClickEvents.length === 0) {
      // 如果没有有效的点击事件，将所有浏览事件统一处理
      const allBrowsingEvents = sortedData.filter(row => 
        isValidPageName(row.page_name) && 
        !isExcludedEventType(row.action_type_name) &&
        !processedSequences.has(row.sequence)
      );

      // 按页面名称和sequence进行严格去重
      allBrowsingEvents.forEach(row => {
        if (!processedSequences.has(row.sequence)) {
          pageExposureStats[row.page_name] = (pageExposureStats[row.page_name] || 0) + 1;
          processedSequences.add(row.sequence);
          detailedProcessingLog.push({
            type: 'browsing_without_clicks',
            page: row.page_name,
            sequence: row.sequence,
            time: row.fmt_time2
          });
        }
      });
    } else {
      // 处理点击事件之间的浏览行为
      for (let i = 0; i <= validClickEvents.length; i++) {
        let startTime, endTime, segmentType;
        
        if (i === 0) {
          // 第一个点击事件之前的浏览行为
          startTime = sortedData[0]?.fmt_time2;
          endTime = validClickEvents[0]?.fmt_time2;
          segmentType = 'before_first_click';
        } else if (i === validClickEvents.length) {
          // 最后一个点击事件之后的浏览行为
          startTime = validClickEvents[i - 1]?.fmt_time2;
          endTime = sortedData[sortedData.length - 1]?.fmt_time2;
          segmentType = 'after_last_click';
        } else {
          // 两个点击事件之间的浏览行为
          startTime = validClickEvents[i - 1]?.fmt_time2;
          endTime = validClickEvents[i]?.fmt_time2;
          segmentType = `between_clicks_${i}`;
        }

        // 获取该时间段内的所有浏览事件
        const browsingEventsInSegment = sortedData.filter(row => {
          const rowTime = row.fmt_time2;
          return rowTime >= startTime && 
                 rowTime <= endTime && 
                 isValidPageName(row.page_name) &&
                 !isExcludedEventType(row.action_type_name) &&
                 row.sequence &&
                 !processedSequences.has(row.sequence);
        });

        // 对该时间段内的浏览事件按页面名称去重，统一计为单次曝光
        const uniquePagesInSegment = new Map(); // 使用Map记录页面和对应的sequence
        
        browsingEventsInSegment.forEach(row => {
          if (isValidPageName(row.page_name) && !processedSequences.has(row.sequence)) {
            // 每个页面在当前时间段内只计算一次
            if (!uniquePagesInSegment.has(row.page_name)) {
              uniquePagesInSegment.set(row.page_name, []);
            }
            uniquePagesInSegment.get(row.page_name).push({
              sequence: row.sequence,
              time: row.fmt_time2
            });
          }
        });

        // 为每个唯一页面增加一次曝光计数
        uniquePagesInSegment.forEach((sequences, pageName) => {
          pageExposureStats[pageName] = (pageExposureStats[pageName] || 0) + 1;
          
          // 将所有相关的sequence标记为已处理
          sequences.forEach(({ sequence, time }) => {
            processedSequences.add(sequence);
            detailedProcessingLog.push({
              type: segmentType,
              page: pageName,
              sequence: sequence,
              time: time,
              segment_start: startTime,
              segment_end: endTime
            });
          });
        });
      }
    }

    return { 
      pageStats: pageExposureStats, 
      processedSequences: Array.from(processedSequences),
      clickEventCount: validClickEvents.length,
      browsingEventCount: processedSequences.size,
      processingLog: detailedProcessingLog
    };
  };

  // 获取处理后的页面统计数据
  const {
    pageStats,
    processedSequences,
    clickEventCount,
    browsingEventCount,
    processingLog
  } = processPageVisitStatsWithStrictRules();
  
  // 二次数据清洗：确保图表数据中不包含无效的页面名称
  const cleanedPageStats = Object.entries(pageStats)
    .filter(([page, count]) => isValidPageName(page) && count > 0)
    .reduce((acc, [page, count]) => {
      acc[page] = count;
      return acc;
    }, {});
  
  // 生成图表数据
  const pageChartData = Object.entries(cleanedPageStats)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 计算统计指标
  const totalUniquePages = Object.keys(cleanedPageStats).length;
  const totalExposures = Object.values(cleanedPageStats).reduce((sum, count) => sum + count, 0);

  // 计算被过滤的数据量
  const totalRawEntries = session.rawData.filter(row => row.page_name).length;
  const validEntries = session.rawData.filter(row => isValidPageName(row.page_name) && row.sequence).length;
  const filteredEntries = totalRawEntries - validEntries;

  // 计算排除的事件数量
  const excludedEvents = session.rawData.filter(row => 
    row.action_type_name && isExcludedEventType(row.action_type_name)
  ).length;

  // 空状态处理
  if (totalUniquePages === 0) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>页面访问统计</CardTitle>
          <CardDescription>
            基于action_type_name字段严格分析两次点击事件之间的浏览行为，对sequence序列进行去重汇总统计
            <br />
            已排除 {excludedEvents} 个加购/点击/提单事件，确保统计准确性
            {filteredEntries > 0 && (
              <><br />已过滤 {filteredEntries} 条无效数据（null值等）</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-600">暂无有效页面访问数据</h3>
                <p className="text-sm text-gray-500">
                  当前会话中没有检测到有效的页面曝光事件，
                  <br />或所有数据均被严格的去重算法过滤
                </p>
                {filteredEntries > 0 && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded space-y-1">
                    <p>系统已自动过滤 {filteredEntries} 条包含null值的无效数据</p>
                    <p>排除了 {excludedEvents} 个加购/点击/提单相关事件</p>
                    <p>处理了 {clickEventCount} 个有效点击事件</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <PageDetailBubbles session={session} pageStats={cleanedPageStats} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle>页面访问统计</CardTitle>
        <CardDescription>
          基于action_type_name字段严格分析两次点击事件之间的浏览行为，对sequence序列进行去重汇总统计
          <br />
          处理结果: {totalUniquePages} 个独特页面，{totalExposures} 次去重后曝光，{browsingEventCount} 个有效sequence
          <br />
          已排除 {excludedEvents} 个加购/点击/提单事件，处理 {clickEventCount} 个有效点击事件
          {filteredEntries > 0 && (
            <><br />已自动过滤 {filteredEntries} 条无效数据，确保数据展示严谨性</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pageChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="page"
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`${value} 次去重曝光`, '曝光次数']}
                labelFormatter={(label) => `页面: ${label}`}
              />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <PageDetailBubbles session={session} pageStats={cleanedPageStats} />
      </CardContent>
    </Card>
  );
};

export default PageVisitStats;

