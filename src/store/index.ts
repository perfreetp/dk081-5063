import { create } from 'zustand';
import type {
  User,
  Task,
  Certificate,
  VerifyRecord,
  Photo,
  Signature,
  AnomalyReport,
  FollowupRecord,
  Statistics,
  VerifyConclusion,
  AnomalyType,
} from '@/types';
import { getDB } from '@/db';
import { getCurrentUser, clearCurrentUser } from '@/mock';

interface AppState {
  user: User | null;
  tasks: Task[];
  certificates: Certificate[];
  verifyRecords: VerifyRecord[];
  anomalyReports: AnomalyReport[];
  followupRecords: FollowupRecord[];
  isOnline: boolean;
  isLoading: boolean;
  currentTask: Task | null;
  currentVerifyRecord: VerifyRecord | null;
  unsyncedCount: number;

  setUser: (user: User | null) => void;
  logout: () => void;
  loadInitialData: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadCertificates: (personId: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  createVerifyRecord: (taskId: string) => Promise<VerifyRecord>;
  updateVerifyRecord: (recordId: string, updates: Partial<VerifyRecord>) => Promise<void>;
  addPhoto: (recordId: string, photo: Photo) => Promise<void>;
  removePhoto: (photoId: string) => Promise<void>;
  saveSignature: (recordId: string, signature: Signature) => Promise<void>;
  createAnomalyReport: (report: Omit<AnomalyReport, 'id' | 'reportTime' | 'status'>) => Promise<AnomalyReport>;
  createFollowupRecord: (record: Omit<FollowupRecord, 'id'>) => Promise<FollowupRecord>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  syncData: () => Promise<void>;
  getStatistics: () => Statistics;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  tasks: [],
  certificates: [],
  verifyRecords: [],
  anomalyReports: [],
  followupRecords: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isLoading: false,
  currentTask: null,
  currentVerifyRecord: null,
  unsyncedCount: 0,

  setUser: (user) => set({ user }),

  logout: () => {
    clearCurrentUser();
    set({
      user: null,
      tasks: [],
      certificates: [],
      verifyRecords: [],
      anomalyReports: [],
      followupRecords: [],
      currentTask: null,
      currentVerifyRecord: null,
    });
  },

  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      if (user) {
        set({ user });
        await get().loadTasks();

        const db = getDB();
        const [records, anomalies, followups] = await Promise.all([
          db.getAll('verifyRecords'),
          db.getAll('anomalyReports'),
          db.getAll('followupRecords'),
        ]);

        const unsyncedCount = records.filter((r) => !r.isSynced).length;

        set({
          verifyRecords: records,
          anomalyReports: anomalies,
          followupRecords: followups,
          unsyncedCount,
        });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadTasks: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const db = getDB();
      const allTasks = await db.getAll('tasks');
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = allTasks.filter(
        (t) => t.userId === user.id && t.verifyDate === today
      );

      const sortedTasks = [...todayTasks].sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      set({ tasks: sortedTasks });
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  },

  loadCertificates: async (personId: string) => {
    try {
      const db = getDB();
      const certs = await db.getAllFromIndex('certificates', 'by-personId', personId);
      set({ certificates: certs });
    } catch (error) {
      console.error('Error loading certificates:', error);
    }
  },

  setCurrentTask: (task) => {
    set({ currentTask: task, currentVerifyRecord: null, certificates: [] });
    if (task) {
      get().loadCertificates(task.personId);
    }
  },

  createVerifyRecord: async (taskId: string) => {
    const { user } = get();
    const db = getDB();

    const newRecord: VerifyRecord = {
      id: crypto.randomUUID(),
      taskId,
      verifyTime: new Date().toISOString(),
      conclusion: 'pass',
      differenceMark: '',
      operatorId: user?.id || '',
      isSynced: !get().isOnline ? false : false,
      photos: [],
      actualSituation: {},
    };

    await db.put('verifyRecords', newRecord);

    set((state) => ({
      verifyRecords: [...state.verifyRecords, newRecord],
      currentVerifyRecord: newRecord,
      unsyncedCount: state.unsyncedCount + 1,
    }));

    return newRecord;
  },

  updateVerifyRecord: async (recordId: string, updates: Partial<VerifyRecord>) => {
    const db = getDB();
    const existing = await db.get('verifyRecords', recordId);

    if (!existing) return;

    const updated: VerifyRecord = {
      ...existing,
      ...updates,
      isSynced: false,
    };

    await db.put('verifyRecords', updated);

    set((state) => ({
      verifyRecords: state.verifyRecords.map((r) =>
        r.id === recordId ? updated : r
      ),
      currentVerifyRecord:
        state.currentVerifyRecord?.id === recordId
          ? updated
          : state.currentVerifyRecord,
      unsyncedCount: state.verifyRecords.filter((r) => !r.isSynced && r.id !== recordId)
        .length + (updated.isSynced ? 0 : 1),
    }));
  },

  addPhoto: async (recordId: string, photo: Photo) => {
    const db = getDB();
    await db.put('photos', photo);

    const record = await db.get('verifyRecords', recordId);
    if (record) {
      const updatedPhotos = [...record.photos, photo];
      await get().updateVerifyRecord(recordId, { photos: updatedPhotos });
    }
  },

  removePhoto: async (photoId: string) => {
    const db = getDB();
    const photo = await db.get('photos', photoId);
    if (!photo) return;

    await db.delete('photos', photoId);

    const record = await db.get('verifyRecords', photo.recordId);
    if (record) {
      const updatedPhotos = record.photos.filter((p) => p.id !== photoId);
      await get().updateVerifyRecord(photo.recordId, { photos: updatedPhotos });
    }
  },

  saveSignature: async (recordId: string, signature: Signature) => {
    const db = getDB();
    await db.put('signatures', signature);
    await get().updateVerifyRecord(recordId, { signature });
  },

  createAnomalyReport: async (
    report: Omit<AnomalyReport, 'id' | 'reportTime' | 'status'>
  ) => {
    const db = getDB();

    const newReport: AnomalyReport = {
      ...report,
      id: crypto.randomUUID(),
      reportTime: new Date().toISOString(),
      status: 'pending',
    };

    await db.put('anomalyReports', newReport);

    set((state) => ({
      anomalyReports: [...state.anomalyReports, newReport],
    }));

    return newReport;
  },

  createFollowupRecord: async (record: Omit<FollowupRecord, 'id'>) => {
    const db = getDB();

    const newRecord: FollowupRecord = {
      ...record,
      id: crypto.randomUUID(),
    };

    await db.put('followupRecords', newRecord);

    set((state) => ({
      followupRecords: [...state.followupRecords, newRecord],
    }));

    return newRecord;
  },

  updateTaskStatus: async (taskId: string, status: Task['status']) => {
    const db = getDB();
    const task = await db.get('tasks', taskId);

    if (!task) return;

    const updatedTask: Task = { ...task, status };
    await db.put('tasks', updatedTask);

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      currentTask:
        state.currentTask?.id === taskId ? updatedTask : state.currentTask,
    }));
  },

  syncData: async () => {
    if (!get().isOnline) {
      alert('当前无网络连接，请检查网络后重试');
      return;
    }

    set({ isLoading: true });
    try {
      const db = getDB();
      const unsyncedRecords = await db.getAllFromIndex(
        'verifyRecords',
        'by-isSynced',
        IDBKeyRange.only(false)
      );

      for (const record of unsyncedRecords) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const updated = { ...record, isSynced: true };
        await db.put('verifyRecords', updated);
      }

      set((state) => ({
        verifyRecords: state.verifyRecords.map((r) =>
          unsyncedRecords.find((u) => u.id === r.id) ? { ...r, isSynced: true } : r
        ),
        unsyncedCount: 0,
      }));

      alert(`同步完成，共同步 ${unsyncedRecords.length} 条记录`);
    } catch (error) {
      console.error('Sync error:', error);
      alert('同步失败，请稍后重试');
    } finally {
      set({ isLoading: false });
    }
  },

  getStatistics: () => {
    const { tasks, anomalyReports } = get();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const anomalyCount = anomalyReports.length;

    const byCommunity: Record<string, { total: number; completed: number }> = {};
    for (const task of tasks) {
      const community = task.person.community;
      if (!byCommunity[community]) {
        byCommunity[community] = { total: 0, completed: 0 };
      }
      byCommunity[community].total++;
      if (task.status === 'completed') {
        byCommunity[community].completed++;
      }
    }

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate,
      anomalyCount,
      byCommunity,
    };
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.setState({ isOnline: true });
  });

  window.addEventListener('offline', () => {
    useAppStore.setState({ isOnline: false });
  });
}
