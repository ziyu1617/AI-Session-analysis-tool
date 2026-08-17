import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin } from 'lucide-react';

const BasicStats = ({ session, searchActions, storeVisits }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">会话时长</p>
              <p className="text-xl font-bold">{session.duration}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">访问店铺</p>
              <p className="text-xl font-bold">{storeVisits}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicStats;
