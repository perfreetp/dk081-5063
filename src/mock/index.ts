import { fakerZH_CN as faker } from '@faker-js/faker';
import type {
  User,
  Task,
  Person,
  Certificate,
  VerifyRecord,
  AnomalyReport,
  FollowupRecord,
  TaskType,
  TaskPriority,
  TaskStatus,
  CertType,
} from '@/types';
import { getDB } from '@/db';

const COMMUNITIES = ['东风社区', '和平社区', '新华社区', '红旗社区', '跃进社区'];
const STREETS = ['东风街道', '和平街道'];

function generateId(): string {
  return faker.string.uuid();
}

function generateIdCard(): string {
  const areaCode = '320102';
  const birthday = faker.date.birthdate({ min: 55, max: 90, mode: 'age' });
  const year = birthday.getFullYear();
  const month = String(birthday.getMonth() + 1).padStart(2, '0');
  const day = String(birthday.getDate()).padStart(2, '0');
  const sequence = faker.string.numeric(3);
  const checkCode = faker.string.numeric(1);
  return `${areaCode}${year}${month}${day}${sequence}${checkCode}`;
}

function generatePhone(): string {
  return `1${faker.number.int({ min: 30, max: 99 })}${faker.string.numeric(8)}`;
}

export function generateUser(): User {
  const community = faker.helpers.arrayElement(COMMUNITIES);
  return {
    id: generateId(),
    employeeNo: `GW${faker.string.numeric(6)}`,
    name: faker.person.lastName() + faker.person.firstName(),
    community,
    role: 'worker',
  };
}

export function generatePerson(community: string): Person {
  const gender = faker.helpers.arrayElement(['男', '女'] as const);
  const age = faker.number.int({ min: 55, max: 90 });
  return {
    id: generateId(),
    name: faker.person.lastName() + faker.person.firstName(),
    idCard: generateIdCard(),
    address: `${community}${faker.number.int({ min: 1, max: 30 })}栋${faker.number.int({ min: 1, max: 6 })}单元${faker.number.int({ min: 101, max: 602 })}`,
    community,
    age,
    phone: generatePhone(),
    gender,
  };
}

export function generateCertificate(personId: string, type: CertType): Certificate {
  const now = new Date();
  const issueDate = faker.date.past({ years: 3 });
  const expireDate = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());

  const infoMap: Record<CertType, Record<string, string>> = {
    id_card: {
      民族: faker.helpers.arrayElement(['汉', '回', '满']),
      出生: issueDate.toLocaleDateString('zh-CN'),
      住址: `${faker.location.city()}${faker.location.streetAddress()}`,
      签发机关: `${faker.location.city()}公安局`,
    },
    elderly_card: {
      等级: faker.helpers.arrayElement(['普通', '优待']),
      发放单位: '民政局',
    },
    disability_card: {
      残疾类别: faker.helpers.arrayElement(['肢体残疾', '视力残疾', '听力残疾']),
      残疾等级: faker.helpers.arrayElement(['一级', '二级', '三级', '四级']),
      监护人: faker.person.fullName(),
    },
    low_income: {
      保障人数: String(faker.number.int({ min: 1, max: 3 })),
      月保障金: `¥${faker.number.int({ min: 500, max: 1500 })}`,
      起始日期: issueDate.toLocaleDateString('zh-CN'),
    },
    medical: {
      医保类型: faker.helpers.arrayElement(['职工医保', '居民医保']),
      定点医院: faker.helpers.arrayElement(['市第一人民医院', '市中医院', '社区医院']),
    },
  };

  return {
    id: generateId(),
    personId,
    type,
    certNo: faker.string.alphanumeric({ casing: 'upper', length: 10 }),
    issueDate: issueDate.toISOString().split('T')[0],
    expireDate: expireDate.toISOString().split('T')[0],
    status: faker.helpers.arrayElement(['valid', 'valid', 'valid', 'expired']),
    info: infoMap[type],
  };
}

export function generateTask(userId: string, person: Person, index: number): Task {
  const types: TaskType[] = ['allowance', 'subsidy', 'elderly', 'disability'];
  const priorities: TaskPriority[] = ['high', 'normal', 'normal', 'normal', 'low'];
  const statuses: TaskStatus[] = ['pending', 'pending', 'pending', 'in_progress', 'completed'];

  const type = types[index % types.length];
  const priority = priorities[index % priorities.length];
  const status = index < 3 ? 'completed' : statuses[index % statuses.length];

  const certsMap: Record<TaskType, CertType[]> = {
    allowance: ['id_card', 'low_income'],
    subsidy: ['id_card', 'medical'],
    elderly: ['id_card', 'elderly_card'],
    disability: ['id_card', 'disability_card'],
  };

  const today = new Date().toISOString().split('T')[0];

  return {
    id: generateId(),
    personId: person.id,
    userId,
    type,
    status: status as TaskStatus,
    verifyDate: today,
    priority: priority as TaskPriority,
    allowedCerts: certsMap[type],
    person,
    remark: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
  };
}

export function generateVerifyRecord(task: Task): VerifyRecord {
  const conclusions = ['pass', 'pass', 'pass', 'review', 'reject'] as const;
  const conclusion = conclusions[faker.number.int({ min: 0, max: 4 })];

  return {
    id: generateId(),
    taskId: task.id,
    verifyTime: faker.date.recent({ days: 1 }).toISOString(),
    conclusion,
    differenceMark: conclusion === 'pass' ? '' : faker.lorem.sentence(),
    operatorId: task.userId,
    isSynced: faker.datatype.boolean({ probability: 0.8 }),
    photos: [],
  };
}

export function generateAnomalyReport(taskId: string, recordId: string): AnomalyReport {
  const types = ['suspicious_fraud', 'info_mismatch', 'refuse_cooperate', 'other'] as const;
  const statuses = ['pending', 'processing', 'resolved'] as const;

  return {
    id: generateId(),
    recordId,
    taskId,
    type: types[faker.number.int({ min: 0, max: 3 })],
    description: faker.lorem.paragraph({ min: 2, max: 4 }),
    status: statuses[faker.number.int({ min: 0, max: 2 })],
    reportTime: faker.date.recent({ days: 7 }).toISOString(),
    feedback: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.5 }),
  };
}

export function generateFollowupRecord(taskId: string, operatorId: string): FollowupRecord {
  return {
    id: generateId(),
    taskId,
    followTime: faker.date.recent({ days: 3 }).toISOString(),
    content: faker.lorem.paragraph({ min: 1, max: 3 }),
    result: faker.helpers.arrayElement(['已完成整改', '继续跟进', '无需处理']),
    operatorId,
  };
}

export async function seedMockData(): Promise<void> {
  const db = getDB();

  const existingUsers = await db.getAll('users');
  if (existingUsers.length > 0) {
    return;
  }

  const user = generateUser();
  await db.put('users', user);

  const communities = [user.community, COMMUNITIES[(COMMUNITIES.indexOf(user.community) + 1) % COMMUNITIES.length]];
  const persons: Person[] = [];

  for (let i = 0; i < 18; i++) {
    const community = communities[i % communities.length];
    const person = generatePerson(community);
    persons.push(person);
    await db.put('persons', person);

    const certTypes: CertType[] = ['id_card', 'elderly_card', 'disability_card', 'low_income', 'medical'];
    const numCerts = faker.number.int({ min: 2, max: 4 });
    const selectedCerts = faker.helpers.arrayElements(certTypes, numCerts);
    for (const certType of selectedCerts) {
      const cert = generateCertificate(person.id, certType);
      await db.put('certificates', cert);
    }
  }

  for (let i = 0; i < 15; i++) {
    const task = generateTask(user.id, persons[i], i);
    await db.put('tasks', task);

    if (task.status === 'completed') {
      const record = generateVerifyRecord(task);
      await db.put('verifyRecords', record);

      if (task.priority === 'high' || record.conclusion !== 'pass') {
        const anomaly = generateAnomalyReport(task.id, record.id);
        await db.put('anomalyReports', anomaly);
      }

      if (faker.datatype.boolean({ probability: 0.4 })) {
        const followup = generateFollowupRecord(task.id, user.id);
        await db.put('followupRecords', followup);
      }
    }
  }

  localStorage.setItem('currentUser', JSON.stringify(user));
}

export async function getCurrentUser(): Promise<User | null> {
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem('currentUser');
}

export async function login(employeeNo: string, _password: string): Promise<User | null> {
  const db = getDB();
  try {
    const user = await db.getFromIndex('users', 'by-employeeNo', employeeNo);
    if (user) {
      setCurrentUser(user);
      return user;
    }
  } catch (e) {
    console.error('Login error:', e);
  }
  return null;
}
