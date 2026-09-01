import type { Admin, AuthUser, ClassSession, Payment, Program, Student, Teacher } from '../types';

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
export type BootstrapResponse = {
  user: AuthUser;
  programs: Program[];
  students: Student[];
  teachers: Teacher[];
  sessions: ClassSession[];
  payments: Payment[];
  admins: Admin[];
};

export const api = {
  login: (email: string, password: string) => request<LoginResponse>('/auth/login', undefined, {
    method: 'POST',
    body: JSON.stringify({ email, password, deviceName: 'edglo-nextjs' }),
  }),
  bootstrap: (token: string) => resource(request<Resource<BootstrapResponse>>('/bootstrap', token)),
  me: (token: string) => resource(request<Resource<AuthUser>>('/auth/me', token)),
  logout: (token: string) => request<{ message: string }>('/auth/logout', token, { method: 'POST' }),
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

  createStudent: (token: string, data: Partial<Student>) => resource(request<Resource<Student>>('/students', token, { method: 'POST', body: JSON.stringify(data) })),
  updateStudent: (token: string, id: string, data: Partial<Student>) => resource(request<Resource<Student>>(`/students/${id}`, token, { method: 'PUT', body: JSON.stringify(data) })),
  changeStudentStatus: (token: string, student: Student) => {
    const history = student.statusHistory.at(-1);
    return resource(request<Resource<Student>>(`/students/${student.id}/${student.status === 'off' ? 'deactivate' : 'activate'}`, token, {
      method: 'POST',
      body: JSON.stringify({ date: history?.date, reason: history?.reason }),
    }));
  },
  createTeacher: (token: string, data: Partial<Teacher>) => resource(request<Resource<Teacher>>('/teachers', token, { method: 'POST', body: JSON.stringify(data) })),
  updateTeacher: (token: string, id: string, data: Partial<Teacher>) => resource(request<Resource<Teacher>>(`/teachers/${id}`, token, { method: 'PUT', body: JSON.stringify(data) })),
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
};
