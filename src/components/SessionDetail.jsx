import { useState } from 'react';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SessionOverview from '@/components/SessionOverview';

const SessionDetail = ({ session, onBack, cachedData, onCacheUpdate }) => {
  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            会话详情 - {session.sessionId}
          </h2>
          <p className="text-gray-600">
            {session.startTime} 至 {session.endTime}
          </p>
        </div>
      </div>

      {/* 会话概况页面 - 移除标签页结构，直接展示内容 */}
      <div className="w-full">
        <SessionOverview 
          session={session} 
          cachedSummary={cachedData?.summary}
          onSummaryUpdate={(summary) => onCacheUpdate('summary', summary)}
        />
      </div>
    </div>
  );
};

export default SessionDetail;
