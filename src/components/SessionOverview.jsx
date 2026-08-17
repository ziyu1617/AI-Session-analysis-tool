import OrderStats from '@/components/OrderStats';
import { useEffect, useState } from 'react';
import SessionSummary from '@/components/SessionSummary';
import ActionTypeStats from '@/components/ActionTypeStats';
import PageVisitStats from '@/components/PageVisitStats';

const SessionOverview = ({ session, cachedSummary, onSummaryUpdate }) => {
  const [summaryGenerated, setSummaryGenerated] = useState(false);

  // 当组件挂载时，如果有缓存的概况就不自动生成，否则自动开始生成
  useEffect(() => {
    if (!cachedSummary && !summaryGenerated) {
      setSummaryGenerated(true);
    }
  }, [cachedSummary, summaryGenerated]);

  return (
    <div className="space-y-6">
      {/* 会话概况模块 - 包含会话时长、访问店铺等关键数据指标 */}
      <OrderStats session={session} />

      {/* 会话概况分析 - 移动到AI智能识别结果区域正下方 */}
      <SessionSummary 
        session={session} 
        autoGenerate={summaryGenerated}
        cachedSummary={cachedSummary}
        onSummaryUpdate={onSummaryUpdate}
      />

      {/* 关键行为指标 */}
      <ActionTypeStats session={session} />

      {/* 页面访问统计 */}
      <PageVisitStats session={session} />
    </div>
  );
};

export default SessionOverview;
