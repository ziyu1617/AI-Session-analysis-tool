
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const TooltipButton = ({ 
  children, 
  tooltipContent, 
  className = "", 
  disabled = false,
  ...props 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动设备
  const checkMobile = () => {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  };

  const handleMouseEnter = () => {
    if (!checkMobile()) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!checkMobile()) {
      setShowTooltip(false);
    }
  };

  const handleClick = (e) => {
    if (checkMobile()) {
      e.preventDefault();
      setShowTooltip(!showTooltip);
      // 移动端点击后3秒自动隐藏
      setTimeout(() => setShowTooltip(false), 3000);
    }
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        {...props}
        className={className}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </Button>
      
      {showTooltip && tooltipContent && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-white text-gray-800 text-sm px-3 py-2 rounded-lg shadow-lg border border-gray-200 max-w-xs whitespace-normal">
            <div className="text-center leading-relaxed">
              {tooltipContent}
            </div>
            {/* 箭头 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TooltipButton;

