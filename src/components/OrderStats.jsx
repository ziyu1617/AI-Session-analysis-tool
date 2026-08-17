import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Package, DollarSign } from 'lucide-react';
import OrderProductExtractor from '@/components/OrderProductExtractor';
import { useState } from 'react';

const OrderStats = ({ session }) => {
  const [aiExtractedProducts, setAiExtractedProducts] = useState(null);

  // 1. 检查是否完成下单 - 通过action_type_name中的提单信息判断
  const checkOrderCompletion = () => {
    try {
      const hasOrderAction = session.rawData.some(row => 
        row.action_type_name && (
          row.action_type_name.includes('提单') || 
          row.action_type_name.includes('下单') || 
          row.action_type_name.includes('订单')
        )
      );
      return hasOrderAction ? '是' : '否';
    } catch (error) {
      return '解析异常';
    }
  };

  // 2. 计算单均价 - 关联提单sequence中actual_price实付金额总和除以商品数量
  const calculateAveragePrice = () => {
    try {
      const orderSequences = new Set();
      session.rawData.forEach(row => {
        if (row.action_type_name && (
          row.action_type_name.includes('提单') || 
          row.action_type_name.includes('下单') || 
          row.action_type_name.includes('订单')
        ) && row.sequence) {
          orderSequences.add(row.sequence);
        }
      });

      if (orderSequences.size === 0) return '无';

      // 收集这些sequence对应的actual_price和商品数量
      const prices = [];
      const productCount = new Set();
      
      session.rawData.forEach(row => {
        if (orderSequences.has(row.sequence)) {
          if (row.actual_price && !isNaN(parseFloat(row.actual_price))) {
            prices.push(parseFloat(row.actual_price));
          }
          if (row.name) {
            productCount.add(row.name);
          }
        }
      });

      if (prices.length > 0 && productCount.size > 0) {
        const totalPrice = prices.reduce((sum, price) => sum + price, 0);
        const averagePrice = totalPrice / productCount.size;
        return `¥${averagePrice.toFixed(2)}`;
      }
      
      return '无';
    } catch (error) {
      return '计算错误';
    }
  };

  // 3. 获取下单商品 - 关联查询该提单sequence前十列加购和点击sequence对应的name字段内容
  const getOrderProducts = () => {
    try {
      const orderSequences = new Set();
      session.rawData.forEach(row => {
        if (row.action_type_name && (
          row.action_type_name.includes('提单') || 
          row.action_type_name.includes('下单') || 
          row.action_type_name.includes('订单')
        ) && row.sequence) {
          orderSequences.add(row.sequence);
        }
      });

      if (orderSequences.size === 0) return '无';

      // 获取所有加购和点击sequence
      const addToCartSequences = new Set();
      const clickSequences = new Set();
      
      session.rawData.forEach(row => {
        if (row.action_type_name && row.sequence) {
          if (row.action_type_name.includes('加购')) {
            addToCartSequences.add(row.sequence);
          }
          if (row.action_type_name.includes('点击')) {
            clickSequences.add(row.sequence);
          }
        }
      });

      // 合并加购和点击sequence
      const allRelevantSequences = new Set([...addToCartSequences, ...clickSequences]);
      
      // 找到提单sequence前十列相关sequence对应的商品名称
      const orderProducts = [];
      const sortedSequences = Array.from(allRelevantSequences).sort((a, b) => a - b);
      
      orderSequences.forEach(orderSeq => {
        const relevantSequences = sortedSequences.filter(seq => seq < orderSeq).slice(-10);
        relevantSequences.forEach(seq => {
          session.rawData.forEach(row => {
            if (row.sequence === seq && row.name) {
              orderProducts.push(row.name);
            }
          });
        });
      });

      // 去重商品名称
      const uniqueOrderProducts = [...new Set(orderProducts)];
      
      if (uniqueOrderProducts.length === 0) return '无';
      
      // 完整展示所有商品名称（不做截断或折叠处理）
      return uniqueOrderProducts.join('、');
    } catch (error) {
      return '加载超时';
    }
  };

  const orderCompletion = checkOrderCompletion();
  const averagePrice = calculateAveragePrice();
  const orderProducts = getOrderProducts();

  const handleProductsUpdate = (products) => {
    setAiExtractedProducts(products);
  };

  // 计算访问店铺数量，每次计算时都减1
  const getStoreCount = () => {
    const uniqueStores = [...new Set(session.rawData.filter(row => row.wm_poi_id).map(row => row.wm_poi_id))];
    const actualCount = uniqueStores.length;
    return Math.max(0, actualCount - 1); // 确保不会出现负数
  };

  return (
    <Card className="bg-[#F5F7FA] shadow-sm">
      <CardContent className="p-2">
        {/* 第一行：四个字段横向排列 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* 会话时长 */}
          <div className="flex flex-col gap-1 p-2">
            <div className="text-sm text-[#333] font-medium">会话时长</div>
            <div className="text-lg text-[#333] font-semibold">{session.duration}</div>
          </div>

          {/* 访问店铺 */}
          <div className="flex flex-col gap-1 p-2">
            <div className="text-sm text-[#333] font-medium">访问店铺</div>
            <div className="text-lg text-[#333] font-semibold">
              {getStoreCount()}
            </div>
          </div>

          {/* 是否完成下单 */}
          <div className="flex flex-col gap-1 p-2">
            <div className="text-sm text-[#333] font-medium">是否完成下单</div>
            <div className={`text-lg font-semibold ${
              orderCompletion === '是' ? 'text-green-600' : 
              orderCompletion === '否' ? 'text-[#333]' : 
              'text-red-600'
            }`}>
              {orderCompletion}
            </div>
          </div>

          {/* 单均价 */}
          <div className="flex flex-col gap-1 p-2">
            <div className="text-sm text-[#333] font-medium">单均价</div>
            <div className={`text-lg font-semibold ${
              averagePrice === '计算错误' ? 'text-red-600' : 'text-[#333]'
            }`}>
              {averagePrice}
            </div>
          </div>
        </div>

        {/* 第二行：AI智能识别下单商品组件 - 自动生成 */}
        <div className="border-t border-gray-200 pt-3 mt-4">
          <OrderProductExtractor 
            session={session} 
            onProductsUpdate={handleProductsUpdate}
            autoGenerate={true}
          />
        </div>

        {/* 响应式样式 */}
        <style jsx>{`
          @media (max-width: 768px) {
            .grid-cols-2.md\\:grid-cols-4 {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.5rem;
            }
            .grid-cols-2.md\\:grid-cols-4 > div:nth-child(3),
            .grid-cols-2.md\\:grid-cols-4 > div:nth-child(4) {
              grid-column: span 1;
            }
          }
          @media (max-width: 640px) {
            .grid-cols-2.md\\:grid-cols-4 {
              grid-template-columns: 1fr;
            }
            .grid-cols-2.md\\:grid-cols-4 > div {
              grid-column: span 1;
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
};

export default OrderStats;
