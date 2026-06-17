import { MapPin, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import type { Task } from '@/types';
import {
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  CERT_TYPE_LABELS,
} from '@/types';
import { maskIdCard, cn } from '@/utils';

interface TaskCardProps {
  task: Task;
  onStart: (task: Task) => void;
  onView: (task: Task) => void;
}

export default function TaskCard({ task, onStart, onView }: TaskCardProps) {
  const isActionable = task.status === 'pending' || task.status === 'in_progress';

  return (
    <div className="card mb-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold',
              task.person.gender === '男' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
            )}
          >
            {task.person.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-neutral-800">{task.person.name}</h3>
              <span className="text-lg text-neutral-500">{task.person.age}岁</span>
            </div>
            <p className="text-base text-neutral-500">{maskIdCard(task.person.idCard)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              'px-4 py-1 rounded-lg text-base font-bold',
              TASK_STATUS_COLORS[task.status]
            )}
          >
            {TASK_STATUS_LABELS[task.status]}
          </span>
          <span
            className={cn(
              'px-3 py-1 rounded-lg text-sm font-bold',
              TASK_PRIORITY_COLORS[task.priority]
            )}
          >
            {TASK_PRIORITY_LABELS[task.priority]}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-4 py-1 rounded-lg text-base font-bold',
              TASK_TYPE_COLORS[task.type]
            )}
          >
            {TASK_TYPE_LABELS[task.type]}
          </span>
        </div>

        <div className="flex items-start gap-2 text-base text-neutral-600">
          <MapPin size={20} className="flex-shrink-0 mt-1 text-neutral-400" />
          <span>{task.person.address}</span>
        </div>

        <div className="flex items-center gap-2 text-base text-neutral-600">
          <Clock size={20} className="flex-shrink-0 text-neutral-400" />
          <span>允许调用证照：</span>
          <div className="flex flex-wrap gap-1">
            {task.allowedCerts.map((cert) => (
              <span
                key={cert}
                className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-sm font-medium"
              >
                {CERT_TYPE_LABELS[cert]}
              </span>
            ))}
          </div>
        </div>

        {task.priority === 'high' && (
          <div className="flex items-center gap-2 text-base text-danger-600 bg-danger-50 p-3 rounded-xl">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span className="font-bold">重点关注对象，请仔细核验</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {isActionable ? (
          <>
            <button
              onClick={() => onView(task)}
              className="flex-1 btn-secondary"
            >
              查看详情
            </button>
            <button
              onClick={() => onStart(task)}
              className="flex-1 btn-primary"
            >
              开始核验
              <ChevronRight size={24} />
            </button>
          </>
        ) : (
          <button
            onClick={() => onView(task)}
            className="flex-1 btn-primary"
          >
            查看核验记录
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
