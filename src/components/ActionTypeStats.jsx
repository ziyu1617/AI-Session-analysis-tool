
import { Eye, Heart, ShoppingCart, Star, Search, MapPin, Clock, MousePointer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CardContent, CardHeader, CardDescription, Card, CardTitle } from '@/components/ui/card';
const ActionTypeStats = ({ session }) => {
  // 统计 action_type_name 字段中每个行为的次数 - 按sequence去重，确保每个sequence只计算一次
  const uniqueActionEvents = new Set();
  const actionTypeStats = {};

  session.rawData.forEach(row => {
    if (row.action_type_name && row.sequence) {
      // 使用action_type_name + sequence作为唯一标识，确保同一sequence下的相同操作只计算一次
      const eventKey = `${row.action_type_name}_${row.sequence}`;
      if (!uniqueActionEvents.has(eventKey)) {
        uniqueActionEvents.add(eventKey);
        actionTypeStats[row.action_type_name] = (actionTypeStats[row.action_type_name] || 0) + 1;
      }
    }
  });

  // 检查是否存在提单行为，如果没有则添加为0
  const hasOrderAction = Object.keys(actionTypeStats).some(actionType => 
    actionType.includes('提单') || actionType.includes('下单') || actionType.includes('订单')
  );
  
  if (!hasOrderAction) {
    actionTypeStats['提单行为'] = 0;
  }

  // 获取图标
  const getActionIcon = (actionType) => {
    const iconMap = {
      '搜索': Search,
      '浏览': Eye,
      '点击': MousePointer,
      '下单': ShoppingCart,
      '访问': MapPin,
      '停留': Clock,
      '收藏': Heart,
      '评价': Star,
    };
    
    // 根据关键词匹配图标
    for (const [keyword, Icon] of Object.entries(iconMap)) {
      if (actionType.includes(keyword)) {
        return Icon;
      }
    }
    return MousePointer; // 默认图标
  };

  // 获取颜色
  const getActionColor = (actionType) => {
    const colorMap = {
      '搜索': 'purple',
      '浏览': 'blue',
      '点击': 'green',
      '下单': 'red',
      '访问': 'orange',
      '停留': 'gray',
      '收藏': 'pink',
      '评价': 'yellow',
    };
    
    for (const [keyword, color] of Object.entries(colorMap)) {
      if (actionType.includes(keyword)) {
        return color;
      }
    }
    return 'gray';
  };

  // 按次数排序
  const sortedActionTypes = Object.entries(actionTypeStats)
    .sort(([,a], [,b]) => b - a);

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle>关键行为指标</CardTitle>
        <CardDescription>基于 action_type_name 字段统计每个行为的曝光次数，按sequence去重确保同一session下每个sequence仅曝光一次</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedActionTypes.map(([actionType, count], index) => {
          const Icon = getActionIcon(actionType);
          const color = getActionColor(actionType);
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 text-${color}-600`} />
                <span className="font-medium">{actionType}</span>
                <span className="text-xs text-gray-500">（按sequence去重曝光）</span>
              </div>
              <Badge variant={count === 0 ? "destructive" : "secondary"}>
                {count} 次曝光
              </Badge>
            </div>
          );
        })}
        
        {sortedActionTypes.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">暂无行为数据</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionTypeStats;
