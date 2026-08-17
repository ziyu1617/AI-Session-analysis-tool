import { useState } from 'react';
import { Upload, FileText, BarChart3, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DataUpload from '@/components/DataUpload';
import SessionList from '@/components/SessionList';

const Index = () => {
  const [currentStep, setCurrentStep] = useState('upload');
  const [uploadedData, setUploadedData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionCache, setSessionCache] = useState({});

  const handleDataUploaded = (data, processedSessions) => {
    setUploadedData(data);
    setSessions(processedSessions);
    setCurrentStep('sessions');
    // 清除之前的缓存数据
    setSessionCache({});
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setUploadedData(null);
    setSessions([]);
    // 清除所有缓存数据
    setSessionCache({});
  };

  const handleSessionCacheUpdate = (sessionId, type, data) => {
    setSessionCache(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [type]: data
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">用户行为分析系统</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            专业的用户行为路径分析工具，深度洞察用户意图与体验
          </p>
        </div>

        {/* 功能概览 */}
        {currentStep === 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <CardTitle>数据上传</CardTitle>
                <CardDescription>
                  支持CSV/Excel格式的用户行为数据上传
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <CardTitle>会话分析</CardTitle>
                <CardDescription>
                  按Session ID分组分析用户行为路径
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                <CardTitle>深度洞察</CardTitle>
                <CardDescription>
                  AI驱动的用户意图分析和体验评估
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* 主要内容 */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 'upload' && (
            <DataUpload onDataUploaded={handleDataUploaded} />
          )}
          
          {currentStep === 'sessions' && (
            <SessionList 
              sessions={sessions} 
              onBackToUpload={handleBackToUpload}
              sessionCache={sessionCache}
              onSessionCacheUpdate={handleSessionCacheUpdate}
            />
          )}
        </div>

        {/* 页脚 */}
        <div className="text-center mt-12 text-gray-500">
          <p className="">© 用户行为分析系统 - 专业的数据洞察工具</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
