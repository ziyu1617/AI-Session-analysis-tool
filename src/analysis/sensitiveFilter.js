/**
 * 敏感表述过滤。
 *
 * 只在「会话概况分析」的输出上生效 —— 另外两种分析不过滤。
 * 从 SessionSummary.jsx 原样迁出，逻辑未作改动。
 */

const SENSITIVE_KEYWORDS = [
  '用户价格敏感',
  '价格敏感',
  '优惠敏感',
  '受到品牌信任度驱使',
  '品牌信任度驱使',
  '品牌信任度',
];

/**
 * 逐句剔除含敏感表述的句子，保留段落结构。
 *
 * @param {string} content 模型原始输出
 * @returns {string} 过滤后的文本
 */
export function filterSensitiveContent(content) {
  if (!content) return content;

  // 按行分割内容
  const lines = content.split('\n');
  const filteredLines = lines.map((line) => {
    if (!line.trim()) return line;

    // 按句号、感叹号、问号分割句子
    const parts = line.split(/([。！？])/);
    let filteredLine = '';

    for (let i = 0; i < parts.length; i += 2) {
      const sentence = parts[i];
      const punctuation = parts[i + 1] || '';

      if (sentence && sentence.trim()) {
        // 检查句子是否包含敏感词汇
        const containsSensitive = SENSITIVE_KEYWORDS.some((keyword) =>
          sentence.includes(keyword)
        );

        // 如果不包含敏感词汇，保留该句子
        if (!containsSensitive) {
          filteredLine += sentence + punctuation;
        }
      } else if (punctuation) {
        filteredLine += punctuation;
      }
    }

    return filteredLine;
  });

  // 过滤空行，但保留段落间的空行
  return filteredLines
    .filter((line, index) => {
      return (
        line.trim() ||
        (index > 0 &&
          index < filteredLines.length - 1 &&
          filteredLines[index - 1].trim() &&
          filteredLines[index + 1].trim())
      );
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // 将多个连续空行替换为最多两个空行
}
