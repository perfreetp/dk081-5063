import { useAppStore } from '@/store';

export default function StatsCard() {
  const stats = useAppStore((state) => state.getStatistics());

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

        {Object.keys(stats.byCommunity).length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-bold text-neutral-700 mb-3">按社区统计</h4>
            <div className="space-y-3">
              {Object.entries(stats.byCommunity).map(
                ([community, data]) => {
                  const rate =
                    data.total > 0
                      ? (data.completed / data.total) * 100
                      : 0;
                  return (
                    <div key={community} className="space-y-1">
                      <div className="flex justify-between text-base">
                        <span className="font-medium text-neutral-700">
                          {community}
                        </span>
                        <span className="text-neutral-500">
                          {data.completed}/{data.total} ({rate.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success-500 rounded-full transition-all"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
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
