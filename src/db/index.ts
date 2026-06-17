import { openDB, IDBPDatabase } from 'idb';
import type {
  Task,
  Person,
  Certificate,
  VerifyRecord,
  Photo,
  Signature,
  AnomalyReport,
  FollowupRecord,
  User,
} from '@/types';

const DB_NAME = 'verify-terminal-db';
const DB_VERSION = 1;

export interface DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-employeeNo': string };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-userId': string; 'by-status': string; 'by-verifyDate': string };
  };
  persons: {
    key: string;
    value: Person;
    indexes: { 'by-name': string; 'by-idCard': string; 'by-community': string };
  };
  certificates: {
    key: string;
    value: Certificate;
    indexes: { 'by-personId': string; 'by-type': string };
  };
  verifyRecords: {
    key: string;
    value: VerifyRecord;
    indexes: { 'by-taskId': string; 'by-isSynced': string };
  };
  photos: {
    key: string;
    value: Photo;
    indexes: { 'by-recordId': string; 'by-type': string };
  };
  signatures: {
    key: string;
    value: Signature;
    indexes: { 'by-recordId': string };
  };
  anomalyReports: {
    key: string;
    value: AnomalyReport;
    indexes: { 'by-recordId': string; 'by-taskId': string; 'by-status': string };
  };
  followupRecords: {
    key: string;
    value: FollowupRecord;
    indexes: { 'by-taskId': string };
  };
}

let db: IDBPDatabase<DBSchema> | null = null;

export async function initDB(): Promise<IDBPDatabase<DBSchema>> {
  if (db) return db;

  db = await openDB<DBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        const usersStore = db.createObjectStore('users', { keyPath: 'id' });
        usersStore.createIndex('by-employeeNo', 'employeeNo', { unique: true });
      }

      if (!db.objectStoreNames.contains('tasks')) {
        const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
        tasksStore.createIndex('by-userId', 'userId');
        tasksStore.createIndex('by-status', 'status');
        tasksStore.createIndex('by-verifyDate', 'verifyDate');
      }

      if (!db.objectStoreNames.contains('persons')) {
        const personsStore = db.createObjectStore('persons', { keyPath: 'id' });
        personsStore.createIndex('by-name', 'name');
        personsStore.createIndex('by-idCard', 'idCard', { unique: true });
        personsStore.createIndex('by-community', 'community');
      }

      if (!db.objectStoreNames.contains('certificates')) {
        const certsStore = db.createObjectStore('certificates', { keyPath: 'id' });
        certsStore.createIndex('by-personId', 'personId');
        certsStore.createIndex('by-type', 'type');
      }

      if (!db.objectStoreNames.contains('verifyRecords')) {
        const recordsStore = db.createObjectStore('verifyRecords', { keyPath: 'id' });
        recordsStore.createIndex('by-taskId', 'taskId');
        recordsStore.createIndex('by-isSynced', 'isSynced');
      }

      if (!db.objectStoreNames.contains('photos')) {
        const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
        photosStore.createIndex('by-recordId', 'recordId');
        photosStore.createIndex('by-type', 'type');
      }

      if (!db.objectStoreNames.contains('signatures')) {
        const sigsStore = db.createObjectStore('signatures', { keyPath: 'id' });
        sigsStore.createIndex('by-recordId', 'recordId');
      }

      if (!db.objectStoreNames.contains('anomalyReports')) {
        const reportsStore = db.createObjectStore('anomalyReports', { keyPath: 'id' });
        reportsStore.createIndex('by-recordId', 'recordId');
        reportsStore.createIndex('by-taskId', 'taskId');
        reportsStore.createIndex('by-status', 'status');
      }

      if (!db.objectStoreNames.contains('followupRecords')) {
        const followupStore = db.createObjectStore('followupRecords', { keyPath: 'id' });
        followupStore.createIndex('by-taskId', 'taskId');
      }
    },
  });

  return db;
}

export function getDB(): IDBPDatabase<DBSchema> {
  if (!db) {
    throw new Error('Database not initialized. Call initDB first.');
  }
  return db;
}

export async function closeDB(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
