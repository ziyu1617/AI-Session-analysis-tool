
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TooltipButton from '@/components/TooltipButton';

const SessionFilter = ({ onFilterChange, currentFilter, totalSessions, abnormalSessions }) => {
  const filterOptions = [
    { key: 'all', label: '全部会话', count: totalSessions },
    { key: 'normal', label: '正常会话', count: totalSessions - abnormalSessions },
    { 
      key: 'abnormal', 
      label: '暂时无法使用', 
      count: abnormalSessions,
      tooltip: '该会话超出最大700条事件范围，由于AI上下文限制，因此暂时无法解析'
    }
  ];

  return (
    <div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow-sm border">
      <Filter className="h-4 w-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">筛选：</span>
      <div className="flex gap-2">
        {filterOptions.map((option) => {
          if (option.tooltip) {
            return (
              <TooltipButton
                key={option.key}
                tooltipContent={option.tooltip}
                className={`flex items-center gap-2 ${
                  currentFilter === option.key 
                    ? "justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3" 
                    : "justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                }`}
                onClick={() => onFilterChange(option.key)}
              >
                {option.label}
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-gray-100 text-gray-800"
                >
                  {option.count}
                </Badge>
              </TooltipButton>
            );
          }
          
          return (
            <Button
              key={option.key}
              variant={currentFilter === option.key ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(option.key)}
              className="flex items-center gap-2"
            >
              {option.label}
              <Badge 
                variant="secondary" 
                className="text-xs bg-gray-100 text-gray-600"
              >
                {option.count}
              </Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default SessionFilter;

