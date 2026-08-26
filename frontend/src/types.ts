export type UserRole = 'super_admin' | 'admin';
export type StudentStatus = 'active' | 'off';
export type TeacherStatus = 'active' | 'off';
export type EmploymentType = 'fulltime' | 'parttime' | 'magang';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export type Page =
  | 'dashboard'
  | 'students'
  | 'student-form'
  | 'student-detail'
  | 'student-activation'
  | 'teachers'
  | 'teacher-form'
  | 'teacher-detail'
  | 'teacher-activation'
  | 'schedule'
  | 'finance-monthly'
  | 'finance-yearly'
  | 'reports'
  | 'admin-management'
  | 'settings';

export type Program = {
  id: string;
  name: string;
  price: number;
  sessionsPerWeek: number;
};

export type DaySchedule = {
  day: string;
  time: string;
};

export type ClassSession = {
  id: string;
  day: string;
  time: string;
  teacherId: string;
  programId: string;
  studentIds: string[];
  room: string;
  capacity: number;
  notes?: string;
  isActive?: boolean;
};

export type AuthUser = Admin & {
  isActive: boolean;
  lastLoginAt?: string;
};

export type StatusHistory = {
  date: string;
  action: 'activated' | 'deactivated';
  reason?: string;
  by: string;
};

export type Student = {
  id: string;
  fullName: string;
  parentName: string;
  address: string;
  phone: string;
  photo?: string;
  programId: string;
  sessionsPerWeek: number;
  joinDate: string;
  leaveDate?: string;
  teacherId: string;
  schedules: DaySchedule[];
  notes?: string;
  status: StudentStatus;
  statusHistory: StatusHistory[];
};

export type Teacher = {
  id: string;
  fullName: string;
  address: string;
  birthPlace: string;
  birthDate: string;
  religion: string;
  email: string;
  phone: string;
  lastEducation: string;
  joinDate: string;
  leaveDate?: string;
  photo?: string;
  employmentType: EmploymentType;
  status: TeacherStatus;
  statusHistory: StatusHistory[];
};

export type Admin = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  hasPassword?: boolean;
  credentialsUpdatedAt?: string;
};

export type Payment = {
  id: string;
  studentId: string;
  month: number;
  year: number;
  programFee: number;
  registrationFee: number;
  bookFee: number;
  total: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  notes?: string;
};
