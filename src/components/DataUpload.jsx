import * as XLSX from 'xlsx';
import { CardContent, CardHeader, CardDescription, Card, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { AlertDescription, Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
const DataUpload = ({ onDataUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);

  const processData = (data) => {
    // 按session_id分组数据
    const sessionGroups = {};
    
    data.forEach(row => {
      const sessionId = row.session_id;
      if (!sessionId) return;
      
      if (!sessionGroups[sessionId]) {
        sessionGroups[sessionId] = {
          sessionId,
          startTime: row.fmt_time2,
          endTime: row.fmt_time2,
          totalActions: 0,
          pages: new Set(),
          events: [],
          rawData: []
        };
      }
      
      const session = sessionGroups[sessionId];
      session.totalActions++;
      session.pages.add(row.page_name);
      session.rawData.push(row);
      
      // 更新时间范围 - 使用fmt_time2字段
      if (row.fmt_time2 < session.startTime) {
        session.startTime = row.fmt_time2;
      }
      if (row.fmt_time2 > session.endTime) {
        session.endTime = row.fmt_time2;
      }
      
      // 添加关键事件 - 包含完整的用户访问行为字段
      if (row.event_name && row.event_name !== '') {
        session.events.push({
          time: row.fmt_time2,
          page_id: row.page_id,
          page_name: row.page_name,
          event_type: row.event_type,
          event_id: row.event_id,
          event_name: row.event_name,
          element_name: row.element_name,
          module_name: row.module_name,
          action_type_id: row.action_type_id,
          action_type_name: row.action_type_name,
          page_stay_time: row.page_stay_time,
          item_index: row.item_index,
          poi_id: row.poi_id,
          spu_id: row.spu_id,
          sku_id: row.sku_id,
          content_id: row.content_id,
          icon_code: row.icon_code,
          delivery_time: row.delivery_time,
          search_type: row.search_type,
          search_word: row.search_word,
          search_stid: row.search_stid,
          input_word: row.input_word,
          activity_id: row.activity_id,
          cat_id: row.cat_id,
          ad_type: row.ad_type,
          original_price: row.original_price,
          actual_price: row.actual_price,
          takedlvr_second_city_id: row.takedlvr_second_city_id,
          is_first_poi_pur: row.is_first_poi_pur,
          entry_id_list: row.entry_id_list,
          wm_order_id: row.wm_order_id,
          order_id: row.order_id,
          table_id: row.table_id,
          wm_poi_id: row.wm_poi_id,
          wm_poi_name: row.wm_poi_name,
          primary_first_tag_name: row.primary_first_tag_name,
          primary_second_tag_name: row.primary_second_tag_name,
          primary_third_tag_name: row.primary_third_tag_name,
          id: row.id,
          name: row.name,
          prod_first_category_name: row.prod_first_category_name,
          prod_second_category_name: row.prod_second_category_name,
          prod_third_category_name: row.prod_third_category_name,
          prod_four_category_name: row.prod_four_category_name
        });
      }
    });

    // 转换为数组并排序
    const sessions = Object.values(sessionGroups).map(session => ({
      ...session,
      pages: Array.from(session.pages),
      duration: calculateDuration(session.startTime, session.endTime),
      events: session.events.sort((a, b) => new Date(a.time) - new Date(b.time))
    })).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return sessions;
  };

  const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}分${diffSecs}秒`;
  };

  const parseFile = (file) => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error('CSV解析错误: ' + results.errors[0].message));
            } else {
              resolve(results.data);
            }
          },
          error: (error) => reject(error)
        });
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          } catch (error) {
            reject(new Error('Excel文件解析失败'));
          }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('不支持的文件格式，请上传CSV或Excel文件'));
      }
    });
  };

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);
    setFileInfo({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type
    });

    try {
      const data = await parseFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('文件为空或无有效数据');
      }

      // 验证必要字段
      const requiredFields = ['session_id', 'fmt_time2'];
      const firstRow = data[0];
      const missingFields = requiredFields.filter(field => !(field in firstRow));
      
      if (missingFields.length > 0) {
        throw new Error(`缺少必要字段: ${missingFields.join(', ')}`);
      }

      const sessions = processData(data);
      
      setUploadStatus({
        type: 'success',
        message: `成功上传 ${data.length} 条记录，识别到 ${sessions.length} 个用户会话`
      });

      // 延迟一下让用户看到成功消息
      setTimeout(() => {
        onDataUploaded(data, sessions);
      }, 1500);

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto bg-white shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="h-6 w-6" />
          数据上传
        </CardTitle>
        <CardDescription>
          上传用户行为数据文件进行分析（支持CSV、Excel格式）
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <div className="space-y-4">
            <FileText className="h-16 w-16 text-gray-400 mx-auto" />
            
            {!uploading && !uploadStatus && (
              <>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    拖拽文件到此处或点击上传
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    支持 CSV、Excel (.xlsx, .xls) 格式
                  </p>
                </div>
                
                <Button variant="outline" className="mt-4">
                  选择文件
                </Button>
              </>
            )}
            
            {uploading && (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600">正在处理文件...</p>
                {fileInfo && (
                  <p className="text-sm text-gray-500">
                    {fileInfo.name} ({fileInfo.size})
                  </p>
                )}
              </div>
            )}
            
            {uploadStatus && (
              <Alert className={uploadStatus.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {uploadStatus.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {uploadStatus.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p className="font-medium mb-2">上传说明</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <a
                href="https://ycnfqpcp6v90.feishu.cn/wiki/Ywsaw8HM4iyc3PkeiE4ceoMdned"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                AI session 分析-说明文档SOP
              </a>
            </li>
            <li>文件大小不超过 50MB</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataUpload;
