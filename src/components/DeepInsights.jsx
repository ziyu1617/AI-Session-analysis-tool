
import CopyButton from '@/components/CopyButton';
import { CardContent, CardHeader, CardDescription, Card, CardTitle } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AlertDescription, Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { analyzeSession, AnalysisKind } from '@/analysis';
const DeepInsights = ({ session, cachedAnalysis, onAnalysisUpdate }) => {
  const [analysis, setAnalysis] = useState(cachedAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 当组件挂载时，如果有缓存的分析就使用缓存，否则等待用户点击
  useEffect(() => {
    if (cachedAnalysis) {
      setAnalysis(cachedAnalysis);
    }
  }, [cachedAnalysis]);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      // 深度洞察的提示词在 @/analysis/kinds/insights.js，与另外两种分析互不影响
      const content = await analyzeSession(session, AnalysisKind.INSIGHTS);
      setAnalysis(content);
      // 更新缓存
      onAnalysisUpdate(content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI归因报告 */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <CardTitle>AI归因报告</CardTitle>
            </div>
            {analysis && (
              <CopyButton 
                text={analysis} 
                className="ml-auto"
              />
            )}
          </div>
          <CardDescription>
            基于用户完整行为路径的深度洞察分析，揭示用户决策旅程和行为模式
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysis && !loading && (
            <div className="text-center py-8">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">点击开始AI归因报告，获取专业的用户行为洞察</p>
              <Button onClick={runAnalysis} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Brain className="h-4 w-4" />
                开始生成
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">AI正在深度分析用户行为数据...</p>
              <p className="text-sm text-gray-500 mt-2">正在解读用户决策旅程和行为模式</p>
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                <div className="font-medium mb-1">分析失败</div>
                <div className="text-sm">{error}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runAnalysis}
                  className="mt-2"
                >
                  重试分析
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {analysis && (
            <div className="max-w-none">
              <div 
                className="whitespace-pre-wrap font-normal leading-relaxed text-gray-800 space-y-4"
                style={{ fontSize: '16px', lineHeight: '1.7' }}
              >
                {analysis.split('\n').map((line, index) => {
                  // 处理标题
                  if (line.startsWith('## ')) {
                    return (
                      <h3 key={index} className="text-xl font-semibold mt-8 mb-4 text-gray-900 border-b border-gray-200 pb-2">
                        {line.replace('## ', '')}
                      </h3>
                    );
                  }
                  // 处理子标题
                  if (line.startsWith('### ')) {
                    return (
                      <h4 key={index} className="text-lg font-medium mt-6 mb-3 text-gray-800">
                        {line.replace('### ', '')}
                      </h4>
                    );
                  }
                  // 处理列表项
                  if (line.startsWith('- ')) {
                    return (
                      <div key={index} className="ml-4 mb-2">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{line.replace('- ', '')}</span>
                      </div>
                    );
                  }
                  // 处理粗体文本
                  if (line.includes('**')) {
                    const parts = line.split(/(\*\*.*?\*\*)/);
                    return (
                      <p key={index} className="mb-3 text-gray-700">
                        {parts.map((part, partIndex) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={partIndex} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  }
                  // 处理普通段落
                  if (line.trim()) {
                    return (
                      <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                        {line}
                      </p>
                    );
                  }
                  // 空行
                  return <div key={index} className="h-2"></div>;
                })}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={runAnalysis}
                  className="flex items-center gap-2 hover:bg-gray-50"
                >
                  <Brain className="h-4 w-4" />
                  重新分析
                </Button>
                <CopyButton 
                  text={analysis} 
                  className="flex items-center gap-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeepInsights;
