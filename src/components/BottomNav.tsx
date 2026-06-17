import { NavLink } from 'react-router-dom';
import { ClipboardList, UserCheck, FileSignature, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof ClipboardList;
}

const navItems: NavItem[] = [
  { to: '/tasks', label: '任务列表', icon: ClipboardList },
  { to: '/verify', label: '入户核验', icon: UserCheck },
  { to: '/authorize', label: '授权签认', icon: FileSignature },
  { to: '/anomaly', label: '异常上报', icon: AlertTriangle },
  { to: '/followup', label: '回访记录', icon: RotateCcw },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-22 bg-white border-t-2 border-neutral-200 flex items-center justify-around px-4 z-40">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
            'flex flex-col items-center justify-center gap-1 h-full w-full max-w-[120px] transition-colors',
            isActive ? 'text-primary-600' : 'text-neutral-500'
          )}
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  'p-2 rounded-xl transition-all',
                  isActive ? 'bg-primary-50' : ''
                )}
              >
                <item.icon size={32} strokeWidth={2.5} />
              </div>
              <span className="text-base font-bold">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
