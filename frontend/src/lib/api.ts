import type { AcademicRequestType, Admin, AuthUser, ClassSession, CourseRegistration, MakeUpSchedule, ParentOverview, Payment, Program, ScheduleChangeReason, ScheduleChangeRequest, Student, StudentAbsence, Teacher, TeacherAttendance, TeacherPayroll } from '../types';

const API_BASE_URL = '/backend-api/v1';

type LaravelErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

type Resource<T> = { data: T };
type Collection<T> = { data: T[]; meta?: { current_page: number; last_page: number; total: number } };

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new ApiError('Backend Laravel tidak dapat dihubungi. Pastikan php artisan serve sedang berjalan.', 0);
  }

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({})) as LaravelErrorBody;
  if (!response.ok) {
    const validationMessage = body.errors ? Object.values(body.errors).flat()[0] : undefined;
    throw new ApiError(validationMessage ?? body.message ?? 'Permintaan ke server gagal.', response.status);
  }

  return body as T;
}

function resource<T>(promise: Promise<Resource<T>>): Promise<T> {
  return promise.then((response) => response.data);
}

function collection<T>(promise: Promise<Collection<T>>): Promise<T[]> {
  return promise.then((response) => response.data);
}

export type LoginResponse = { message: string; token: string; tokenType: 'Bearer'; user: AuthUser };
export type WorkspaceResponse = {
  user: AuthUser;
  programs: Program[];
  students: Student[];
  teachers: Teacher[];
  sessions: ClassSession[];
  payments: Payment[];
  admins: Admin[];
  registrations: CourseRegistration[];
  teacherAttendances: TeacherAttendance[];
  studentAbsences: StudentAbsence[];
  makeUpSchedules: MakeUpSchedule[];
  teacherPayrolls: TeacherPayroll[];
  scheduleChangeRequests: ScheduleChangeRequest[];
};

export type ScheduleChangeRequestPayload = {
  requestType: AcademicRequestType;
  studentId: string;
  currentSessionId?: string;
  currentDay?: string;
  currentTime?: string;
  requestedDay?: string;
  requestedTime?: string;
  requestedProgramId?: string;
  reason: ScheduleChangeReason;
  details: string;
};

function appendFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value === 'boolean') formData.append(key, value ? '1' : '0');
  else formData.append(key, String(value));
}

function studentFormData(data: Partial<Student>, method?: 'PUT') {
  const formData = new FormData();
  const fields: Array<keyof Student> = [
    'fullName', 'birthPlace', 'birthDate', 'parentName', 'address', 'phone', 'programId',
    'currentLevel', 'levelStartedAt', 'levelDurationMonths', 'sessionsPerWeek', 'packageStartedAt', 'packageEndsAt', 'registrationFee',
    'bookFee', 'otherFee', 'discount', 'feeNotes', 'joinDate', 'teacherId', 'notes',
  ];
  fields.forEach((field) => appendFormValue(formData, field, data[field]));
  (data.schedules ?? []).forEach((schedule, index) => {
    formData.append(`schedules[${index}][day]`, schedule.day);
    formData.append(`schedules[${index}][time]`, schedule.time);
  });
  if (data.photoFile) formData.append('photo', data.photoFile);
  if (method) formData.append('_method', method);
  return formData;
}

function teacherFormData(data: Partial<Teacher>, method?: 'PUT') {
  const formData = new FormData();
  const fields: Array<keyof Teacher> = [
    'fullName', 'address', 'birthPlace', 'birthDate', 'religion', 'email', 'phone',
    'emergencyContactName', 'emergencyContactPhone', 'lastEducation', 'joinDate',
    'employmentType', 'notes',
  ];
  fields.forEach((field) => appendFormValue(formData, field, data[field]));
  if (data.photoFile) formData.append('photo', data.photoFile);
  if (method) formData.append('_method', method);
  return formData;
}

export type CourseRegistrationPayload = {
  parentName: string;
  email?: string;
  phone: string;
  childName: string;
  childAge: number;
  address: string;
  programSelections?: Array<{ programId: string; months: number }>;
  programId?: string;
  password?: string;
  preferredSchedules: Array<{ day: string; time: string }>;
  notes?: string;
};

export type RegistrationResponse = { message: string; registration: CourseRegistration };

export const api = {
  loginAdmin: (email: string, password: string) => request<LoginResponse>('/auth/admin/login', undefined, {
    method: 'POST',
    body: JSON.stringify({ email, password, deviceName: 'edglo-admin-web' }),
  }),
  loginParent: (email: string, password: string) => request<LoginResponse>('/auth/parent/login', undefined, {
    method: 'POST',
    body: JSON.stringify({ email, password, deviceName: 'edglo-parent-web' }),
  }),
  workspace: (token: string) => resource(request<Resource<WorkspaceResponse>>('/workspace', token)),
  me: (token: string) => resource(request<Resource<AuthUser>>('/auth/me', token)),
  logout: (token: string) => request<{ message: string }>('/auth/logout', token, { method: 'POST' }),
  registerCourse: (data: CourseRegistrationPayload) => request<RegistrationResponse>('/registrations', undefined, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  parentOverview: (token: string) => resource(request<Resource<ParentOverview>>('/parent/overview', token)),
  createAcademicRequest: (token: string, data: ScheduleChangeRequestPayload) => resource(request<Resource<ScheduleChangeRequest>>('/parent/academic-requests', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })),
  updateProfile: (token: string, data: Pick<AuthUser, 'name' | 'email' | 'phone'>) =>
    resource(request<Resource<AuthUser>>('/auth/profile', token, { method: 'PATCH', body: JSON.stringify(data) })),
  updatePassword: (token: string, currentPassword: string, password: string, confirmation: string) =>
    request<{ message: string }>('/auth/password', token, {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, password, password_confirmation: confirmation }),
    }),

  programs: (token: string) => collection(request<Collection<Program>>('/programs?per_page=100', token)),
  students: (token: string) => collection(request<Collection<Student>>('/students?per_page=100', token)),
  teachers: (token: string) => collection(request<Collection<Teacher>>('/teachers?per_page=100', token)),
  sessions: (token: string) => collection(request<Collection<ClassSession>>('/class-sessions?per_page=100', token)),
  payments: (token: string) => collection(request<Collection<Payment>>('/payments?per_page=100', token)),
  admins: (token: string) => collection(request<Collection<Admin>>('/admins?per_page=100', token)),
  registrations: (token: string) => collection(request<Collection<CourseRegistration>>('/registrations?per_page=100', token)),

  createStudent: (token: string, data: Partial<Student>) => resource(request<Resource<Student>>('/students', token, { method: 'POST', body: studentFormData(data) })),
  updateStudent: (token: string, id: string, data: Partial<Student>) => resource(request<Resource<Student>>(`/students/${id}`, token, { method: 'POST', body: studentFormData(data, 'PUT') })),
  changeStudentStatus: (token: string, student: Student) => {
    const history = student.statusHistory.at(-1);
    return resource(request<Resource<Student>>(`/students/${student.id}/${student.status === 'off' ? 'deactivate' : 'activate'}`, token, {
      method: 'POST',
      body: JSON.stringify({ date: history?.date, reason: history?.reason }),
    }));
  },
  createTeacher: (token: string, data: Partial<Teacher>) => resource(request<Resource<Teacher>>('/teachers', token, { method: 'POST', body: teacherFormData(data) })),
  updateTeacher: (token: string, id: string, data: Partial<Teacher>) => resource(request<Resource<Teacher>>(`/teachers/${id}`, token, { method: 'POST', body: teacherFormData(data, 'PUT') })),
  changeTeacherStatus: (token: string, teacher: Teacher) => {
    const history = teacher.statusHistory.at(-1);
    return resource(request<Resource<Teacher>>(`/teachers/${teacher.id}/${teacher.status === 'off' ? 'deactivate' : 'activate'}`, token, {
      method: 'POST',
      body: JSON.stringify({ date: history?.date, reason: history?.reason }),
    }));
  },
  createSession: (token: string, data: Partial<ClassSession>) => resource(request<Resource<ClassSession>>('/class-sessions', token, { method: 'POST', body: JSON.stringify(data) })),
  updateSession: (token: string, id: string, data: Partial<ClassSession>) => resource(request<Resource<ClassSession>>(`/class-sessions/${id}`, token, { method: 'PUT', body: JSON.stringify(data) })),
  deleteSession: (token: string, id: string) => request<{ message: string }>(`/class-sessions/${id}`, token, { method: 'DELETE' }),
  createPayment: (token: string, data: Partial<Payment>) => resource(request<Resource<Payment>>('/payments', token, { method: 'POST', body: JSON.stringify(data) })),
  markPaymentPaid: (token: string, payment: Payment) => resource(request<Resource<Payment>>(`/payments/${payment.id}/mark-paid`, token, { method: 'POST', body: JSON.stringify({ paid_date: payment.paidDate, notes: payment.notes }) })),
  createAdmin: (token: string, data: Record<string, unknown>) => resource(request<Resource<Admin>>('/admins', token, { method: 'POST', body: JSON.stringify(data) })),
  updateAdmin: (token: string, id: string, data: Record<string, unknown>) => resource(request<Resource<Admin>>(`/admins/${id}`, token, { method: 'PUT', body: JSON.stringify(data) })),
  deleteAdmin: (token: string, id: string) => request<{ message: string }>(`/admins/${id}`, token, { method: 'DELETE' }),
  approveRegistration: (token: string, id: string, adminNotes = '') => resource(request<Resource<CourseRegistration>>(`/registrations/${id}/approve`, token, {
    method: 'POST',
    body: JSON.stringify({ adminNotes: adminNotes || undefined }),
  })),
  rejectRegistration: (token: string, id: string, adminNotes: string) => resource(request<Resource<CourseRegistration>>(`/registrations/${id}/reject`, token, {
    method: 'POST',
    body: JSON.stringify({ adminNotes }),
  })),
  approveScheduleChangeRequest: (token: string, id: string, adminNotes = '') => resource(request<Resource<ScheduleChangeRequest>>(`/academic-requests/${id}/approve`, token, {
    method: 'POST',
    body: JSON.stringify({ adminNotes: adminNotes || undefined }),
  })),
  rejectScheduleChangeRequest: (token: string, id: string, adminNotes: string) => resource(request<Resource<ScheduleChangeRequest>>(`/academic-requests/${id}/reject`, token, {
    method: 'POST',
    body: JSON.stringify({ adminNotes }),
  })),
  saveTeacherAttendance: (token: string, data: Partial<TeacherAttendance>) => resource(request<Resource<TeacherAttendance>>('/teacher-attendances', token, { method: 'POST', body: JSON.stringify(data) })),
  deleteTeacherAttendance: (token: string, id: string) => request<{ message: string }>(`/teacher-attendances/${id}`, token, { method: 'DELETE' }),
  saveStudentAbsence: (token: string, data: Partial<StudentAbsence>) => resource(request<Resource<StudentAbsence>>('/student-absences', token, { method: 'POST', body: JSON.stringify(data) })),
  deleteStudentAbsence: (token: string, id: string) => request<{ message: string }>(`/student-absences/${id}`, token, { method: 'DELETE' }),
  createMakeUpSchedule: (token: string, data: Partial<MakeUpSchedule>) => resource(request<Resource<MakeUpSchedule>>('/make-up-schedules', token, { method: 'POST', body: JSON.stringify(data) })),
  updateMakeUpSchedule: (token: string, id: string, data: Partial<MakeUpSchedule>) => resource(request<Resource<MakeUpSchedule>>(`/make-up-schedules/${id}`, token, { method: 'PUT', body: JSON.stringify(data) })),
  deleteMakeUpSchedule: (token: string, id: string) => request<{ message: string }>(`/make-up-schedules/${id}`, token, { method: 'DELETE' }),
  saveTeacherPayroll: (token: string, data: Partial<TeacherPayroll>) => resource(request<Resource<TeacherPayroll>>('/teacher-payrolls', token, { method: 'POST', body: JSON.stringify(data) })),
  deleteTeacherPayroll: (token: string, id: string) => request<{ message: string }>(`/teacher-payrolls/${id}`, token, { method: 'DELETE' }),
};
