import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AbnormalSessionBadge = ({ isAbnormal, className = "" }) => {
  if (!isAbnormal) return null;

  return null; // 删除异常气泡，直接返回null
};

export default AbnormalSessionBadge;
