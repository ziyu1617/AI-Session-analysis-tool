
// 判断会话是否异常（操作数量超过700次）
export const isSessionAbnormal = (session) => {
  return session.totalActions > 700; // 超过700次操作视为异常
};

// 获取会话时长（秒）
export const getSessionDurationInSeconds = (session) => {
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  const durationMs = endTime - startTime;
  return Math.floor(durationMs / 1000);
};

// 格式化时长显示
export const formatDuration = (durationSeconds) => {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  
  if (hours > 0) {
    return `${hours}小时${minutes}分${seconds}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  } else {
    return `${seconds}秒`;
  }
};

