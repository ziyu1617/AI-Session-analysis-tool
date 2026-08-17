import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const EventTypeStats = ({ session }) => {
  // 统计事件类型 - 使用event_type字段，基于sequence去重
  const uniqueEventTypes = new Set();
  session.rawData.forEach(row => {
    if (row.event_type && row.sequence) {
      const eventKey = `${row.event_type}_${row.sequence}`;
      uniqueEventTypes.add(eventKey);
    }
  });

  const eventStats = session.rawData.reduce((acc, row) => {
    const eventType = row.event_type || '其他';
    acc[eventType] = (acc[eventType] || 0) + 1;
    return acc;
  }, {});

  const eventChartData = Object.entries(eventStats).map(([type, count]) => ({
    type,
    count,
    color: getEventColor(type)
  }));

  function getEventColor(eventType) {
    const colors = {
      'click': '#3B82F6',
      'view': '#10B981',
      'scroll': '#F59E0B',
      'search': '#8B5CF6',
      'order': '#EF4444',
      '其他': '#6B7280'
    };
    return colors[eventType] || colors['其他'];
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle>事件类型分布</CardTitle>
        <CardDescription>基于event_type字段统计，按sequence去重</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={eventChartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                label={({ type, count }) => `${type}: ${count}`}
              >
                {eventChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventTypeStats;
