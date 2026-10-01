'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { Admin, ClassSession, CourseRegistration, MakeUpSchedule, Page, Payment, Program, ScheduleChangeRequest, Student, StudentAbsence, Teacher, TeacherAttendance, TeacherPayroll } from './types';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Students from './views/Students';
import Teachers from './views/Teachers';
import Schedule from './views/Schedule';
import Finance from './views/Finance';
import Reports from './views/Reports';
import AdminManagement from './views/AdminManagement';
import Settings from './views/Settings';
import Registrations from './views/Registrations';
import Attendance from './views/Attendance';
import Payroll from './views/Payroll';
import ScheduleRequests from './views/ScheduleRequests';
import { ApiError, api } from './lib/api';
import { useToast } from './components/ui/ToastProvider';
import SessionLoading from './components/auth/SessionLoading';
import { type AuthSession, getAuthSnapshot, getServerAuthSnapshot, parseAuthSession, subscribeAuth, writeAuthSession } from './lib/authSession';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan saat menghubungi server.';
}

function BackendLoading({ error, onRetry, onLogout }: { error?: string; onRetry: () => void; onLogout: () => void }) {
  return (
    <div className="backend-loading-screen" role={error ? 'alert' : 'status'} aria-live="polite">
      <div className="backend-loading-visual">
        <span className="backend-loading-ring" aria-hidden="true" />
        <Image className="backend-loading-logo" src="/edglo-logo.png" alt="EdGLO" width={512} height={512} priority />
      </div>
      <div className="backend-loading-copy">
        <strong>{error ? 'Data belum berhasil dimuat' : 'Menyiapkan EdGLO'}</strong>
        {error && <span>{error}</span>}
      </div>
      {error && <div className="backend-loading-actions"><button type="button" className="btn-secondary" onClick={onLogout}>Keluar</button><button type="button" className="btn-primary" onClick={onRetry}>Coba Lagi</button></div>}
    </div>
  );
}

function replaceById<T extends { id: string }>(items: T[], item: T, oldId = item.id) {
  return items.map((current) => current.id === oldId ? item : current);
}

export default function App() {
  const router = useRouter();
  const { notify } = useToast();
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const authSession = authSnapshot === null ? null : parseAuthSession(authSnapshot);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [navContext, setNavContext] = useState<{ id?: string }>({});
  const [dataReady, setDataReady] = useState(false);
  const [loadingError, setLoadingError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [teacherAttendances, setTeacherAttendances] = useState<TeacherAttendance[]>([]);
  const [studentAbsences, setStudentAbsences] = useState<StudentAbsence[]>([]);
  const [makeUpSchedules, setMakeUpSchedules] = useState<MakeUpSchedule[]>([]);
  const [teacherPayrolls, setTeacherPayrolls] = useState<TeacherPayroll[]>([]);
  const [scheduleChangeRequests, setScheduleChangeRequests] = useState<ScheduleChangeRequest[]>([]);
  const token = authSession?.token;
  const user = authSession?.user;
  const hasAuthSession = Boolean(authSession);

  const loadData = useCallback(async (session: AuthSession) => {
    setDataReady(false);
    setLoadingError('');
    try {
      const data = await api.workspace(session.token);
      writeAuthSession({ token: session.token, user: data.user });
      setPrograms(data.programs);
      setStudents(data.students);
      setTeachers(data.teachers);
      setClassSessions(data.sessions);
      setPayments(data.payments);
      setAdmins(data.admins);
      setRegistrations(data.registrations ?? []);
      setTeacherAttendances(data.teacherAttendances ?? []);
      setStudentAbsences(data.studentAbsences ?? []);
      setMakeUpSchedules(data.makeUpSchedules ?? []);
      setTeacherPayrolls(data.teacherPayrolls ?? []);
      setScheduleChangeRequests(data.scheduleChangeRequests ?? []);
      setDataReady(true);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        writeAuthSession();
        router.replace('/login');
      }
      else {
        const message = errorMessage(loadError);
        setLoadingError(message);
        notify({ tone: 'error', title: 'Data belum dapat dimuat', message });
      }
    }
  }, [notify, router]);

  useEffect(() => {
    if (authSnapshot !== null && !hasAuthSession) router.replace('/login');
    else if (authSession?.user.role === 'parent') router.replace('/parent');
  }, [authSnapshot, authSession?.user.role, hasAuthSession, router]);

  useEffect(() => {
    if (!authSession || authSession.user.role === 'parent') return;
    const timer = window.setTimeout(() => void loadData(authSession), 0);
    return () => window.clearTimeout(timer);
    // Token adalah identitas stabil sesi; pembaruan profil tidak perlu memuat ulang semua data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession?.token, loadData]);

  const handleLogout = async () => {
    const logoutToken = token;
    writeAuthSession();
    router.replace('/login');
    setDataReady(false);
    setLoadingError('');
    setStudents([]);
    setTeachers([]);
    setPrograms([]);
    setClassSessions([]);
    setPayments([]);
    setAdmins([]);
    setRegistrations([]);
    setTeacherAttendances([]);
    setStudentAbsences([]);
    setMakeUpSchedules([]);
    setTeacherPayrolls([]);
    setScheduleChangeRequests([]);
    setCurrentPage('dashboard');
    setNavContext({});
    if (logoutToken) await api.logout(logoutToken).catch(() => undefined);
  };

  const handleStudentsChange = async (next: Student[]) => {
    if (!token) return;
    const previous = students;
    setStudents(next);
    try {
      const created = next.find((item) => !previous.some((old) => old.id === item.id));
      const changed = next.find((item) => previous.some((old) => old.id === item.id) && JSON.stringify(item) !== JSON.stringify(previous.find((old) => old.id === item.id)));
      if (created) {
        const saved = await api.createStudent(token, created);
        setStudents((current) => replaceById(current, saved, created.id));
      }
      else if (changed) {
        const old = previous.find((item) => item.id === changed.id)!;
        const saved = old.status !== changed.status ? await api.changeStudentStatus(token, changed) : await api.updateStudent(token, changed.id, changed);
        setStudents((current) => replaceById(current, saved));
      }
    } catch (mutationError) {
      setStudents(previous);
      notify({ tone: 'error', title: 'Data murid gagal disimpan', message: errorMessage(mutationError) });
    }
  };

  const handleTeachersChange = async (next: Teacher[]) => {
    if (!token) return;
    const previous = teachers;
    setTeachers(next);
    try {
      const created = next.find((item) => !previous.some((old) => old.id === item.id));
      const changed = next.find((item) => previous.some((old) => old.id === item.id) && JSON.stringify(item) !== JSON.stringify(previous.find((old) => old.id === item.id)));
      if (created) {
        const saved = await api.createTeacher(token, created);
        setTeachers((current) => replaceById(current, saved, created.id));
      }
      else if (changed) {
        const old = previous.find((item) => item.id === changed.id)!;
        const saved = old.status !== changed.status ? await api.changeTeacherStatus(token, changed) : await api.updateTeacher(token, changed.id, changed);
        setTeachers((current) => replaceById(current, saved));
      }
    } catch (mutationError) {
      setTeachers(previous);
      notify({ tone: 'error', title: 'Data guru gagal disimpan', message: errorMessage(mutationError) });
    }
  };

  const handleSessionsChange = async (next: ClassSession[]) => {
    if (!token) return;
    const previous = classSessions;
    setClassSessions(next);
    try {
      const created = next.find((item) => !previous.some((old) => old.id === item.id));
      const removed = previous.find((item) => !next.some((current) => current.id === item.id));
      const changed = next.find((item) => previous.some((old) => old.id === item.id) && JSON.stringify(item) !== JSON.stringify(previous.find((old) => old.id === item.id)));
      if (removed) await api.deleteSession(token, removed.id);
      else if (created) {
        const saved = await api.createSession(token, created);
        setClassSessions((current) => replaceById(current, saved, created.id));
      } else if (changed) {
        const saved = await api.updateSession(token, changed.id, changed);
        setClassSessions((current) => replaceById(current, saved));
      }
      setStudents(await api.students(token));
    } catch (mutationError) {
      setClassSessions(previous);
      notify({ tone: 'error', title: 'Jadwal gagal disimpan', message: errorMessage(mutationError) });
    }
  };

  const handlePaymentsChange = async (next: Payment[]) => {
    if (!token) return;
    const previous = payments;
    setPayments(next);
    try {
      const created = next.find((item) => !previous.some((old) => old.id === item.id));
      const changed = next.find((item) => previous.some((old) => old.id === item.id) && JSON.stringify(item) !== JSON.stringify(previous.find((old) => old.id === item.id)));
      if (created) {
        const saved = await api.createPayment(token, created);
        setPayments((current) => replaceById(current, saved, created.id));
      } else if (changed?.status === 'paid') {
        const saved = await api.markPaymentPaid(token, changed);
        setPayments((current) => replaceById(current, saved));
      }
    } catch (mutationError) {
      setPayments(previous);
      notify({ tone: 'error', title: 'Tagihan gagal disimpan', message: errorMessage(mutationError) });
    }
  };

  const handleNavigate = (page: Page, id?: string) => {
    setCurrentPage(page);
    setNavContext({ id });
  };

  const handleApproveRegistration = async (id: string, note: string) => {
    if (!token) return;
    try {
      const saved = await api.approveRegistration(token, id, note);
      setRegistrations((current) => replaceById(current, saved));
      setStudents(await api.students(token));
      notify({ tone: 'success', title: 'Pendaftaran disetujui', message: 'Data murid sudah dibuat. Guru dan jadwal dapat ditentukan berikutnya.' });
    } catch (approvalError) {
      const message = errorMessage(approvalError);
      notify({ tone: 'error', title: 'Pendaftaran gagal disetujui', message });
      throw approvalError;
    }
  };

  const handleRejectRegistration = async (id: string, note: string) => {
    if (!token) return;
    try {
      const saved = await api.rejectRegistration(token, id, note);
      setRegistrations((current) => replaceById(current, saved));
      notify({ tone: 'success', title: 'Pendaftaran ditolak', message: 'Catatan penolakan tersimpan. Hubungi orang tua melalui WhatsApp bila perlu.' });
    } catch (rejectionError) {
      const message = errorMessage(rejectionError);
      notify({ tone: 'error', title: 'Pendaftaran gagal diproses', message });
      throw rejectionError;
    }
  };

  const handleApproveScheduleRequest = async (id: string, note: string) => {
    if (!token) return;
    try {
      const saved = await api.approveScheduleChangeRequest(token, id, note);
      setScheduleChangeRequests((current) => replaceById(current, saved));
      const [nextStudents, nextSessions] = await Promise.all([api.students(token), api.sessions(token)]);
      setStudents(nextStudents);
      setClassSessions(nextSessions);
      notify({ tone: 'success', title: 'Pengajuan berhasil disetujui', message: 'Data akademik dan Portal Orang Tua sudah diperbarui.' });
    } catch (approvalError) {
      notify({ tone: 'error', title: 'Pengajuan belum dapat disetujui', message: errorMessage(approvalError) });
      throw approvalError;
    }
  };

  const handleRejectScheduleRequest = async (id: string, note: string) => {
    if (!token) return;
    try {
      const saved = await api.rejectScheduleChangeRequest(token, id, note);
      setScheduleChangeRequests((current) => replaceById(current, saved));
      notify({ tone: 'success', title: 'Permintaan ditolak', message: 'Alasan penolakan dapat dilihat oleh orang tua.' });
    } catch (rejectionError) {
      notify({ tone: 'error', title: 'Permintaan belum dapat diproses', message: errorMessage(rejectionError) });
      throw rejectionError;
    }
  };

  const saveTeacherAttendance = async (data: Partial<TeacherAttendance>) => {
    if (!token) return;
    const saved = await api.saveTeacherAttendance(token, data);
    setTeacherAttendances((current) => [saved, ...current.filter((item) => item.id !== saved.id && !(item.teacherId === saved.teacherId && item.classSessionId === saved.classSessionId && item.attendanceDate === saved.attendanceDate))]);
  };
  const deleteTeacherAttendance = async (id: string) => {
    if (!token) return;
    await api.deleteTeacherAttendance(token, id);
    setTeacherAttendances((current) => current.filter((item) => item.id !== id));
  };
  const saveStudentAbsence = async (data: Partial<StudentAbsence>) => {
    if (!token) return;
    const saved = await api.saveStudentAbsence(token, data);
    setStudentAbsences((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
  };
  const deleteStudentAbsence = async (id: string) => {
    if (!token) return;
    await api.deleteStudentAbsence(token, id);
    setStudentAbsences((current) => current.filter((item) => item.id !== id));
    setMakeUpSchedules((current) => current.filter((item) => item.studentAbsenceId !== id));
  };
  const saveMakeUpSchedule = async (data: Partial<MakeUpSchedule>, id?: string) => {
    if (!token) return;
    const saved = id ? await api.updateMakeUpSchedule(token, id, data) : await api.createMakeUpSchedule(token, data);
    setMakeUpSchedules((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    setStudentAbsences((current) => current.map((item) => item.id === saved.studentAbsenceId ? { ...item, status: saved.status === 'completed' ? 'completed' : 'replacement_scheduled', makeUpSchedule: saved } : item));
  };
  const deleteMakeUpSchedule = async (id: string) => {
    if (!token) return;
    const schedule = makeUpSchedules.find((item) => item.id === id);
    await api.deleteMakeUpSchedule(token, id);
    setMakeUpSchedules((current) => current.filter((item) => item.id !== id));
    if (schedule) setStudentAbsences((current) => current.map((item) => item.id === schedule.studentAbsenceId ? { ...item, status: 'open', makeUpSchedule: undefined } : item));
  };
  const saveTeacherPayroll = async (data: Partial<TeacherPayroll>) => {
    if (!token) return;
    const saved = await api.saveTeacherPayroll(token, data);
    setTeacherPayrolls((current) => [saved, ...current.filter((item) => item.id !== saved.id && !(item.teacherId === saved.teacherId && item.month === saved.month && item.year === saved.year))]);
  };

  if (authSnapshot === null || !authSession || authSession.user.role === 'parent') {
    return <SessionLoading message={authSnapshot === null ? 'Memulihkan sesi...' : 'Membuka halaman login...'} />;
  }
  if (!dataReady) return <BackendLoading error={loadingError || undefined} onRetry={() => void loadData(authSession)} onLogout={() => void handleLogout()} />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} students={students} teachers={teachers} payments={payments} programs={programs} />;
      case 'registrations': return user?.role === 'admin' ? <Registrations registrations={registrations} onApprove={handleApproveRegistration} onReject={handleRejectRegistration} onNavigate={handleNavigate} /> : <div className="access-denied">Akses operasional hanya untuk Admin.</div>;
      case 'students':
      case 'student-form':
      case 'student-detail': return <Students key={currentPage + ':' + (navContext.id ?? '')} canManage={user?.role === 'admin'} onNavigate={handleNavigate} students={students} teachers={teachers} programs={programs} registrations={registrations} onStudentsChange={handleStudentsChange} initialView={currentPage === 'student-form' ? 'form' : currentPage === 'student-detail' ? 'detail' : 'list'} viewStudentId={currentPage === 'student-detail' ? navContext.id : undefined} editStudentId={currentPage === 'student-form' ? navContext.id : undefined} />;
      case 'student-activation': return <Students key="student-activation" canManage={user?.role === 'admin'} onNavigate={handleNavigate} students={students} teachers={teachers} programs={programs} onStudentsChange={handleStudentsChange} initialView="activation" />;
      case 'teachers':
      case 'teacher-form':
      case 'teacher-detail':
      case 'teacher-activation': return <Teachers key={currentPage + ':' + (navContext.id ?? '')} canManage={user?.role === 'super_admin'} onNavigate={handleNavigate} initialView={currentPage === 'teacher-form' ? 'form' : currentPage === 'teacher-detail' ? 'detail' : currentPage === 'teacher-activation' ? 'activation' : 'list'} initialTeacherId={navContext.id} students={students} sessions={classSessions} teachers={teachers} onTeachersChange={handleTeachersChange} />;
      case 'schedule': return <Schedule canManage={user?.role === 'admin'} students={students} teachers={teachers} programs={programs} sessions={classSessions} onSessionsChange={handleSessionsChange} />;
      case 'schedule-requests': return user?.role === 'admin' ? <ScheduleRequests requests={scheduleChangeRequests} onApprove={handleApproveScheduleRequest} onReject={handleRejectScheduleRequest} onNavigate={handleNavigate} /> : <div className="access-denied">Akses operasional hanya untuk Admin.</div>;
      case 'attendance': return <Attendance role={user?.role === 'super_admin' ? 'super_admin' : 'admin'} students={students} teachers={teachers} sessions={classSessions} teacherAttendances={teacherAttendances} studentAbsences={studentAbsences} makeUpSchedules={makeUpSchedules} onSaveTeacherAttendance={saveTeacherAttendance} onDeleteTeacherAttendance={deleteTeacherAttendance} onSaveStudentAbsence={saveStudentAbsence} onDeleteStudentAbsence={deleteStudentAbsence} onSaveMakeUpSchedule={saveMakeUpSchedule} onDeleteMakeUpSchedule={deleteMakeUpSchedule} />;
      case 'finance-monthly': return <Finance canManage={user?.role === 'admin'} mode="monthly" students={students} programs={programs} payments={payments} onPaymentsChange={handlePaymentsChange} />;
      case 'finance-yearly': return <Finance canManage={user?.role === 'admin'} mode="yearly" students={students} programs={programs} payments={payments} onPaymentsChange={handlePaymentsChange} />;
      case 'reports': return <Reports students={students} teachers={teachers} programs={programs} payments={payments} />;
      case 'payroll': return user?.role === 'super_admin' ? <Payroll teachers={teachers} attendances={teacherAttendances} payrolls={teacherPayrolls} onSave={saveTeacherPayroll} /> : <div className="access-denied">Akses penggajian hanya untuk Super Admin (Owner).</div>;
      case 'admin-management': return authSession.user.role === 'super_admin' ? <AdminManagement admins={admins} token={authSession.token} onAdminsChange={setAdmins} /> : <div style={{ padding: 40, textAlign: 'center', color: '#6B7C8D' }}>Akses ditolak</div>;
      case 'settings': return <Settings user={authSession.user} token={authSession.token} onUserChange={(nextUser) => writeAuthSession({ token: authSession.token, user: nextUser })} />;
      default: return <Dashboard onNavigate={handleNavigate} students={students} teachers={teachers} payments={payments} programs={programs} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} onLogout={() => void handleLogout()} role={user?.role ?? 'admin'} adminName={user?.name ?? 'Admin EdGLO'} pendingRegistrations={registrations.filter((item) => item.status === 'pending').length} pendingScheduleRequests={scheduleChangeRequests.filter((item) => item.status === 'pending').length}>
      {renderPage()}
    </Layout>
  );
}
