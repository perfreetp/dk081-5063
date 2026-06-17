import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, LogIn } from 'lucide-react';
import { useAppStore } from '@/store';
import { login, seedMockData } from '@/mock';
import { initDB } from '@/db';
import { showToast, speak } from '@/utils';
import { cn } from '@/utils';

export default function Login() {
  const [employeeNo, setEmployeeNo] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeNo.trim()) {
      showToast('请输入工号');
      return;
    }
    if (!password.trim()) {
      showToast('请输入密码');
      return;
    }

    setIsLoading(true);

    try {
      await initDB();
      await seedMockData();

      const user = await login(employeeNo.trim(), password);

      if (user) {
        await seedMockData(user.id);
        setUser(user);
        speak('登录成功');
        showToast(`欢迎回来，${user.name}`);
        setTimeout(() => {
          navigate('/tasks');
        }, 500);
      } else {
        showToast('登录失败，请重试');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl mb-6 shadow-2xl">
          <Shield size={48} className="text-primary-600" />
        </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            入户核验终端
          </h1>
          <p className="text-xl text-white/80">
            现场核验有依据 · 上门用证留得住
          </p>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-2xl">
          <h2 className="text-2xl font-bold text-neutral-800 text-center mb-8">
            账号登录
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="label-large">
                <div className="flex items-center gap-2 mb-2">
                  <User size={20} className="text-primary-600" />
                  <span>工号</span>
                </div>
              </label>
              <input
                type="text"
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                placeholder="请输入您的工号"
                className="input-large text-lg"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="label-large">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={20} className="text-primary-600" />
                  <span>密码</span>
                </div>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入您的密码"
                className="input-large text-lg"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full btn-primary text-xl py-5 mt-8',
                isLoading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>登录中...</span>
              </div>
              ) : (
                <>
                  <LogIn size={28} />
                  <span>登 录</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-5 bg-primary-50 rounded-xl">
            <p className="text-base text-primary-700 text-center">
              <strong>演示提示：</strong>任意工号和密码即可登录
            </p>
            <p className="text-sm text-primary-600 text-center mt-1">
              首次登录将自动生成15条演示任务数据
            </p>
          </div>
        </div>

        <p className="text-center text-white/60 text-base mt-8">
          基层服务 · 便民利民
        </p>
      </div>
    </div>
  );
}
