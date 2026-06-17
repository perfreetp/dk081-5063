import { useState } from 'react';
import { useAppStore } from '@/store';
import { MapPin, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils';

export default function StatsCard() {
  const stats = useAppStore((state) => state.getStatistics());
  const [expandedStreet, setExpandedStreet] = useState<string | null>(null);

  const cards = [
    {
      label: '今日任务',
      value: stats.totalTasks,
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600',
    },
    {
      label: '已完成',
      value: stats.completedTasks,
      color: 'bg-success-500',
      bgColor: 'bg-success-50',
      textColor: 'text-success-600',
    },
    {
      label: '进行中',
      value: stats.inProgressTasks,
      color: 'bg-warning-500',
      bgColor: 'bg-warning-50',
      textColor: 'text-warning-600',
    },
    {
      label: '待核验',
      value: stats.pendingTasks,
      color: 'bg-neutral-500',
      bgColor: 'bg-neutral-50',
      textColor: 'text-neutral-600',
    },
  ];

  const toggleStreet = (street: string) => {
    setExpandedStreet(expandedStreet === street ? null : street);
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-4 gap-4 mb-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bgColor} rounded-xl p-5 text-center`}
          >
            <div className={`text-4xl font-bold ${card.textColor} mb-2`}>
              {card.value}
            </div>
            <div className="text-lg text-neutral-600 font-medium">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-neutral-800">今日完成率</h3>
          <span className="text-3xl font-bold text-primary-600">
            {stats.completionRate.toFixed(0)}%
          </span>
        </div>

        <div className="w-full h-6 bg-neutral-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>

        {Object.keys(stats.byStreet).length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-bold text-neutral-700 mb-3 flex items-center gap-2">
              <Building2 size={20} className="text-primary-600" />
              按街道社区统计
            </h4>
            <div className="space-y-4">
              {Object.entries(stats.byStreet).map(
                ([street, streetData]) => {
                  const streetRate =
                    streetData.total > 0
                      ? (streetData.completed / streetData.total) * 100
                      : 0;
                  const isExpanded = expandedStreet === street;

                  return (
                    <div
                      key={street}
                      className="border-2 border-neutral-200 rounded-xl overflow-hidden"
                    >
                      <div
                        onClick={() => toggleStreet(street)}
                        className="bg-neutral-50 p-4 cursor-pointer hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Building2 size={22} className="text-primary-600" />
                            <span className="text-lg font-bold text-neutral-800">
                              {street}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-base text-neutral-600">
                              <span className="font-bold text-success-600">
                                {streetData.completed}
                              </span>
                              <span className="mx-1">/</span>
                              <span>{streetData.total}</span>
                              <span className="ml-2 text-neutral-400">
                                ({streetRate.toFixed(0)}%)
                              </span>
                            </span>
                            {isExpanded ? (
                              <ChevronUp size={22} className="text-neutral-400" />
                            ) : (
                              <ChevronDown size={22} className="text-neutral-400" />
                            )}
                          </div>
                        </div>
                        <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden mt-3">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${streetRate}%` }}
                          />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-white space-y-3">
                          {Object.entries(streetData.communities).map(
                            ([community, data]) => {
                              const rate =
                                data.total > 0
                                  ? (data.completed / data.total) * 100
                                  : 0;
                              return (
                                <div
                                  key={community}
                                  className="pl-4 border-l-3 border-primary-200"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <MapPin size={18} className="text-neutral-400" />
                                      <span className="text-base font-medium text-neutral-700">
                                        {community}
                                      </span>
                                    </div>
                                    <span className="text-base text-neutral-500">
                                      <span className={cn(
                                        'font-bold',
                                        rate >= 80 ? 'text-success-600' :
                                        rate >= 50 ? 'text-warning-600' : 'text-danger-600'
                                      )}>
                                        {data.completed}
                                      </span>
                                      <span className="mx-1">/</span>
                                      <span>{data.total}</span>
                                      <span className="ml-2 text-neutral-400">
                                        ({rate.toFixed(0)}%)
                                      </span>
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full transition-all',
                                        rate >= 80 ? 'bg-success-500' :
                                        rate >= 50 ? 'bg-warning-500' : 'bg-danger-500'
                                      )}
                                      style={{ width: `${rate}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
