import { useState } from 'react';
import {
  AlertTriangle,
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Camera,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { useAppStore } from '@/store';
import type { AnomalyType, AnomalyStatus, AnomalyReport } from '@/types';
import {
  ANOMALY_TYPE_LABELS,
  ANOMALY_STATUS_LABELS,
  ANOMALY_STATUS_COLORS,
  TASK_TYPE_LABELS,
} from '@/types';
import { formatDateTime, showToast, speak, cn } from '@/utils';

type Tab = 'list' | 'report';

export default function Anomaly() {
  const { tasks, anomalyReports, createAnomalyReport, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<AnomalyStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [anomalyType, setAnomalyType] = useState<AnomalyType>('suspicious_fraud');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const filteredReports = anomalyReports.filter((report) => {
    const task = tasks.find((t) => t.id === report.taskId);
    const matchesSearch =
      task?.person.name.includes(searchText) ||
      task?.person.idCard.includes(searchText) ||
      report.description.includes(searchText);
    const matchesStatus =
      statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async () => {
    if (!selectedTaskId) {
      showToast('请选择关联的核验任务');
      return;
    }
    if (!description.trim()) {
      showToast('请输入异常情况描述');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAnomalyReport({
        recordId: '',
        taskId: selectedTaskId,
        type: anomalyType,
        description,
      });

      speak('异常线索已上报');
      showToast('异常线索已成功上报');

      setAnomalyType('suspicious_fraud');
      setSelectedTaskId('');
      setDescription('');
      setActiveTab('list');
    } catch (error) {
      console.error('Submit error:', error);
      showToast('上报失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopBar title="异常上报" />

      <main className="pt-18 pb-22 px-6 h-screen overflow-y-auto">
        <div className="py-4">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('list')}
              className={cn(
                'flex-1 py-4 px-6 rounded-xl text-xl font-bold transition-all',
                activeTab === 'list'
                  ? 'bg-primary-600 text-white shadow-button'
                  : 'bg-white text-neutral-600 border-2 border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <FileText size={24} className="inline mr-2" />
              线索列表
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={cn(
                'flex-1 py-4 px-6 rounded-xl text-xl font-bold transition-all',
                activeTab === 'report'
                  ? 'bg-primary-600 text-white shadow-button'
                  : 'bg-white text-neutral-600 border-2 border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <Send size={24} className="inline mr-2" />
              上报线索
            </button>
          </div>

          {activeTab === 'list' && (
            <>
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search
                    size={24}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜索姓名、身份证号..."
                    className="input-large pl-14 text-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    'px-6 py-3 rounded-xl text-lg font-bold whitespace-nowrap transition-all',
                    statusFilter === 'all'
                      ? 'bg-primary-600 text-white shadow-button'
                      : 'bg-white text-neutral-600 border-2 border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  全部 ({anomalyReports.length})
                </button>
                {(['pending', 'processing', 'resolved', 'rejected'] as AnomalyStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        'px-6 py-3 rounded-xl text-lg font-bold whitespace-nowrap transition-all',
                        statusFilter === status
                          ? 'bg-primary-600 text-white shadow-button'
                          : 'bg-white text-neutral-600 border-2 border-neutral-200 hover:bg-neutral-50'
                      )}
                    >
                      {ANOMALY_STATUS_LABELS[status]} (
                      {anomalyReports.filter((r) => r.status === status).length})
                    </button>
                  )
                )}
              </div>

              {filteredReports.length === 0 ? (
                <div className="card text-center py-16">
                  <AlertTriangle size={64} className="mx-auto text-neutral-300 mb-4" />
                  <p className="text-xl text-neutral-500">暂无异常线索</p>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const task = tasks.find((t) => t.id === report.taskId);
                  const isExpanded = expandedId === report.id;

                  return (
                    <div key={report.id} className="card mb-4">
                      <div
                        onClick={() => toggleExpand(report.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
                              <AlertTriangle size={24} className="text-danger-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-neutral-800">
                                {task?.person.name || '未知人员'}
                              </h3>
                              <p className="text-base text-neutral-500">
                                {task ? TASK_TYPE_LABELS[task.type] : ''} ·{' '}
                                {ANOMALY_TYPE_LABELS[report.type]}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'px-4 py-1 rounded-lg text-base font-bold',
                                ANOMALY_STATUS_COLORS[report.status]
                              )}
                            >
                              {ANOMALY_STATUS_LABELS[report.status]}
                            </span>
                            {isExpanded ? (
                              <ChevronUp size={24} className="text-neutral-400" />
                            ) : (
                              <ChevronDown size={24} className="text-neutral-400" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-base text-neutral-500">
                          <Clock size={18} />
                          <span>{formatDateTime(report.reportTime)}</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
                          <div>
                            <h4 className="text-lg font-bold text-neutral-700 mb-2 flex items-center gap-2">
                              <MessageSquare size={20} className="text-primary-600" />
                              异常描述
                            </h4>
                            <p className="text-lg text-neutral-600 bg-neutral-50 p-4 rounded-xl">
                              {report.description}
                            </p>
                          </div>

                          {report.feedback && (
                            <div>
                              <h4 className="text-lg font-bold text-neutral-700 mb-2 flex items-center gap-2">
                                <CheckCircle size={20} className="text-success-600" />
                                处理反馈
                              </h4>
                              <p className="text-lg text-neutral-600 bg-success-50 p-4 rounded-xl">
                                {report.feedback}
                              </p>
                            </div>
                          )}

                          {!report.feedback && (
                            <div className="flex items-center gap-2 text-warning-600 bg-warning-50 p-4 rounded-xl">
                              <Clock size={20} />
                              <span className="text-lg font-bold">
                                正在处理中，请耐心等待
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'report' && (
            <div className="card">
              <h3 className="text-2xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                <AlertTriangle size={28} className="text-danger-500" />
                上报异常线索
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="label-large">异常类型</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(ANOMALY_TYPE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setAnomalyType(key as AnomalyType)}
                        className={cn(
                          'p-5 rounded-xl border-3 text-left transition-all',
                          anomalyType === key
                            ? 'bg-danger-50 border-danger-400 text-danger-700'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                        )}
                      >
                        <span className="text-lg font-bold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-large">关联核验任务</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="input-large"
                  >
                    <option value="">请选择核验任务</option>
                    {completedTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.person.name} - {TASK_TYPE_LABELS[task.type]} -{' '}
                        {task.person.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-large">异常情况描述</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请详细描述发现的异常情况，包括时间、地点、具体表现等..."
                    className="input-large min-h-[160px] resize-none"
                  />
                  <p className="text-base text-neutral-400 mt-2">
                    已输入 {description.length} 字
                  </p>
                </div>

                <div className="p-4 bg-warning-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={24} className="text-warning-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-lg font-bold text-warning-700 mb-1">
                        重要提示
                      </p>
                      <p className="text-base text-warning-600">
                        请如实填报异常线索，对疑似冒领套领等违法行为，将依法依规处理。
                        填报信息将作为调查处理的重要依据。
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full btn-danger text-xl py-5',
                    isSubmitting && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send size={28} />
                      提交异常线索
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
