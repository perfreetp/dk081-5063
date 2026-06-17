import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  Clock,
  CheckCircle,
  FileText,
  User,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Send,
  History,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { useAppStore } from '@/store';
import type { FollowupRecord, Task, VerifyRecord } from '@/types';
import {
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  VERIFY_CONCLUSION_LABELS,
  VERIFY_CONCLUSION_COLORS,
} from '@/types';
import { formatDateTime, showToast, speak, cn, maskIdCard } from '@/utils';

type Tab = 'pending' | 'history';

export default function Followup() {
  const [searchParams] = useSearchParams();
  const taskIdFromQuery = searchParams.get('taskId');

  const {
    tasks,
    verifyRecords,
    followupRecords,
    createFollowupRecord,
    updateTaskStatus,
    user,
    loadTasks,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(taskIdFromQuery);

  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [followupContent, setFollowupContent] = useState('');
  const [followupResult, setFollowupResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const pendingTasks = tasks.filter(
    (t) => t.status === 'followup' || t.status === 'completed'
  );

  const filteredPending = pendingTasks.filter((task) => {
    return (
      task.person.name.includes(searchText) ||
      task.person.idCard.includes(searchText) ||
      task.person.address.includes(searchText)
    );
  });

  const filteredHistory = followupRecords.filter((record) => {
    const task = tasks.find((t) => t.id === record.taskId);
    return (
      task?.person.name.includes(searchText) ||
      task?.person.idCard.includes(searchText) ||
      record.content.includes(searchText)
    );
  });

  const getTaskVerifyRecord = (taskId: string): VerifyRecord | undefined => {
    return verifyRecords.find((r) => r.taskId === taskId);
  };

  const getTaskFollowups = (taskId: string): FollowupRecord[] => {
    return followupRecords.filter((r) => r.taskId === taskId);
  };

  const handleSubmit = async () => {
    if (!selectedTaskId) {
      showToast('请选择回访任务');
      return;
    }
    if (!followupContent.trim()) {
      showToast('请输入回访内容');
      return;
    }
    if (!followupResult.trim()) {
      showToast('请输入回访结果');
      return;
    }

    setIsSubmitting(true);
    try {
      await createFollowupRecord({
        taskId: selectedTaskId,
        followTime: new Date().toISOString(),
        content: followupContent,
        result: followupResult,
        operatorId: user?.id || '',
      });

      const task = tasks.find((t) => t.id === selectedTaskId);
      if (task?.status === 'followup') {
        await updateTaskStatus(selectedTaskId, 'completed');
      }

      speak('回访记录已保存');
      showToast('回访记录已成功保存');

      setSelectedTaskId('');
      setFollowupContent('');
      setFollowupResult('');
      setActiveTab('history');
    } catch (error) {
      console.error('Submit error:', error);
      showToast('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopBar title="回访记录" />

      <main className="pt-18 pb-22 px-6 h-screen overflow-y-auto">
        <div className="py-4">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                'flex-1 py-4 px-6 rounded-xl text-xl font-bold transition-all',
                activeTab === 'pending'
                  ? 'bg-primary-600 text-white shadow-button'
                  : 'bg-white text-neutral-600 border-2 border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <RotateCcw size={24} className="inline mr-2" />
              待回访
              <span className="ml-2 bg-white/20 px-3 py-1 rounded-full text-base">
                {pendingTasks.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex-1 py-4 px-6 rounded-xl text-xl font-bold transition-all',
                activeTab === 'history'
                  ? 'bg-primary-600 text-white shadow-button'
                  : 'bg-white text-neutral-600 border-2 border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <History size={24} className="inline mr-2" />
              历史记录
              <span className="ml-2 bg-white/20 px-3 py-1 rounded-full text-base">
                {followupRecords.length}
              </span>
            </button>
          </div>

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
                placeholder="搜索姓名、身份证号、地址..."
                className="input-large pl-14 text-lg"
              />
            </div>
          </div>

          {activeTab === 'pending' && (
            <>
              <div className="card mb-6">
                <h3 className="text-2xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                  <RotateCcw size={28} className="text-primary-600" />
                  登记回访
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="label-large">选择回访对象</label>
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="input-large"
                    >
                      <option value="">请选择回访对象</option>
                      {pendingTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.person.name} - {TASK_TYPE_LABELS[task.type]} -{' '}
                          {task.person.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTaskId && (
                    <div className="p-5 bg-primary-50 rounded-xl">
                      <h4 className="text-lg font-bold text-primary-700 mb-3">
                        上次核验情况
                      </h4>
                      {(() => {
                        const record = getTaskVerifyRecord(selectedTaskId);
                        const task = tasks.find((t) => t.id === selectedTaskId);
                        if (!record || !task) return null;

                        return (
                          <div className="space-y-2 text-base text-primary-700">
                            <p>
                              <strong>核验时间：</strong>
                              {formatDateTime(record.verifyTime)}
                            </p>
                            <p>
                              <strong>核验结论：</strong>
                              <span
                                className={cn(
                                  'px-3 py-0.5 rounded text-white font-bold ml-2',
                                  VERIFY_CONCLUSION_COLORS[record.conclusion]
                                )}
                              >
                                {VERIFY_CONCLUSION_LABELS[record.conclusion]}
                              </span>
                            </p>
                            {record.differenceMark && (
                              <p>
                                <strong>差异标记：</strong>
                                {record.differenceMark}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div>
                    <label className="label-large">回访内容</label>
                    <textarea
                      value={followupContent}
                      onChange={(e) => setFollowupContent(e.target.value)}
                      placeholder="请记录本次回访的具体内容，包括核验对象的现状、问题整改情况等..."
                      className="input-large min-h-[120px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="label-large">回访结果</label>
                    <textarea
                      value={followupResult}
                      onChange={(e) => setFollowupResult(e.target.value)}
                      placeholder="请记录本次回访的结论，如：已完成整改、需继续跟进、无需再回访等..."
                      className="input-large min-h-[100px] resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full btn-primary text-xl py-5',
                      isSubmitting && 'opacity-70 cursor-not-allowed'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Send size={28} />
                        保存回访记录
                      </>
                    )}
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-neutral-800 mb-4">
                待回访列表
              </h3>

              {filteredPending.length === 0 ? (
                <div className="card text-center py-16">
                  <CheckCircle size={64} className="mx-auto text-success-300 mb-4" />
                  <p className="text-xl text-neutral-500">暂无待回访任务</p>
                </div>
              ) : (
                filteredPending.map((task) => {
                  const isExpanded = expandedId === task.id;
                  const record = getTaskVerifyRecord(task.id);
                  const followups = getTaskFollowups(task.id);

                  return (
                    <div key={task.id} className="card mb-4">
                      <div
                        onClick={() => toggleExpand(task.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold',
                                task.person.gender === '男'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-pink-100 text-pink-600'
                              )}
                            >
                              {task.person.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-neutral-800">
                                {task.person.name}
                              </h3>
                              <p className="text-base text-neutral-500">
                                {TASK_TYPE_LABELS[task.type]} · {task.person.age}岁
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'px-4 py-1 rounded-lg text-base font-bold',
                                TASK_STATUS_COLORS[task.status]
                              )}
                            >
                              {TASK_STATUS_LABELS[task.status]}
                            </span>
                            {isExpanded ? (
                              <ChevronUp size={24} className="text-neutral-400" />
                            ) : (
                              <ChevronDown size={24} className="text-neutral-400" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 text-base text-neutral-500">
                          <div className="flex items-center gap-2">
                            <MapPin size={18} className="flex-shrink-0" />
                            <span>{task.person.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User size={18} className="flex-shrink-0" />
                            <span>{maskIdCard(task.person.idCard)}</span>
                          </div>
                          {record && (
                            <div className="flex items-center gap-2">
                              <Calendar size={18} className="flex-shrink-0" />
                              <span>
                                上次核验：{formatDateTime(record.verifyTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
                          {record && (
                            <div className="p-4 bg-neutral-50 rounded-xl">
                              <h4 className="text-lg font-bold text-neutral-700 mb-2 flex items-center gap-2">
                                <FileText size={20} className="text-primary-600" />
                                上次核验记录
                              </h4>
                              <div className="space-y-2 text-base">
                                <p>
                                  <span className="text-neutral-500">核验结论：</span>
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded text-white font-bold ml-2',
                                      VERIFY_CONCLUSION_COLORS[record.conclusion]
                                    )}
                                  >
                                    {VERIFY_CONCLUSION_LABELS[record.conclusion]}
                                  </span>
                                </p>
                                {record.differenceMark && (
                                  <p>
                                    <span className="text-neutral-500">差异标记：</span>
                                    <span className="text-neutral-700">
                                      {record.differenceMark}
                                    </span>
                                  </p>
                                )}
                                <p>
                                  <span className="text-neutral-500">照片数量：</span>
                                  <span className="text-neutral-700">
                                    {record.photos.length} 张
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}

                          {followups.length > 0 && (
                            <div>
                              <h4 className="text-lg font-bold text-neutral-700 mb-3 flex items-center gap-2">
                                <History size={20} className="text-primary-600" />
                                历史回访记录
                              </h4>
                              <div className="space-y-3">
                                {followups.map((f, idx) => (
                                  <div
                                    key={f.id}
                                    className="p-4 bg-primary-50 rounded-xl"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-base font-bold text-primary-700">
                                        第 {followups.length - idx} 次回访
                                      </span>
                                      <span className="text-sm text-primary-500">
                                        {formatDateTime(f.followTime)}
                                      </span>
                                    </div>
                                    <p className="text-base text-primary-700 mb-1">
                                      <strong>内容：</strong>
                                      {f.content}
                                    </p>
                                    <p className="text-base text-primary-700">
                                      <strong>结果：</strong>
                                      {f.result}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full btn-secondary"
                          >
                            <RotateCcw size={24} />
                            登记本次回访
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {filteredHistory.length === 0 ? (
                <div className="card text-center py-16">
                  <FileText size={64} className="mx-auto text-neutral-300 mb-4" />
                  <p className="text-xl text-neutral-500">暂无回访记录</p>
                </div>
              ) : (
                filteredHistory
                  .sort(
                    (a, b) =>
                      new Date(b.followTime).getTime() -
                      new Date(a.followTime).getTime()
                  )
                  .map((record) => {
                    const task = tasks.find((t) => t.id === record.taskId);
                    const isExpanded = expandedId === record.id;

                    return (
                      <div key={record.id} className="card mb-4">
                        <div
                          onClick={() => toggleExpand(record.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                <RotateCcw
                                  size={24}
                                  className="text-primary-600"
                                />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-neutral-800">
                                  {task?.person.name || '未知人员'}
                                </h3>
                                <p className="text-base text-neutral-500">
                                  {task
                                    ? TASK_TYPE_LABELS[task.type]
                                    : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-base text-neutral-500">
                                {formatDateTime(record.followTime)}
                              </span>
                              {isExpanded ? (
                                <ChevronUp
                                  size={24}
                                  className="text-neutral-400"
                                />
                              ) : (
                                <ChevronDown
                                  size={24}
                                  className="text-neutral-400"
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-base text-neutral-500">
                            <Clock size={18} />
                            <span>{formatDateTime(record.followTime)}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
                            <div>
                              <h4 className="text-lg font-bold text-neutral-700 mb-2">
                                回访内容
                              </h4>
                              <p className="text-lg text-neutral-600 bg-neutral-50 p-4 rounded-xl">
                                {record.content}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-neutral-700 mb-2">
                                回访结果
                              </h4>
                              <p className="text-lg text-neutral-600 bg-success-50 p-4 rounded-xl">
                                {record.result}
                              </p>
                            </div>
                            {task && (
                              <div className="p-4 bg-primary-50 rounded-xl">
                                <h4 className="text-lg font-bold text-primary-700 mb-2">
                                  关联任务
                                </h4>
                                <div className="space-y-1 text-base text-primary-700">
                                  <p>
                                    <strong>任务类型：</strong>
                                    {TASK_TYPE_LABELS[task.type]}
                                  </p>
                                  <p>
                                    <strong>地 址：</strong>
                                    {task.person.address}
                                  </p>
                                </div>
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
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
