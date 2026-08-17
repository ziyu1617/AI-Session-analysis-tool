
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardContent, CardHeader, CardDescription, Card, CardTitle } from '@/components/ui/card';
import SessionFilter from '@/components/SessionFilter';
import { Eye, ArrowLeft, Search, Clock, MousePointer, ChevronRight } from 'lucide-react';
import SessionDetail from '@/components/SessionDetail';
import { useState } from 'react';
import { isSessionAbnormal } from '@/utils/sessionUtils';
import AbnormalSessionBadge from '@/components/AbnormalSessionBadge';
import { Button } from '@/components/ui/button';
const SessionList = ({ sessions, onBackToUpload, sessionCache, onSessionCacheUpdate }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');

  // 计算异常会话数量
  const abnormalSessionsCount = sessions.filter(session => isSessionAbnormal(session)).length;

  // 根据筛选条件过滤会话
  const getFilteredSessions = () => {
    let filtered = sessions;

    // 应用筛选条件
    if (currentFilter === 'normal') {
      filtered = filtered.filter(session => !isSessionAbnormal(session));
    } else if (currentFilter === 'abnormal') {
      filtered = filtered.filter(session => isSessionAbnormal(session));
    }

    // 应用搜索条件
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(session => {
        const sessionIdStr = String(session.sessionId).toLowerCase();
        return sessionIdStr.includes(searchLower) ||
          session.pages.some(page => page.toLowerCase().includes(searchLower));
      });
    }

    return filtered;
  };

  const filteredSessions = getFilteredSessions();

  // 计算当前筛选结果的平均时长
  const calculateAverageDuration = (sessionList) => {
    if (!sessionList || sessionList.length === 0) {
      return 0;
    }

    try {
      const totalDurationMs = sessionList.reduce((sum, session) => {
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        const duration = endTime - startTime;
        return sum + duration;
      }, 0);

      const averageDurationMinutes = totalDurationMs / sessionList.length / 60000;
      return Math.round(averageDurationMinutes);
    } catch (error) {
      console.error('计算平均时长时出错:', error);
      return 0;
    }
  };

  // 计算当前筛选结果的统计数据
  const getFilteredStats = () => {
    const currentSessions = filteredSessions;
    
    return {
      totalSessions: currentSessions.length,
      totalActions: currentSessions.reduce((sum, s) => sum + s.totalActions, 0),
      averageDuration: calculateAverageDuration(currentSessions),
      averagePages: currentSessions.length > 0 
        ? Math.round(currentSessions.reduce((sum, s) => sum + s.pages.length, 0) / currentSessions.length)
        : 0
    };
  };

  const stats = getFilteredStats();

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
  };

  const handleBackToList = () => {
    setSelectedSession(null);
  };

  const handleCacheUpdate = (type, data) => {
    if (selectedSession) {
      onSessionCacheUpdate(selectedSession.sessionId, type, data);
    }
  };

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
  };

  if (selectedSession) {
    return (
      <SessionDetail 
        session={selectedSession} 
        onBack={handleBackToList}
        cachedData={sessionCache[selectedSession.sessionId] || {}}
        onCacheUpdate={handleCacheUpdate}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={onBackToUpload}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回上传
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">用户会话列表</h2>
            <p className="text-gray-600">
              共发现 {sessions.length} 个用户会话
              {abnormalSessionsCount > 0 && (
                <span className="ml-2 text-gray-600">
                  （其中 {abnormalSessionsCount} 个异常会话）
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <SessionFilter 
        onFilterChange={handleFilterChange}
        currentFilter={currentFilter}
        totalSessions={sessions.length}
        abnormalSessions={abnormalSessionsCount}
      />

      {/* 搜索 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="搜索会话ID或页面名称..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 统计数据 - 基于当前筛选结果动态计算 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {currentFilter === 'all' ? '总会话数' : 
                   currentFilter === 'normal' ? '正常会话数' : 
                   '异常会话数'}
                </p>
                <p className="text-xl font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MousePointer className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">总操作数</p>
                <p className="text-xl font-bold">{stats.totalActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  平均时长
                  {currentFilter === 'normal' && (
                    <span className="text-xs text-green-600 ml-1">(仅正常会话)</span>
                  )}
                  {currentFilter === 'abnormal' && (
                    <span className="text-xs text-yellow-600 ml-1">(仅异常会话)</span>
                  )}
                </p>
                <p className="text-xl font-bold">
                  {stats.averageDuration > 0 ? `${stats.averageDuration}分钟` : '无数据'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChevronRight className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">平均页面数</p>
                <p className="text-xl font-bold">
                  {stats.averagePages > 0 ? stats.averagePages : '无数据'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 会话列表 */}
      <div className="grid gap-4">
        {filteredSessions.map((session) => {
          const isAbnormal = isSessionAbnormal(session);
          
          return (
            <Card 
              key={session.sessionId} 
              className={`cursor-pointer hover:shadow-md transition-shadow bg-white ${
                isAbnormal ? 'border-l-4 border-l-gray-500' : ''
              }`}
              onClick={() => handleSessionSelect(session)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        会话 {session.sessionId}
                      </h3>
                      <Badge variant="secondary">
                        {session.totalActions} 次操作
                      </Badge>
                      
                      {/* 异常会话标识 */}
                      <AbnormalSessionBadge 
                        isAbnormal={isAbnormal}
                        className="sm:text-xs md:text-sm"
                      />
                      
                      {/* 显示缓存状态 */}
                      {sessionCache[session.sessionId]?.summary && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          已生成概况
                        </Badge>
                      )}
                      {sessionCache[session.sessionId]?.analysis && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          已生成洞察
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>时长: {session.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>页面: {session.pages.length} 个</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MousePointer className="h-4 w-4" />
                        <span>事件: {session.events.length} 个</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-1">访问页面:</p>
                      <div className="flex flex-wrap gap-1">
                        {session.pages
                          .filter(page => page && page.toLowerCase() !== 'null')
                          .map((page, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {page}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-400">
                      {session.startTime} - {session.endTime}
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSessions.length === 0 && (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              {searchTerm ? '没有找到匹配的会话' : '当前筛选条件下没有会话'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionList;
