import { Wifi, WifiOff, RefreshCw, LogOut, User } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils';
import { cn } from '@/utils';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function TopBar({ title, showBack, onBack }: TopBarProps) {
  const { user, isOnline, unsyncedCount, syncData, logout, isLoading } = useAppStore();
  const today = formatDate(new Date(), 'YYYY年MM月DD日 dddd');

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-18 bg-primary-600 text-white px-6 flex items-center justify-between z-40 shadow-lg">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="text-2xl font-bold">←</span>
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-white/80">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
            <User size={24} />
            <div className="text-right">
              <p className="text-base font-bold leading-tight">{user.name}</p>
              <p className="text-xs text-white/80 leading-tight">{user.community}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => syncData()}
          disabled={isLoading || unsyncedCount === 0}
          className={cn(
            'relative p-3 rounded-xl transition-colors',
            unsyncedCount > 0 ? 'bg-warning-500 hover:bg-warning-600' : 'bg-white/10 hover:bg-white/20',
            (isLoading || unsyncedCount === 0) && 'opacity-50 cursor-not-allowed'
          )}
          title={unsyncedCount > 0 ? `待同步 ${unsyncedCount} 条` : '数据已同步'}
        >
          <RefreshCw size={24} className={isLoading ? 'animate-spin' : ''} />
          {unsyncedCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {unsyncedCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1 px-3 py-2 bg-white/10 rounded-xl">
          {isOnline ? (
            <>
              <Wifi size={20} />
              <span className="text-sm">在线</span>
            </>
          ) : (
            <>
              <WifiOff size={20} className="text-warning-300" />
              <span className="text-sm text-warning-300">离线</span>
            </>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          title="退出登录"
        >
          <LogOut size={24} />
        </button>
      </div>
    </header>
  );
}
