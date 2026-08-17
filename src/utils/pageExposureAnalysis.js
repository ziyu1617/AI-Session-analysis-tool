// 页面曝光时长分析工具函数
export const analyzePageExposureTime = (rawData) => {
  // 按时间排序原始数据
  const sortedData = [...rawData].sort((a, b) => 
    new Date(a.fmt_time2) - new Date(b.fmt_time2)
  );

  if (sortedData.length === 0) {
    return { pageExposureTimes: {}, totalAnalyzedEvents: 0 };
  }

  // 识别所有有效的点击事件（排除加购、点击、提单事件）
  const isExcludedEventType = (actionTypeName) => {
    if (!actionTypeName || typeof actionTypeName !== 'string') return false;
    const actionType = actionTypeName.toLowerCase();
    return actionType.includes('加购') || 
           actionType.includes('点击') || 
           actionType.includes('提单') ||
           actionType.includes('下单') ||
           actionType.includes('订单');
  };

  const validClickEvents = sortedData.filter(row => {
    return row.action_type_name && 
           !isExcludedEventType(row.action_type_name) &&
           row.action_type_name.trim() !== '' &&
           row.action_type_name !== 'page_view' &&
           row.action_type_name !== '页面浏览';
  });

  const pageExposureTimes = {};
  let totalAnalyzedEvents = 0;

  if (validClickEvents.length === 0) {
    // 如果没有有效的点击事件，将整个会话时长分配给所有浏览的页面
    const sessionStartTime = new Date(sortedData[0].fmt_time2);
    const sessionEndTime = new Date(sortedData[sortedData.length - 1].fmt_time2);
    const totalSessionTime = Math.max(1, Math.floor((sessionEndTime - sessionStartTime) / 1000));

    const uniquePages = [...new Set(sortedData
      .filter(row => row.page_name && row.page_name.trim() && row.page_name.toLowerCase() !== 'null')
      .map(row => row.page_name))];

    uniquePages.forEach(page => {
      pageExposureTimes[page] = Math.max(1, Math.floor(totalSessionTime / uniquePages.length));
    });

    totalAnalyzedEvents = sortedData.length;
  } else {
    // 处理点击事件之间的浏览行为时长
    for (let i = 0; i <= validClickEvents.length; i++) {
      let startTime, endTime;
      
      if (i === 0) {
        // 第一个点击事件之前的浏览行为
        startTime = new Date(sortedData[0].fmt_time2);
        endTime = new Date(validClickEvents[0].fmt_time2);
      } else if (i === validClickEvents.length) {
        // 最后一个点击事件之后的浏览行为
        startTime = new Date(validClickEvents[i - 1].fmt_time2);
        endTime = new Date(sortedData[sortedData.length - 1].fmt_time2);
      } else {
        // 两个点击事件之间的浏览行为
        startTime = new Date(validClickEvents[i - 1].fmt_time2);
        endTime = new Date(validClickEvents[i].fmt_time2);
      }

      // 计算该时间段的总时长（秒）
      const segmentDuration = Math.max(1, Math.floor((endTime - startTime) / 1000));

      // 获取该时间段内的所有浏览事件
      const browsingEventsInSegment = sortedData.filter(row => {
        const rowTime = new Date(row.fmt_time2);
        return rowTime >= startTime && 
               rowTime <= endTime && 
               row.page_name &&
               row.page_name.trim() &&
               row.page_name.toLowerCase() !== 'null' &&
               !isExcludedEventType(row.action_type_name);
      });

      // 获取该时间段内的唯一页面
      const uniquePagesInSegment = [...new Set(browsingEventsInSegment.map(row => row.page_name))];

      if (uniquePagesInSegment.length > 0) {
        // 将时间段时长平均分配给该时间段内的所有唯一页面
        const timePerPage = Math.max(1, Math.floor(segmentDuration / uniquePagesInSegment.length));
        
        uniquePagesInSegment.forEach(page => {
          pageExposureTimes[page] = (pageExposureTimes[page] || 0) + timePerPage;
        });
      }

      totalAnalyzedEvents += browsingEventsInSegment.length;
    }
  }

  return { pageExposureTimes, totalAnalyzedEvents };
};

// 格式化时长显示
export const formatExposureTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    let result = `${hours}小时`;
    if (minutes > 0) result += `${minutes}分`;
    if (remainingSeconds > 0) result += `${remainingSeconds}秒`;
    return result;
  }
};
