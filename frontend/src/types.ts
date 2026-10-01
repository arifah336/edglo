export type UserRole = 'super_admin' | 'admin';
export type StudentStatus = 'active' | 'off';
export type AccountRole = UserRole | 'parent';
export type TeacherStatus = 'active' | 'off';
export type EmploymentType = 'fulltime' | 'parttime' | 'magang';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type MakeUpStatus = 'scheduled' | 'completed' | 'cancelled';
export type PayrollStatus = 'draft' | 'final' | 'paid';
export type ScheduleChangeRequestStatus = 'pending' | 'approved' | 'rejected';
export type AcademicRequestType = 'change_schedule' | 'add_schedule' | 'change_program';
export type ScheduleChangeReason = 'school_conflict' | 'family' | 'transport' | 'health' | 'learning_need' | 'package_adjustment' | 'other';

export type Page =
  | 'dashboard'
  | 'registrations'
  | 'students'
  | 'student-form'
  | 'student-detail'
  | 'student-activation'
  | 'teachers'
  | 'teacher-form'
  | 'teacher-detail'
  | 'teacher-activation'
  | 'attendance'
  | 'payroll'
  | 'schedule'
  | 'schedule-requests'
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

export type ProgramSelection = {
  programId: string;
  programName?: string;
  months: number;
  sessionsPerWeek?: number;
  monthlyPrice?: number;
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
  birthPlace?: string;
  birthDate?: string;
  parentName: string;
  address: string;
  phone: string;
  photo?: string;
  photoFile?: File;
  programId: string;
  program?: Program;
  sessionsPerWeek: number;
  packageStartedAt?: string;
  packageEndsAt?: string;
  packageSelections?: ProgramSelection[];
  currentLevel?: string;
  levelStartedAt?: string;
  levelDurationMonths?: number;
  registrationFee?: number;
  bookFee?: number;
  otherFee?: number;
  discount?: number;
  feeNotes?: string;
  joinDate: string;
  leaveDate?: string;
  teacherId: string | null;
  teacher?: { id: string; fullName: string } | null;
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
  photoFile?: File;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  employmentType: EmploymentType;
  notes?: string;
  status: TeacherStatus;
  statusHistory: StatusHistory[];
};

export type Admin = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
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
  otherFee?: number;
  discount?: number;
  total: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  notes?: string;
};

export type TeacherAttendance = {
  id: string;
  teacherId: string;
  teacherName?: string;
  classSessionId: string;
  session?: { day: string; time: string; room: string };
  attendanceDate: string;
  status: AttendanceStatus;
  notes?: string;
  recordedBy?: string;
};

export type MakeUpSchedule = {
  id: string;
  studentAbsenceId: string;
  studentId: string;
  studentName?: string;
  teacherId: string;
  teacherName?: string;
  originalSessionId: string;
  scheduledDate: string;
  time: string;
  room: string;
  status: MakeUpStatus;
  notes?: string;
};

export type StudentAbsence = {
  id: string;
  studentId: string;
  studentName?: string;
  classSessionId: string;
  session?: { day: string; time: string; teacherId: string; teacherName?: string; room: string };
  absenceDate: string;
  reason?: string;
  status: 'open' | 'replacement_scheduled' | 'completed' | 'cancelled';
  makeUpSchedule?: MakeUpSchedule;
};

export type TeacherPayroll = {
  id: string;
  teacherId: string;
  teacherName?: string;
  employmentType?: EmploymentType;
  month: number;
  year: number;
  attendanceCount: number;
  ratePerSession: number;
  baseSalary: number;
  allowance: number;
  deduction: number;
  total: number;
  status: PayrollStatus;
  notes?: string;
};

export type CourseRegistrationStatus = 'pending' | 'approved' | 'rejected';
export type PreferredSchedule = { day: string; time?: string };

export type CourseRegistration = {
  id: string;
  parent: { id: string; name: string; email?: string; phone?: string };
  programId: string;
  program?: Program;
  programSelections: ProgramSelection[];
  studentId?: string;
  childName: string;
  childAge: number;
  address: string;
  preferredDays: string[];
  preferredTime?: string;
  preferredSchedules: PreferredSchedule[];
  notes?: string;
  status: CourseRegistrationStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
};

export type ParentSession = {
  id: string;
  day: string;
  time: string;
  teacherName: string;
  programName: string;
  room: string;
  studentIds: string[];
  isClassSession?: boolean;
};

export type ScheduleChangeRequest = {
  id: string;
  parent?: { id: string; name: string; email: string; phone?: string };
  studentId: string;
  studentName?: string;
  requestType: AcademicRequestType;
  teacherName?: string;
  programName?: string;
  requestedProgramId?: string;
  requestedProgramName?: string;
  currentSessionId?: string;
  targetSessionId?: string;
  currentDay?: string;
  currentTime?: string;
  requestedDay?: string;
  requestedTime?: string;
  reason: ScheduleChangeReason;
  details: string;
  status: ScheduleChangeRequestStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
};

export type ParentOverview = {
  user: AuthUser;
  registrations: CourseRegistration[];
  students: Student[];
  sessions: ParentSession[];
  payments: Payment[];
  programs: Program[];
  scheduleChangeRequests: ScheduleChangeRequest[];
};
