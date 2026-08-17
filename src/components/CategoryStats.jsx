import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CategoryStats = ({ session }) => {
  // 商品分类统计 - 修复曝光计数问题，确保每个字段单独统计
  const categoryStats = {
    // 一级分类统计 - 仅基于prod_first_category_name字段
    firstCategory: [...new Set(session.rawData
      .filter(row => row.prod_first_category_name)
      .map(row => row.prod_first_category_name))],
    
    // 二级分类统计 - 仅基于prod_second_category_name字段
    secondCategory: [...new Set(session.rawData
      .filter(row => row.prod_second_category_name)
      .map(row => row.prod_second_category_name))],
    
    // 三级分类统计 - 仅基于prod_third_category_name字段
    thirdCategory: [...new Set(session.rawData
      .filter(row => row.prod_third_category_name)
      .map(row => row.prod_third_category_name))],
    
    // 四级分类统计 - 仅基于prod_four_category_name字段
    fourCategory: [...new Set(session.rawData
      .filter(row => row.prod_four_category_name)
      .map(row => row.prod_four_category_name))]
  };

  // 标签分类统计 - 重点关注三级标签中的小吃类型，忽略null值
  const tagStats = {
    // 一级标签统计 - 仅基于primary_first_tag_name字段，忽略null
    firstTag: [...new Set(session.rawData
      .filter(row => row.primary_first_tag_name && row.primary_first_tag_name !== null)
      .map(row => row.primary_first_tag_name))],
    
    // 二级标签统计 - 仅基于primary_second_tag_name字段，忽略null
    secondTag: [...new Set(session.rawData
      .filter(row => row.primary_second_tag_name && row.primary_second_tag_name !== null)
      .map(row => row.primary_second_tag_name))],
    
    // 三级标签统计 - 重点关注primary_third_tag_name字段的小吃类型，忽略null
    thirdTag: [...new Set(session.rawData
      .filter(row => row.primary_third_tag_name && row.primary_third_tag_name !== null)
      .map(row => row.primary_third_tag_name))]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>商品分类统计</CardTitle>
          <CardDescription>基于prod_*_category_name字段的准确分类统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">一级分类 (prod_first_category_name)</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {categoryStats.firstCategory.slice(0, 8).map((category, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{category}</span>
                    <Badge variant="outline" className="text-xs">
                      {session.rawData.filter(row => row.prod_first_category_name === category).length}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">二级分类 (prod_second_category_name)</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {categoryStats.secondCategory.slice(0, 8).map((category, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{category}</span>
                    <Badge variant="outline" className="text-xs">
                      {session.rawData.filter(row => row.prod_second_category_name === category).length}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>标签分类统计</CardTitle>
          <CardDescription>基于primary_*_tag_name字段的准确标签统计，忽略null值</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">一级标签 (primary_first_tag_name)</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tagStats.firstTag.slice(0, 8).map((tag, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{tag}</span>
                    <Badge variant="outline" className="text-xs">
                      {session.rawData.filter(row => row.primary_first_tag_name === tag && row.primary_first_tag_name !== null).length}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">二级标签 (primary_second_tag_name)</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tagStats.secondTag.slice(0, 8).map((tag, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{tag}</span>
                    <Badge variant="outline" className="text-xs">
                      {session.rawData.filter(row => row.primary_second_tag_name === tag && row.primary_second_tag_name !== null).length}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryStats;
