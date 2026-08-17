import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const SnackTypeStats = ({ session }) => {
  // 小吃类型统计 - 专门统计primary_third_tag_name字段中的不同小吃类型
  const snackTypeStats = session.rawData
    .filter(row => row.primary_third_tag_name && row.primary_third_tag_name !== null)
    .reduce((acc, row) => {
      const snackType = row.primary_third_tag_name;
      acc[snackType] = (acc[snackType] || 0) + 1;
      return acc;
    }, {});

  const snackTypeChartData = Object.entries(snackTypeStats)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle>小吃类型统计</CardTitle>
        <CardDescription>基于primary_third_tag_name字段统计不同小吃类型（如意面、披萨等），忽略null值</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 小吃类型柱状图 */}
          <div className="h-80">
            <h4 className="font-medium text-sm mb-4">小吃类型分布图</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snackTypeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 小吃类型详细列表 */}
          <div>
            <h4 className="font-medium text-sm mb-4">小吃类型详情</h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {Object.entries(snackTypeStats)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count], index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                    <span className="font-medium text-sm">{type}</span>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {count} 次
                    </Badge>
                  </div>
                ))}
            </div>
            {Object.keys(snackTypeStats).length === 0 && (
              <p className="text-gray-500 text-sm">暂无小吃类型数据</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SnackTypeStats;
