import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Camera,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  ChevronRight,
  Home,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import CameraCapture from '@/components/CameraCapture';
import { useAppStore } from '@/store';
import type { PhotoType, VerifyConclusion, Photo, VerifyRecord, Task } from '@/types';
import {
  CERT_TYPE_LABELS,
  CERT_STATUS_LABELS,
  PHOTO_TYPE_LABELS,
  VERIFY_CONCLUSION_LABELS,
  VERIFY_CONCLUSION_COLORS,
} from '@/types';
import { maskIdCard, maskPhone, formatDate, showToast, speak, cn } from '@/utils';

const photoTypes: PhotoType[] = ['door_plate', 'portrait', 'environment', 'cert_photo'];

export default function Verify() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const {
    tasks,
    verifyRecords,
    certificates,
    createVerifyRecord,
    updateVerifyRecord,
    addPhoto,
    removePhoto,
    updateTaskStatus,
    setCurrentTask,
    loadTaskById,
    loadVerifyRecordByTaskId,
    loadCertificates,
  } = useAppStore();

  const [cameraOpen, setCameraOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType>('door_plate');
  const [conclusion, setConclusion] = useState<VerifyConclusion>('pass');
  const [differenceMark, setDifferenceMark] = useState('');
  const [actualSituation, setActualSituation] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);

  const record = task
    ? verifyRecords.find((r) => r.taskId === task.id) || null
    : null;

  useEffect(() => {
    if (record) {
      setConclusion(record.conclusion);
      setDifferenceMark(record.differenceMark);
      setActualSituation(record.actualSituation || {});
    }
  }, [record?.id]);

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

      if (taskData.status === 'pending') {
        await updateTaskStatus(taskData.id, 'in_progress');
      }

      let existingRecord = verifyRecords.find((r) => r.taskId === taskId);
      if (!existingRecord) {
        existingRecord = await loadVerifyRecordByTaskId(taskId);
      }
      if (!existingRecord) {
        existingRecord = await createVerifyRecord(taskData.id);
      }

      setIsLoading(false);
    };

    initPage();
  }, [taskId]);

  if (isLoading || !task || !record) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-xl text-neutral-500">加载中...</div>
      </div>
    );
  }

  const person = task.person;
  const allowedCerts = certificates.filter((c) =>
    task.allowedCerts.includes(c.type)
  );

  const handleOpenCamera = (type: PhotoType) => {
    setCurrentPhotoType(type);
    setCameraOpen(true);
  };

  const handleCapture = async (dataUrl: string, type: PhotoType) => {
    if (!record) return;

    const photo: Photo = {
      id: crypto.randomUUID(),
      recordId: record.id,
      type,
      dataUrl,
      remark: PHOTO_TYPE_LABELS[type],
      shootTime: new Date().toISOString(),
    };

    await addPhoto(record.id, photo);
    showToast('照片已保存');
  };

  const handleRemovePhoto = async (photoId: string) => {
    if (window.confirm('确定要删除这张照片吗？')) {
      await removePhoto(photoId);
      showToast('照片已删除');
    }
  };

  const handleNext = async () => {
    if (step === 2 && record.photos.length === 0) {
      showToast('请至少拍摄一张佐证照片');
      return;
    }

    if (step === 3) {
      await updateVerifyRecord(record.id, {
        conclusion,
        differenceMark,
        actualSituation,
      });
      speak('核验信息已保存');
      navigate(`/authorize/${task.id}`);
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/tasks');
    }
  };

  const getPhotosByType = (type: PhotoType) => {
    return record.photos.filter((p) => p.type === type);
  };

  const isDiff = (field: string, certValue: string, actualValue: string) => {
    return actualValue && actualValue !== certValue;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <TopBar title="入户核验" showBack onBack={handleBack} />

      <main className="pt-18 pb-22 px-6 h-screen overflow-y-auto">
        <div className="py-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors',
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-200 text-neutral-500'
                  )}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'w-16 h-1 mx-2 transition-colors',
                      step > s ? 'bg-primary-600' : 'bg-neutral-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mb-6">
            <span className="text-lg font-bold text-primary-600">
              {step === 1 && '步骤 1/3：证照联查'}
              {step === 2 && '步骤 2/3：拍照佐证'}
              {step === 3 && '步骤 3/3：核验结论'}
            </span>
          </div>

          {step === 1 && (
            <>
              <div className="card mb-6">
                <h3 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <Home size={24} className="text-primary-600" />
                  核验对象信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <span className="text-lg text-neutral-500 whitespace-nowrap">
                      姓名：
                    </span>
                    <span className="text-lg font-bold text-neutral-800">
                      {person.name}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg text-neutral-500 whitespace-nowrap">
                      性别：
                    </span>
                    <span className="text-lg font-bold text-neutral-800">
                      {person.gender}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg text-neutral-500 whitespace-nowrap">
                      年龄：
                    </span>
                    <span className="text-lg font-bold text-neutral-800">
                      {person.age}岁
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg text-neutral-500 whitespace-nowrap">
                      身份证：
                    </span>
                    <span className="text-lg font-bold text-neutral-800">
                      {maskIdCard(person.idCard)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-start gap-2">
                    <MapPin size={20} className="text-neutral-400 mt-1 flex-shrink-0" />
                    <span className="text-lg font-bold text-neutral-800">
                      {person.address}
                    </span>
                  </div>
                  {person.phone && (
                    <div className="col-span-2 flex items-start gap-2">
                      <Phone size={20} className="text-neutral-400 mt-1 flex-shrink-0" />
                      <span className="text-lg font-bold text-neutral-800">
                        {maskPhone(person.phone)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card mb-6">
                <h3 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <FileText size={24} className="text-primary-600" />
                  本次允许调用的证照
                </h3>
                <div className="space-y-4">
                  {allowedCerts.length === 0 ? (
                    <p className="text-lg text-neutral-500 text-center py-8">
                      暂无可用证照
                    </p>
                  ) : (
                    allowedCerts.map((cert) => (
                      <div
                        key={cert.id}
                        className="border-2 border-neutral-200 rounded-xl p-5 hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                              <FileText size={24} className="text-primary-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-neutral-800">
                                {CERT_TYPE_LABELS[cert.type]}
                              </h4>
                              <p className="text-base text-neutral-500">
                                证号：{cert.certNo}
                              </p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              'px-4 py-1 rounded-lg text-base font-bold',
                              cert.status === 'valid'
                                ? 'bg-success-100 text-success-600'
                                : 'bg-danger-100 text-danger-600'
                            )}
                          >
                            {CERT_STATUS_LABELS[cert.status]}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-neutral-100">
                          {Object.entries(cert.info).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <label className="block text-base text-neutral-500">
                                {key}
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="text-base text-neutral-400 line-through">
                                    {value}
                                  </div>
                                  <input
                                    type="text"
                                    value={actualSituation[key] || ''}
                                    onChange={(e) =>
                                      setActualSituation({
                                        ...actualSituation,
                                        [key]: e.target.value,
                                      })
                                    }
                                    placeholder={isDiff(key, value, actualSituation[key] || '') ? '实际情况' : '与证照一致'}
                                    className={cn(
                                      'w-full mt-1 px-3 py-2 text-lg rounded-lg border-2 transition-colors',
                                      isDiff(key, value, actualSituation[key] || '')
                                        ? 'border-danger-300 bg-danger-50 text-danger-700'
                                        : 'border-transparent bg-neutral-50 focus:border-primary-300'
                                    )}
                                  />
                                </div>
                                {isDiff(key, value, actualSituation[key] || '') && (
                                  <AlertCircle
                                    size={20}
                                    className="text-danger-500 flex-shrink-0"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-base text-neutral-500 mt-4 pt-3 border-t border-neutral-100">
                          <span>
                            签发日期：{formatDate(cert.issueDate)}
                          </span>
                          <span>
                            有效期至：{formatDate(cert.expireDate)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="card mb-6">
                <h3 className="text-xl font-bold text-neutral-800 mb-4">
                  拍照佐证
                </h3>
                <p className="text-base text-neutral-500 mb-4">
                  请拍摄相关照片作为核验佐证。照片仅用于核验记录，不替代证照。
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {photoTypes.map((type) => (
                    <div key={type} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-neutral-700">
                          {PHOTO_TYPE_LABELS[type]}
                        </span>
                        <button
                          onClick={() => handleOpenCamera(type)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-base font-bold hover:bg-primary-100 transition-colors"
                        >
                          <Camera size={20} />
                          拍摄
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {getPhotosByType(type).map((photo) => (
                          <div
                            key={photo.id}
                            className="relative aspect-square rounded-lg overflow-hidden group"
                          >
                            <img
                              src={photo.dataUrl}
                              alt={photo.remark}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => handleRemovePhoto(photo.id)}
                              className="absolute top-1 right-1 p-1.5 bg-danger-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        {getPhotosByType(type).length === 0 && (
                          <div
                            onClick={() => handleOpenCamera(type)}
                            className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-colors"
                          >
                            <Camera size={28} />
                            <span className="text-sm mt-1">点击拍摄</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {record.photos.length > 0 && (
                  <div className="mt-6 p-4 bg-success-50 rounded-xl">
                    <p className="text-base text-success-700 font-bold">
                      已拍摄 {record.photos.length} 张照片
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="card mb-6">
                <h3 className="text-xl font-bold text-neutral-800 mb-4">
                  核验结论
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {(['pass', 'review', 'reject'] as VerifyConclusion[]).map(
                    (c) => (
                      <button
                        key={c}
                        onClick={() => setConclusion(c)}
                        className={cn(
                          'p-6 rounded-xl border-3 transition-all flex flex-col items-center gap-3',
                          conclusion === c
                            ? `${VERIFY_CONCLUSION_COLORS[c]} text-white border-transparent shadow-lg`
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                        )}
                      >
                        {c === 'pass' && <CheckCircle size={36} />}
                        {c === 'review' && <AlertCircle size={36} />}
                        {c === 'reject' && <XCircle size={36} />}
                        <span className="text-xl font-bold">
                          {VERIFY_CONCLUSION_LABELS[c]}
                        </span>
                      </button>
                    )
                  )}
                </div>

                <div className="space-y-3">
                  <label className="label-large">差异标记</label>
                  <textarea
                    value={differenceMark}
                    onChange={(e) => setDifferenceMark(e.target.value)}
                    placeholder="请记录证照信息与实际居住情况的差异..."
                    className="input-large min-h-[120px] resize-none"
                  />
                </div>

                {Object.keys(actualSituation).filter((k) => actualSituation[k]).length > 0 && (
                  <div className="mt-6 p-4 bg-warning-50 rounded-xl">
                    <h4 className="text-lg font-bold text-warning-700 mb-2">
                      已标记的差异项：
                    </h4>
                    <ul className="space-y-1">
                      {Object.entries(actualSituation)
                        .filter(([_, v]) => v)
                        .map(([key, value]) => (
                          <li key={key} className="text-base text-warning-700">
                            • {key}：{value}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {record.photos.length > 0 && (
                  <div className="mt-6 p-4 bg-primary-50 rounded-xl">
                    <h4 className="text-lg font-bold text-primary-700 mb-2">
                      已拍摄照片：{record.photos.length} 张
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {record.photos.map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.dataUrl}
                          alt={photo.remark}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-4">
            <button onClick={handleBack} className="flex-1 btn-ghost">
              {step === 1 ? '返回列表' : '上一步'}
            </button>
            <button onClick={handleNext} className="flex-1 btn-primary">
              {step === 3 ? (
                <>
                  下一步：授权签认
                  <ChevronRight size={24} />
                </>
              ) : (
                <>
                  下一步
                  <ChevronRight size={24} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <BottomNav />

      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
        photoType={currentPhotoType}
      />
    </div>
  );
}
