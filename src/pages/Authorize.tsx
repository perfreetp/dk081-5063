import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Users,
  X,
  RotateCcw,
  Check,
  ChevronRight,
  AlertTriangle,
  FileSignature,
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { useAppStore } from '@/store';
import type { Signature, Task } from '@/types';
import { REFUSE_REASONS, DELEGATE_RELATIONS, TASK_TYPE_LABELS } from '@/types';
import { showToast, speak, cn, maskIdCard } from '@/utils';

type SignMode = 'self' | 'delegate' | 'refuse';

export default function Authorize() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const {
    tasks,
    verifyRecords,
    saveSignature,
    updateTaskStatus,
    createAnomalyReport,
    setCurrentTask,
    loadTaskById,
    loadVerifyRecordByTaskId,
    loadCertificates,
  } = useAppStore();

  const [signMode, setSignMode] = useState<SignMode>('self');
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [signerName, setSignerName] = useState('');
  const [delegateRelation, setDelegateRelation] = useState('');
  const [delegateIdCard, setDelegateIdCard] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [refuseRemark, setRefuseRemark] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const initPage = async () => {
      if (!taskId) {
        navigate('/tasks');
        return;
      }

      let taskData = tasks.find((t) => t.id === taskId);
      if (!taskData) {
        taskData = await loadTaskById(taskId);
        if (!taskData) {
          navigate('/tasks');
          return;
        }
      }

      setTask(taskData);
      setCurrentTask(taskData);
      await loadCertificates(taskData.personId);

      let verifyRecord = verifyRecords.find((r) => r.taskId === taskId);
      if (!verifyRecord) {
        verifyRecord = await loadVerifyRecordByTaskId(taskId);
        if (!verifyRecord) {
          navigate(`/verify/${taskId}`);
          return;
        }
      }

      setRecord(verifyRecord);

      if (verifyRecord.signature) {
        setIsSigned(true);
      }

      if (signMode === 'self') {
        setSignerName(taskData.person.name);
      }

      setIsLoading(false);
    };

    initPage();
  }, [taskId, signMode, tasks, verifyRecords]);

  if (isLoading || !task || !record) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-xl text-neutral-500">加载中...</div>
      </div>
    );
  }

  const taskInfo = task;
  const recordInfo = record;

  useEffect(() => {
    if (!isLoading && recordInfo?.signature?.signatureData && sigCanvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = sigCanvasRef.current?.getCanvas();
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setIsSigned(true);
          }
        }
      };
      img.src = recordInfo.signature.signatureData;
    }
  }, [isLoading, recordInfo?.signature?.signatureData]);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setIsSigned(false);
  };

  const handleEndStroke = () => {
    if (sigCanvasRef.current) {
      setIsSigned(!sigCanvasRef.current.isEmpty());
    }
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (signMode !== 'refuse' && !isSigned) {
      showToast('请先完成签名');
      return;
    }

    if (signMode === 'delegate') {
      if (!signerName.trim()) {
        showToast('请输入代签人姓名');
        return;
      }
      if (!delegateRelation) {
        showToast('请选择与核验对象关系');
        return;
      }
      if (!delegateIdCard.trim()) {
        showToast('请输入代签人身份证号');
        return;
      }
    }

    if (signMode === 'refuse' && selectedReasons.length === 0) {
      showToast('请至少选择一个拒绝原因');
      return;
    }

    setIsSubmitting(true);

    try {
      let signatureData = '';
      if (signMode !== 'refuse' && sigCanvasRef.current) {
        signatureData = sigCanvasRef.current.toDataURL('image/png');
      }

      const signature: Signature = {
        id: crypto.randomUUID(),
        recordId: recordInfo.id,
        signerName,
        relation: signMode === 'self' ? '本人' : delegateRelation,
        idCard: signMode === 'self' ? taskInfo.person.idCard : delegateIdCard,
        signatureData,
        isDelegate: signMode === 'delegate',
        refuseReason:
          signMode === 'refuse'
            ? [...selectedReasons, refuseRemark].filter(Boolean).join('；')
            : undefined,
      };

      await saveSignature(recordInfo.id, signature);
      await updateTaskStatus(taskInfo.id, 'completed');

      if (signMode === 'refuse') {
        await createAnomalyReport({
          recordId: recordInfo.id,
          taskId: taskInfo.id,
          type: 'refuse_cooperate',
          description: `拒绝授权核验，原因：${signature.refuseReason}`,
        });
      }

      speak('核验完成');
      showToast('核验完成，数据已保存');

      setTimeout(() => {
        navigate('/tasks');
      }, 1000);
    } catch (error) {
      console.error('Submit error:', error);
      showToast('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/verify/${taskInfo.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopBar title="授权签认" showBack onBack={handleBack} />

      <main className="pt-18 pb-22 px-6 h-screen overflow-y-auto">
        <div className="py-4">
          <div className="card mb-6">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold flex-shrink-0',
                  taskInfo.person.gender === '男'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-pink-100 text-pink-600'
                )}
              >
                {taskInfo.person.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-neutral-800">
                    {taskInfo.person.name}
                  </h3>
                  <span
                    className="px-3 py-1 rounded-lg text-base font-bold bg-primary-100 text-primary-600"
                  >
                    {TASK_TYPE_LABELS[taskInfo.type]}
                  </span>
                </div>
                <p className="text-lg text-neutral-500">
                  {taskInfo.person.age}岁 · {maskIdCard(taskInfo.person.idCard)}
                </p>
                <p className="text-lg text-neutral-500 mt-1">
                  {taskInfo.person.address}
                </p>
              </div>
            </div>
          </div>

          <div className="card mb-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <FileSignature size={24} className="text-primary-600" />
              签署方式
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setSignMode('self')}
                className={cn(
                  'p-6 rounded-xl border-3 transition-all flex flex-col items-center gap-3',
                  signMode === 'self'
                    ? 'bg-primary-600 text-white border-transparent shadow-lg'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                )}
              >
                <UserCheck size={36} />
                <span className="text-xl font-bold">本人签署</span>
                <span className="text-base opacity-80">核验对象本人</span>
              </button>

              <button
                onClick={() => setSignMode('delegate')}
                className={cn(
                  'p-6 rounded-xl border-3 transition-all flex flex-col items-center gap-3',
                  signMode === 'delegate'
                    ? 'bg-warning-500 text-white border-transparent shadow-lg'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                )}
              >
                <Users size={36} />
                <span className="text-xl font-bold">家属代签</span>
                <span className="text-base opacity-80">需登记授权关系</span>
              </button>

              <button
                onClick={() => setSignMode('refuse')}
                className={cn(
                  'p-6 rounded-xl border-3 transition-all flex flex-col items-center gap-3',
                  signMode === 'refuse'
                    ? 'bg-danger-500 text-white border-transparent shadow-lg'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                )}
              >
                <X size={36} />
                <span className="text-xl font-bold">拒绝授权</span>
                <span className="text-base opacity-80">记录拒绝原因</span>
              </button>
            </div>
          </div>

          {signMode === 'delegate' && (
            <div className="card mb-6">
              <h3 className="text-xl font-bold text-neutral-800 mb-4">
                代签人信息
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label-large">代签人姓名</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="请输入代签人姓名"
                    className="input-large"
                  />
                </div>
                <div>
                  <label className="label-large">与核验对象关系</label>
                  <select
                    value={delegateRelation}
                    onChange={(e) => setDelegateRelation(e.target.value)}
                    className="input-large"
                  >
                    <option value="">请选择关系</option>
                    {DELEGATE_RELATIONS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-large">代签人身份证号</label>
                  <input
                    type="text"
                    value={delegateIdCard}
                    onChange={(e) => setDelegateIdCard(e.target.value)}
                    placeholder="请输入代签人身份证号"
                    maxLength={18}
                    className="input-large"
                  />
                </div>
              </div>
            </div>
          )}

          {signMode === 'refuse' && (
            <div className="card mb-6">
              <h3 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={24} className="text-danger-500" />
                拒绝授权原因
              </h3>
              <div className="space-y-3">
                {REFUSE_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => toggleReason(reason)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left text-lg font-bold transition-all flex items-center gap-3',
                      selectedReasons.includes(reason)
                        ? 'bg-danger-50 border-danger-400 text-danger-700'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0',
                        selectedReasons.includes(reason)
                          ? 'bg-danger-500 border-danger-500 text-white'
                          : 'border-neutral-300'
                      )}
                    >
                      {selectedReasons.includes(reason) && (
                        <Check size={16} />
                      )}
                    </div>
                    {reason}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="label-large">补充说明（可选）</label>
                <textarea
                  value={refuseRemark}
                  onChange={(e) => setRefuseRemark(e.target.value)}
                  placeholder="请输入其他补充说明..."
                  className="input-large min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}

          {signMode !== 'refuse' && (
            <div className="card mb-6">
              <h3 className="text-xl font-bold text-neutral-800 mb-4">
                {signMode === 'self' ? '本人签名' : '代签人签名'}
              </h3>
              <p className="text-base text-neutral-500 mb-4">
                请
                {signMode === 'self'
                  ? `${taskInfo.person.name}本人`
                  : `代签人${signerName || ' '}`}
                在下方区域签名
              </p>
              <div className="border-3 border-dashed border-neutral-300 rounded-xl bg-white overflow-hidden">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  onEnd={handleEndStroke}
                  canvasProps={{
                    className: 'w-full h-64 cursor-crosshair',
                  }}
                  penColor="#1E3A5F"
                  minWidth={3}
                  maxWidth={3}
                  velocityFilterWeight={0.7}
                />
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleClear}
                  className="flex-1 btn-ghost"
                >
                  <RotateCcw size={24} />
                  清除重签
                </button>
              </div>
              {isSigned && (
                <div className="mt-4 p-4 bg-success-50 rounded-xl flex items-center gap-2">
                  <Check size={24} className="text-success-600" />
                  <span className="text-lg font-bold text-success-700">
                    签名已完成
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={handleBack} className="flex-1 btn-ghost">
              返回修改
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'flex-1 btn-primary',
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
                  完成核验
                  <ChevronRight size={24} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
