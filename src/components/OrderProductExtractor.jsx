import { useState, useEffect } from 'react';
import { Brain, Loader2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { analyzeSession, AnalysisKind } from '@/analysis';

const OrderProductExtractor = ({ session, onProductsUpdate, autoGenerate = false }) => {
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 当autoGenerate为true时自动开始生成
  useEffect(() => {
    if (autoGenerate && !products && !loading) {
      extractOrderProducts();
    }
  }, [autoGenerate, products, loading]);

  const extractOrderProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // 下单商品识别的提示词在 @/analysis/kinds/orderProducts.js
      const content = await analyzeSession(session, AnalysisKind.ORDER_PRODUCTS);
      setProducts(content);
      onProductsUpdate(content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">AI智能识别</span>
        </div>
        {!products && !loading && !autoGenerate && (
          <Button 
            size="sm" 
            onClick={extractOrderProducts}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Brain className="h-3 w-3 mr-1" />
            识别商品
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">正在分析用户行为，智能识别下单商品...</span>
        </div>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800 text-sm">
            识别失败: {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={extractOrderProducts}
              className="ml-2"
            >
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {products && (
        <div className="space-y-2">
          <div className="text-sm text-blue-700">
            <span className="font-medium">AI识别结果:</span>
          </div>
          <div className="text-sm text-blue-800 bg-white p-2 rounded border">
            {products}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={extractOrderProducts}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Brain className="h-3 w-3 mr-1" />
            重新识别
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderProductExtractor;
