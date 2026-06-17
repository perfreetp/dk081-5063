export interface User {
  id: string;
  employeeNo: string;
  name: string;
  community: string;
  role: 'worker' | 'admin';
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'followup';
export type TaskPriority = 'high' | 'normal' | 'low';
export type TaskType = 'allowance' | 'subsidy' | 'elderly' | 'disability';

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  allowance: '低保核验',
  subsidy: '救助补贴',
  elderly: '老年补贴',
  disability: '残疾人服务',
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  allowance: 'bg-blue-100 text-blue-700',
  subsidy: 'bg-purple-100 text-purple-700',
  elderly: 'bg-orange-100 text-orange-700',
  disability: 'bg-green-100 text-green-700',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: '高优先级',
  normal: '普通',
  low: '低优先级',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: 'bg-danger-100 text-danger-600',
  normal: 'bg-neutral-100 text-neutral-600',
  low: 'bg-success-100 text-success-600',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待核验',
  in_progress: '进行中',
  completed: '已完成',
  followup: '待回访',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  in_progress: 'bg-warning-100 text-warning-600',
  completed: 'bg-success-100 text-success-600',
  followup: 'bg-primary-100 text-primary-600',
};

export interface Person {
  id: string;
  name: string;
  idCard: string;
  address: string;
  community: string;
  age: number;
  phone?: string;
  gender?: '男' | '女';
}

export interface Task {
  id: string;
  personId: string;
  userId: string;
  type: TaskType;
  status: TaskStatus;
  verifyDate: string;
  priority: TaskPriority;
  allowedCerts: CertType[];
  person: Person;
  remark?: string;
}

export type CertType = 'id_card' | 'elderly_card' | 'disability_card' | 'low_income' | 'medical';

export const CERT_TYPE_LABELS: Record<CertType, string> = {
  id_card: '居民身份证',
  elderly_card: '老年人优待证',
  disability_card: '残疾人证',
  low_income: '低保证',
  medical: '医疗救助证',
};

export const CERT_STATUS_LABELS: Record<string, string> = {
  valid: '有效',
  expired: '已过期',
  invalid: '已失效',
};

export interface Certificate {
  id: string;
  personId: string;
  type: CertType;
  certNo: string;
  issueDate: string;
  expireDate: string;
  status: 'valid' | 'expired' | 'invalid';
  info: Record<string, string>;
}

export type VerifyConclusion = 'pass' | 'review' | 'reject';

export const VERIFY_CONCLUSION_LABELS: Record<VerifyConclusion, string> = {
  pass: '核验通过',
  review: '待复核',
  reject: '核验不通过',
};

export const VERIFY_CONCLUSION_COLORS: Record<VerifyConclusion, string> = {
  pass: 'bg-success-500',
  review: 'bg-warning-500',
  reject: 'bg-danger-500',
};

export type PhotoType = 'door_plate' | 'portrait' | 'environment' | 'cert_photo';

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  door_plate: '门牌照片',
  portrait: '人像照片',
  environment: '居住环境',
  cert_photo: '证照照片',
};

export interface Photo {
  id: string;
  recordId: string;
  type: PhotoType;
  dataUrl: string;
  remark: string;
  shootTime: string;
}

export interface Signature {
  id: string;
  recordId: string;
  signerName: string;
  relation: string;
  idCard: string;
  signatureData: string;
  isDelegate: boolean;
  refuseReason?: string;
}

export type AnomalyType = 'suspicious_fraud' | 'info_mismatch' | 'refuse_cooperate' | 'other';
export type AnomalyStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  suspicious_fraud: '疑似冒领套领',
  info_mismatch: '信息不符',
  refuse_cooperate: '拒绝配合',
  other: '其他异常',
};

export const ANOMALY_STATUS_LABELS: Record<AnomalyStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已处理',
  rejected: '已驳回',
};

export const ANOMALY_STATUS_COLORS: Record<AnomalyStatus, string> = {
  pending: 'bg-warning-100 text-warning-600',
  processing: 'bg-primary-100 text-primary-600',
  resolved: 'bg-success-100 text-success-600',
  rejected: 'bg-neutral-100 text-neutral-600',
};

export interface AnomalyReport {
  id: string;
  recordId: string;
  taskId: string;
  type: AnomalyType;
  description: string;
  status: AnomalyStatus;
  reportTime: string;
  feedback?: string;
  evidencePhotos?: string[];
}

export interface VerifyRecord {
  id: string;
  taskId: string;
  verifyTime: string;
  conclusion: VerifyConclusion;
  differenceMark: string;
  operatorId: string;
  isSynced: boolean;
  photos: Photo[];
  signature?: Signature;
  anomalyReport?: AnomalyReport;
  actualSituation?: Record<string, string>;
}

export interface FollowupRecord {
  id: string;
  taskId: string;
  followTime: string;
  content: string;
  result: string;
  operatorId: string;
  photos?: Photo[];
}

export interface Statistics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
  anomalyCount: number;
  byCommunity: Record<string, { total: number; completed: number }>;
}

export const REFUSE_REASONS = [
  '行动不便无法签名',
  '意识不清无法授权',
  '拒绝配合核验',
  '不在家',
  '其他原因',
];

export const DELEGATE_RELATIONS = [
  '配偶',
  '子女',
  '父母',
  '兄弟姐妹',
  '其他亲属',
  '邻居/朋友',
  '社区工作人员',
];
