import CopyButton from '@/components/CopyButton';
import { CardContent, CardHeader, CardDescription, Card, CardTitle } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AlertDescription, Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { analyzeSession, AnalysisKind } from '@/analysis';

const SessionSummary = ({ session, autoGenerate = false, cachedSummary, onSummaryUpdate }) => {
  const [summary, setSummary] = useState(cachedSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 当autoGenerate为true且没有缓存时自动开始生成
  useEffect(() => {
    if (cachedSummary) {
      setSummary(cachedSummary);
    } else if (autoGenerate && !summary && !loading) {
      generateSummary();
    }
  }, [autoGenerate, cachedSummary, summary, loading]);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      // 提示词与敏感表述过滤都在 @/analysis 内部，此处只关心「要哪种分析」
      const content = await analyzeSession(session, AnalysisKind.SUMMARY);
      setSummary(content);
      // 更新缓存
      onSummaryUpdate(content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>会话概况分析</CardTitle>
          </div>
          {summary && (
            <CopyButton 
              text={summary} 
              className="ml-auto"
            />
          )}
        </div>
        <CardDescription>
          基于用户完整行为路径的会话概况分析，深度解读用户决策旅程和行为模式（所有统计已去重），包含页面曝光浏览时长分析
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!summary && !loading && (
          <div className="text-center py-8">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">点击生成会话概况分析，获取专业的用户行为分析</p>
            <Button onClick={generateSummary} className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              生成会话概况分析
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">正在生成会话概况分析...</p>
            <p className="text-sm text-gray-500 mt-2">正在分析用户行为路径和决策过程（已去重统计），包含页面曝光时长分析</p>
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-1">生成失败</div>
              <div className="text-sm">{error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateSummary}
                className="mt-2"
              >
                重试生成
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {summary && (
          <div className="max-w-none">
            <div 
              className="whitespace-pre-wrap font-normal leading-relaxed text-gray-800"
              style={{ fontSize: '16px', lineHeight: '1.8' }}
            >
              {summary}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={generateSummary}
                className="flex items-center gap-2 hover:bg-gray-50"
              >
                <Brain className="h-4 w-4" />
                重新生成
              </Button>
              <CopyButton 
                text={summary} 
                className="flex items-center gap-2"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionSummary;
