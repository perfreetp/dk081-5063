import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw } from 'lucide-react';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import StatsCard from '@/components/StatsCard';
import TaskCard from '@/components/TaskCard';
import { useAppStore } from '@/store';
import type { Task, TaskStatus } from '@/types';
import { TASK_STATUS_LABELS } from '@/types';
import { cn, speak } from '@/utils';

const statusFilters: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待核验' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'followup', label: '待回访' },
];

export default function Tasks() {
  const navigate = useNavigate();
  const { tasks, setCurrentTask, loadTasks, isLoading } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.person.name.includes(searchText) ||
      task.person.idCard.includes(searchText) ||
      task.person.address.includes(searchText);
    const matchesStatus =
      statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStart = (task: Task) => {
    setCurrentTask(task);
    speak('开始核验');
    navigate(`/verify/${task.id}`);
  };

  const handleView = (task: Task) => {
    setCurrentTask(task);
    navigate(`/verify/${task.id}`);
  };

  const handleRefresh = () => {
    loadTasks();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopBar title="任务列表" />

      <main className="pt-18 pb-22 px-6 h-screen overflow-y-auto">
        <div className="py-4">
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
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-4 bg-white rounded-xl border-2 border-neutral-200 hover:bg-neutral-50 transition-colors"
              title="刷新"
            >
              <RefreshCw
                size={24}
                className={cn(isLoading && 'animate-spin')}
              />
            </button>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'px-6 py-3 rounded-xl text-lg font-bold whitespace-nowrap transition-all',
                  statusFilter === filter.value
                    ? 'bg-primary-600 text-white shadow-button'
                    : 'bg-white text-neutral-600 border-2 border-neutral-200 hover:bg-neutral-50'
                )}
              >
                {filter.label}
                {filter.value !== 'all' && (
                  <span className="ml-2">
                    (
                    {
                      tasks.filter((t) => t.status === filter.value)
                        .length
                    }
                    )
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 text-lg text-primary-600 font-bold mb-4"
          >
            <Filter size={20} />
            {showStats ? '收起统计' : '展开统计'}
          </button>

          {showStats && <StatsCard />}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-800">
              任务列表
              <span className="ml-2 text-lg text-neutral-500 font-normal">
                共 {filteredTasks.length} 条
              </span>
            </h2>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-xl text-neutral-500">暂无任务</p>
              <p className="text-base text-neutral-400 mt-2">
                请等待管理员分配核验任务
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={handleStart}
                onView={handleView}
              />
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
