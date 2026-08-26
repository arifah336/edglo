import type { ReactNode } from 'react';
import {
  MONTH_NAMES,
  PAYMENTS,
  PROGRAMS,
  STUDENTS,
  TEACHERS,
  TODAY,
  formatCurrency,
  formatDate,
} from '../data/mockData';
import type { Page, Payment, Program, Student, Teacher } from '../types';

type Props = {
  onNavigate: (page: Page, id?: string) => void;
  students?: Student[];
  teachers?: Teacher[];
  payments?: Payment[];
  programs?: Program[];
};

const today = new Date(`${TODAY}T00:00:00`);
const todayMonth = today.getMonth() + 1;
const todayYear = today.getFullYear();
const previousMonthDate = new Date(todayYear, todayMonth - 2, 1);

type ChartMonth = { label: string; fullLabel: string; value: number };

const programColors = ['#1687A7', '#1EB980', '#FFB020', '#6C63D9', '#E45D79', '#5B8DEF'];

function compactCurrency(amount: number) {
  if (amount >= 1_000_000) {
    return `Rp${(amount / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  }
  if (amount >= 1_000) {
    return `Rp${Math.round(amount / 1_000)} rb`;
  }
  return formatCurrency(amount);
}

function DashboardIcon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function MetricCard({
  label,
  value,
  detail,
  trend,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  trend: string;
  tone: 'teal' | 'blue' | 'green' | 'red';
  icon: ReactNode;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card-top">
        <div className="metric-icon">{icon}</div>
        <span className="metric-trend">{trend}</span>
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </article>
  );
}

function RevenueChart({ data }: { data: ChartMonth[] }) {
  const width = 680;
  const height = 230;
  const left = 38;
  const right = 18;
  const top = 18;
  const bottom = 38;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const roundedMax = Math.ceil(maxValue / 1_000_000) * 1_000_000 || 1_000_000;
  const points = data.map((item, index) => {
    const x = left + (chartWidth / Math.max(data.length - 1, 1)) * index;
    const y = top + chartHeight - (item.value / roundedMax) * chartHeight;
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${top + chartHeight} L ${points[0].x} ${top + chartHeight} Z`;
  const gridValues = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="revenue-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafik pemasukan enam bulan terakhir">
        <defs>
          <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1687A7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1687A7" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridValues.map((fraction) => {
          const y = top + chartHeight * (1 - fraction);
          return (
            <g key={fraction}>
              <line x1={left} y1={y} x2={width - right} y2={y} stroke="#E8EEF2" strokeDasharray="4 5" />
              <text x={left - 8} y={y + 4} textAnchor="end" className="chart-axis-text">
                {compactCurrency(roundedMax * fraction).replace('Rp', '')}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#revenueArea)" />
        <path d={linePath} fill="none" stroke="#1687A7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.fullLabel}>
            <circle cx={point.x} cy={point.y} r="6" fill="#ffffff" stroke="#1687A7" strokeWidth="3" />
            <text x={point.x} y={height - 10} textAnchor="middle" className="chart-month-text">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function PaymentReminder({ payment, students, programs }: { payment: Payment; students: Student[]; programs: Program[] }) {
  const student = students.find((item) => item.id === payment.studentId);
  const isOverdue = payment.status === 'overdue';
  const difference = Math.max(
    0,
    Math.ceil((today.getTime() - new Date(`${payment.dueDate}T00:00:00`).getTime()) / 86_400_000),
  );

  return (
    <div className="payment-reminder-row">
      <span className={`reminder-avatar ${isOverdue ? 'overdue' : 'due'}`}>
        {student?.fullName.charAt(0) ?? '?'}
      </span>
      <div className="reminder-main">
        <strong>{student?.fullName ?? 'Murid'}</strong>
        <span>{programs.find((item) => item.id === student?.programId)?.name ?? '-'}</span>
      </div>
      <div className="reminder-amount">
        <strong>{compactCurrency(payment.total)}</strong>
        <span className={isOverdue ? 'text-danger' : 'text-warning'}>
          {isOverdue ? `${difference} hari terlambat` : 'Jatuh tempo hari ini'}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate, students = STUDENTS, teachers = TEACHERS, payments = PAYMENTS, programs = PROGRAMS }: Props) {
  const activeStudents = students.filter((student) => student.status === 'active');
  const activeTeachers = teachers.filter((teacher) => teacher.status === 'active');
  const thisMonthPayments = payments.filter((payment) => payment.month === todayMonth && payment.year === todayYear);
  const paidThisMonth = thisMonthPayments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + payment.total, 0);
  const overduePayments = payments.filter((payment) => payment.status === 'overdue');
  const dueTodayPayments = payments.filter((payment) => payment.status !== 'paid' && payment.dueDate === TODAY);
  const totalWeeklySessions = activeStudents.reduce((sum, student) => sum + student.schedules.length, 0);
  const fridaySessions = activeStudents.reduce((sum, student) => sum + student.schedules.filter((schedule) => schedule.day === 'Jumat').length, 0);
  const previousMonthPaid = payments.filter((payment) => payment.month === previousMonthDate.getMonth() + 1 && payment.year === previousMonthDate.getFullYear() && payment.status === 'paid').reduce((sum, payment) => sum + payment.total, 0);
  const incomeGrowth = previousMonthPaid > 0 ? Math.round(((paidThisMonth - previousMonthPaid) / previousMonthPaid) * 100) : 0;
  const collectionRate = thisMonthPayments.length ? Math.round((thisMonthPayments.filter((payment) => payment.status === 'paid').length / thisMonthPayments.length) * 100) : 0;
  const chartMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(todayYear, todayMonth - 6 + index, 1);
    return { label: MONTH_NAMES[date.getMonth()].slice(0, 3), fullLabel: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`, value: payments.filter((payment) => payment.month === date.getMonth() + 1 && payment.year === date.getFullYear() && payment.status === 'paid').reduce((sum, payment) => sum + payment.total, 0) };
  });
  const programStats = programs.map((program) => ({ ...program, count: activeStudents.filter((student) => student.programId === program.id).length })).filter((program) => program.count > 0).sort((a, b) => b.count - a.count);
  const reminders = [...dueTodayPayments, ...overduePayments]
    .filter((payment, index, list) => list.findIndex((item) => item.id === payment.id) === index)
    .slice(0, 4);
  const donutSegments = programStats.map((program, index) => {
    const previousCount = programStats
      .slice(0, index)
      .reduce((sum, item) => sum + item.count, 0);
    const start = (previousCount / Math.max(activeStudents.length, 1)) * 360;
    const end = ((previousCount + program.count) / Math.max(activeStudents.length, 1)) * 360;
    return `${programColors[index % programColors.length]} ${start}deg ${end}deg`;
  });
  const latestStudents = students
    .slice()
    .sort((a, b) => b.joinDate.localeCompare(a.joinDate))
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <span className="eyebrow">EDGLO OVERVIEW</span>
          <h2>Selamat datang kembali, Admin</h2>
          <p>Berikut perkembangan murid, jadwal, dan pembayaran untuk hari ini.</p>
        </div>
        <div className="welcome-actions">
          <button type="button" className="btn-secondary dashboard-action" onClick={() => onNavigate('reports')}>
            <DashboardIcon size={17}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></DashboardIcon>
            Lihat Laporan
          </button>
          <button type="button" className="btn-primary dashboard-action" onClick={() => onNavigate('student-form')}>
            <DashboardIcon size={17}><path d="M12 5v14M5 12h14" /></DashboardIcon>
            Tambah Murid
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Ringkasan statistik">
        <MetricCard
          label="Murid Aktif"
          value={activeStudents.length}
          detail={`${students.length} murid terdaftar`}
          trend="+2 bulan ini"
          tone="teal"
          icon={<DashboardIcon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></DashboardIcon>}
        />
        <MetricCard
          label="Guru Aktif"
          value={activeTeachers.length}
          detail={`${totalWeeklySessions} sesi per minggu`}
          trend="Tim stabil"
          tone="blue"
          icon={<DashboardIcon><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></DashboardIcon>}
        />
        <MetricCard
          label="Pemasukan Bulan Ini"
          value={compactCurrency(paidThisMonth)}
          detail={`${collectionRate}% pembayaran diterima`}
          trend={`${incomeGrowth >= 0 ? '+' : ''}${incomeGrowth}% vs bulan lalu`}
          tone="green"
          icon={<DashboardIcon><path d="M12 2v20M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7" /></DashboardIcon>}
        />
        <MetricCard
          label="Pembayaran Terlambat"
          value={overduePayments.length}
          detail="Perlu ditindaklanjuti"
          trend={`${dueTodayPayments.length} jatuh tempo`}
          tone="red"
          icon={<DashboardIcon><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></DashboardIcon>}
        />
      </section>

      <section className="dashboard-analytics-grid">
        <article className="dashboard-panel revenue-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">PERFORMA KEUANGAN</span>
              <h3>Tren Pemasukan</h3>
              <p>Enam bulan terakhir berdasarkan pembayaran lunas</p>
            </div>
            <div className="panel-value">
              <strong>{formatCurrency(paidThisMonth)}</strong>
              <span>{MONTH_NAMES[todayMonth - 1]} {todayYear}</span>
            </div>
          </div>
          <RevenueChart data={chartMonths} />
          <div className="chart-summary">
            <div><span className="summary-dot teal" /><span>Sudah diterima</span><strong>{collectionRate}%</strong></div>
            <div><span className="summary-dot yellow" /><span>Belum terbayar</span><strong>{thisMonthPayments.length - thisMonthPayments.filter((payment) => payment.status === 'paid').length}</strong></div>
            <div><span className="summary-dot blue" /><span>Rata-rata tagihan</span><strong>{compactCurrency(thisMonthPayments.reduce((sum, payment) => sum + payment.total, 0) / Math.max(thisMonthPayments.length, 1))}</strong></div>
          </div>
        </article>

        <article className="dashboard-panel program-panel">
          <div className="panel-header compact">
            <div>
              <span className="panel-kicker">KOMPOSISI MURID</span>
              <h3>Distribusi Program</h3>
              <p>Murid aktif per program</p>
            </div>
            <button type="button" className="text-button" onClick={() => onNavigate('students')}>Lihat data</button>
          </div>
          <div className="program-visual">
            <div className="program-donut" style={{ background: `conic-gradient(${donutSegments.join(', ')})` }}>
              <div className="donut-center">
                <strong>{activeStudents.length}</strong>
                <span>Murid Aktif</span>
              </div>
            </div>
          </div>
          <div className="program-legend">
            {programStats.map((program, index) => (
              <div key={program.id} className="program-legend-row">
                <span className="legend-color" style={{ background: programColors[index % programColors.length] }} />
                <span className="legend-name">{program.name}</span>
                <strong>{program.count}</strong>
                <span className="legend-percent">{Math.round((program.count / activeStudents.length) * 100)}%</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-detail-grid">
        <article className="dashboard-panel reminder-panel">
          <div className="panel-header compact">
            <div>
              <span className="panel-kicker">PERLU PERHATIAN</span>
              <h3>Reminder Pembayaran</h3>
              <p>Tagihan jatuh tempo dan terlambat</p>
            </div>
            <span className="panel-count">{reminders.length}</span>
          </div>
          <div className="reminder-list">
            {reminders.length > 0 ? (
              reminders.map((payment) => <PaymentReminder key={payment.id} payment={payment} students={students} programs={programs} />)
            ) : (
              <div className="dashboard-empty">
                <DashboardIcon size={24}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></DashboardIcon>
                <span>Semua pembayaran aman hari ini.</span>
              </div>
            )}
          </div>
          <button type="button" className="panel-footer-button" onClick={() => onNavigate('finance-monthly')}>
            Buka Keuangan Bulanan
            <DashboardIcon size={16}><path d="m9 18 6-6-6-6" /></DashboardIcon>
          </button>
        </article>

        <article className="dashboard-panel students-panel">
          <div className="panel-header compact">
            <div>
              <span className="panel-kicker">DATA TERBARU</span>
              <h3>Murid Terbaru</h3>
              <p>Pendaftaran murid paling baru</p>
            </div>
            <button type="button" className="text-button" onClick={() => onNavigate('students')}>Lihat semua</button>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Murid</th>
                  <th>Program</th>
                  <th>Guru</th>
                  <th>Tanggal Masuk</th>
                  <th>Status</th>
                  <th aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {latestStudents.map((student, index) => {
                  const teacher = teachers.find((item) => item.id === student.teacherId);
                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="student-cell">
                          <span className={`student-avatar avatar-${index % 5}`}>{student.fullName.charAt(0)}</span>
                          <div><strong>{student.fullName}</strong><span>{student.parentName}</span></div>
                        </div>
                      </td>
                      <td><span className="program-chip">{programs.find((item) => item.id === student.programId)?.name ?? '-'}</span></td>
                      <td>{teacher?.fullName ?? '-'}</td>
                      <td>{formatDate(student.joinDate)}</td>
                      <td><span className={`status-pill ${student.status}`}><i />{student.status === 'active' ? 'Aktif' : 'Off'}</span></td>
                      <td>
                        <button type="button" className="row-action" title="Lihat detail murid" onClick={() => onNavigate('student-detail', student.id)}>
                          <DashboardIcon size={16}><path d="m9 18 6-6-6-6" /></DashboardIcon>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="today-strip">
        <div className="today-strip-icon"><DashboardIcon size={22}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></DashboardIcon></div>
        <div><span>Agenda hari ini</span><strong>{fridaySessions} sesi belajar dijadwalkan</strong></div>
        <div className="today-strip-divider" />
        <div><span>Total minggu ini</span><strong>{totalWeeklySessions} sesi aktif</strong></div>
        <div className="today-strip-divider" />
        <div><span>Guru bertugas</span><strong>{activeTeachers.length} guru aktif</strong></div>
        <button type="button" className="btn-secondary" onClick={() => onNavigate('schedule')}>Lihat Jadwal</button>
      </section>
    </div>
  );
}
