
import { Clock, MapPin, Search, ShoppingCart, Eye, MousePointer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BehaviorTrajectory = ({ session }) => {
  // 构建时间轴数据 - 使用fmt_time2字段，确保去重
  const uniqueEvents = new Set();
  const timelineData = [];
  
  session.events.forEach((event, index) => {
    // 使用时间戳+事件名+页面名作为唯一标识
    const eventKey = `${event.time}_${event.event_name || 'page_visit'}_${event.page_name}`;
    if (!uniqueEvents.has(eventKey)) {
      uniqueEvents.add(eventKey);
      timelineData.push({
        ...event,
        index: timelineData.length + 1,
        timestamp: new Date(event.time).getTime()
      });
    }
  });

  // 构建页面流转图数据 - 基于fmt_time2时间排序，去重统计
  const pageFlow = [];
  let currentPage = null;
  let pageStartTime = null;
  const uniquePageTransitions = new Set();
  
  // 按fmt_time2时间排序原始数据
  const sortedRawData = [...session.rawData].sort((a, b) => 
    new Date(a.fmt_time2) - new Date(b.fmt_time2)
  );
  
  sortedRawData.forEach(row => {
    if (row.page_name !== currentPage) {
      if (currentPage) {
        const transitionKey = `${currentPage}_${pageStartTime}_${row.fmt_time2}`;
        if (!uniquePageTransitions.has(transitionKey)) {
          uniquePageTransitions.add(transitionKey);
          pageFlow.push({
            page: currentPage,
            startTime: pageStartTime,
            endTime: row.fmt_time2,
            duration: new Date(row.fmt_time2) - new Date(pageStartTime)
          });
        }
      }
      currentPage = row.page_name;
      pageStartTime = row.fmt_time2;
    }
  });

  // 添加最后一个页面
  if (currentPage) {
    const finalTransitionKey = `${currentPage}_${pageStartTime}_${session.endTime}`;
    if (!uniquePageTransitions.has(finalTransitionKey)) {
      pageFlow.push({
        page: currentPage,
        startTime: pageStartTime,
        endTime: session.endTime,
        duration: new Date(session.endTime) - new Date(pageStartTime)
      });
    }
  }

  // 活跃度时间线数据 - 基于fmt_time2，去重统计
  const activityData = [];
  const timeSlots = {};
  const uniqueTimeSlotEvents = new Set();
  
  session.rawData.forEach(row => {
    const time = new Date(row.fmt_time2);
    const timeKey = `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`;
    const slotEventKey = `${timeKey}_${row.fmt_time2}`;
    
    if (!uniqueTimeSlotEvents.has(slotEventKey)) {
      uniqueTimeSlotEvents.add(slotEventKey);
      timeSlots[timeKey] = (timeSlots[timeKey] || 0) + 1;
    }
  });

  Object.entries(timeSlots).forEach(([time, count]) => {
    activityData.push({ time, count });
  });

  const getEventIcon = (eventType, eventName) => {
    if (eventName?.includes('搜索') || eventType === 'search') {
      return <Search className="h-4 w-4 text-purple-600" />;
    }
    if (eventName?.includes('下单') || eventType === 'order') {
      return <ShoppingCart className="h-4 w-4 text-green-600" />;
    }
    if (eventType === 'view') {
      return <Eye className="h-4 w-4 text-blue-600" />;
    }
    if (eventType === 'click') {
      return <MousePointer className="h-4 w-4 text-orange-600" />;
    }
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  };

  // 关键节点统计 - 严格去重统计
  const uniqueSearchWords = new Set();
  const uniqueStoreNames = new Set();
  const uniqueProductNames = new Set();

  session.events.forEach(event => {
    if (event.search_word) {
      uniqueSearchWords.add(event.search_word);
    }
    if (event.wm_poi_name) {
      uniqueStoreNames.add(event.wm_poi_name);
    }
    if (event.name) {
      uniqueProductNames.add(event.name);
    }
  });

  return (
    <div className="space-y-6">
      {/* 页面流转路径 */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>页面流转路径</CardTitle>
          <CardDescription>用户在不同页面间的跳转轨迹和停留时间（基于fmt_time2时间排序，已去重统计）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pageFlow.map((flow, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{flow.page}</h4>
                    <Badge variant="outline">
                      {formatDuration(flow.duration)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(flow.startTime).toLocaleTimeString()} - {new Date(flow.endTime).toLocaleTimeString()}
                  </p>
                </div>
                {index < pageFlow.length - 1 && (
                  <div className="text-gray-400">→</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 活跃度时间线 */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>活跃度时间线</CardTitle>
          <CardDescription>用户在不同时间段的操作频率（基于fmt_time2，已去重统计）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 详细行为时间线 */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>详细行为时间线</CardTitle>
          <CardDescription>按fmt_time2时间顺序展示的所有用户行为事件（已去重统计）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {timelineData.map((event, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border-l-2 border-gray-200 hover:bg-gray-50 rounded-r-lg">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.event_type, event.event_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {event.event_name || '页面访问'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {event.page_name}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(event.time).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {event.element_name && (
                      <p>元素: {event.element_name}</p>
                    )}
                    {event.search_word && (
                      <p className="flex items-center gap-1">
                        <Search className="h-3 w-3" />
                        搜索: {event.search_word}
                      </p>
                    )}
                    {event.wm_poi_name && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        店铺: {event.wm_poi_name}
                      </p>
                    )}
                    {event.name && (
                      <p>商品: {event.name}</p>
                    )}
                    {event.action_type_name && (
                      <p>操作类型: {event.action_type_name}</p>
                    )}
                    {event.module_name && (
                      <p>模块: {event.module_name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 关键节点统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">搜索行为</CardTitle>
            <CardDescription>已去重统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(uniqueSearchWords)
                .slice(0, 5)
                .map((searchWord, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{searchWord}</span>
                    <span className="text-gray-500 text-xs">
                      去重统计
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">访问店铺</CardTitle>
            <CardDescription>已去重统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(uniqueStoreNames)
                .slice(0, 5)
                .map((poiName, index) => (
                  <div key={index} className="text-sm">
                    <span className="truncate">{poiName}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">浏览商品</CardTitle>
            <CardDescription>已去重统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(uniqueProductNames)
                .slice(0, 5)
                .map((productName, index) => (
                  <div key={index} className="text-sm">
                    <span className="truncate">{productName}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BehaviorTrajectory;

