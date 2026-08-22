import type { Admin, Payment, Program, Student, Teacher } from '../types';

export const TODAY = '2026-07-31';
export const REGISTRATION_FEE = 100000;
export const BOOK_FEE = 100000;

export const PROGRAMS: Program[] = [
  { id: 'pra-calistung-regular', name: 'Pra Calistung Regular', price: 700000, sessionsPerWeek: 3 },
  { id: 'calistung-regular', name: 'Calistung Regular', price: 600000, sessionsPerWeek: 3 },
  { id: 'calistung-everyday', name: 'Calistung Everyday', price: 1000000, sessionsPerWeek: 5 },
  { id: 'bimbel-regular', name: 'Bimbel Regular', price: 600000, sessionsPerWeek: 3 },
  { id: 'bimbel-everyday', name: 'Bimbel Everyday', price: 1000000, sessionsPerWeek: 5 },
  { id: 'english-regular', name: 'English Regular', price: 500000, sessionsPerWeek: 3 },
  { id: 'english-everyday', name: 'English Everyday', price: 900000, sessionsPerWeek: 5 },
];

export const DAYS_WEEKDAY = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
export const ALL_DAYS = [...DAYS_WEEKDAY, 'Sabtu'];
export const TIMES_WEEKDAY = ['11.00', '12.00', '13.30', '15.00', '16.30'];
export const TIMES_SATURDAY = ['09.00', '10.30', '12.00', '13.30'];
export const getTimesForDay = (day: string) => day === 'Sabtu' ? TIMES_SATURDAY : TIMES_WEEKDAY;

export const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
export const EDUCATION_LEVELS = ['SMA/SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'];
export const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const TEACHERS: Teacher[] = [
  { id: 'T001', fullName: 'Siti Rahmawati, S.Pd', address: 'Jl. Melati No. 12, Batam Kota', birthPlace: 'Batam', birthDate: '1995-03-14', religion: 'Islam', email: 'siti.rahmawati@edglo.id', phone: '08123456789', lastEducation: 'S1', joinDate: '2022-01-10', employmentType: 'fulltime', status: 'active', statusHistory: [{ date: '2022-01-10', action: 'activated', by: 'Super Admin' }] },
  { id: 'T002', fullName: 'Ahmad Fauzi', address: 'Jl. Kenanga No. 5, Sekupang', birthPlace: 'Padang', birthDate: '1998-07-22', religion: 'Islam', email: 'ahmad.fauzi@edglo.id', phone: '08234567890', lastEducation: 'S1', joinDate: '2022-06-01', employmentType: 'parttime', status: 'active', statusHistory: [{ date: '2022-06-01', action: 'activated', by: 'Admin' }] },
  { id: 'T003', fullName: 'Dina Lestari', address: 'Jl. Mawar No. 8, Batu Aji', birthPlace: 'Pekanbaru', birthDate: '2000-11-05', religion: 'Islam', email: 'dina.lestari@edglo.id', phone: '08345678901', lastEducation: 'D3', joinDate: '2023-03-15', employmentType: 'magang', status: 'active', statusHistory: [{ date: '2023-03-15', action: 'activated', by: 'Admin' }] },
  { id: 'T004', fullName: 'Rizky Pratama', address: 'Jl. Anggrek No. 22, Bengkong', birthPlace: 'Surabaya', birthDate: '1993-05-17', religion: 'Islam', email: 'rizky.pratama@edglo.id', phone: '08456789012', lastEducation: 'S1', joinDate: '2021-08-01', leaveDate: '2026-01-31', employmentType: 'fulltime', status: 'off', statusHistory: [{ date: '2021-08-01', action: 'activated', by: 'Admin' }, { date: '2026-01-31', action: 'deactivated', reason: 'Mengundurkan diri', by: 'Super Admin' }] },
  { id: 'T005', fullName: 'Nabila Putri, S.Pd', address: 'Perumahan Cendana Blok C2, Batam Center', birthPlace: 'Medan', birthDate: '1996-09-10', religion: 'Islam', email: 'nabila.putri@edglo.id', phone: '08129876102', lastEducation: 'S1', joinDate: '2024-01-08', employmentType: 'fulltime', status: 'active', statusHistory: [{ date: '2024-01-08', action: 'activated', by: 'Super Admin' }] },
  { id: 'T006', fullName: 'Kevin Jonathan', address: 'Komplek Windsor, Lubuk Baja', birthPlace: 'Batam', birthDate: '1997-12-02', religion: 'Kristen', email: 'kevin.jonathan@edglo.id', phone: '082177340912', lastEducation: 'S1', joinDate: '2024-08-12', employmentType: 'parttime', status: 'active', statusHistory: [{ date: '2024-08-12', action: 'activated', by: 'Admin' }] },
  { id: 'T007', fullName: 'Maya Sari', address: 'Tiban Indah Blok D4, Sekupang', birthPlace: 'Jambi', birthDate: '1999-04-18', religion: 'Islam', email: 'maya.sari@edglo.id', phone: '083180045112', lastEducation: 'D3', joinDate: '2025-02-03', employmentType: 'magang', status: 'active', statusHistory: [{ date: '2025-02-03', action: 'activated', by: 'Admin' }] },
  { id: 'T008', fullName: 'Laras Widyaningrum', address: 'Legenda Malaka Blok H7, Batam Kota', birthPlace: 'Yogyakarta', birthDate: '1994-06-25', religion: 'Katolik', email: 'laras.widya@edglo.id', phone: '085271990188', lastEducation: 'S2', joinDate: '2023-07-17', employmentType: 'fulltime', status: 'active', statusHistory: [{ date: '2023-07-17', action: 'activated', by: 'Super Admin' }] },
];

export const STUDENTS: Student[] = [
  { id: 'S001', fullName: 'Aisyah Nur Fadillah', parentName: 'Bapak Wahyu Hidayat', address: 'Jl. Cempaka No. 15, Batam Kota', phone: '08567890123', programId: 'calistung-regular', sessionsPerWeek: 3, joinDate: '2026-01-10', teacherId: 'T001', schedules: [{ day: 'Senin', time: '15.00' }, { day: 'Rabu', time: '15.00' }, { day: 'Jumat', time: '15.00' }], notes: 'Murid baru, aktif dan semangat belajar.', status: 'active', statusHistory: [{ date: '2026-01-10', action: 'activated', by: 'Admin' }] },
  { id: 'S002', fullName: 'Budi Santoso', parentName: 'Ibu Dewi Santoso', address: 'Jl. Dahlia No. 7, Sekupang', phone: '08678901234', programId: 'english-everyday', sessionsPerWeek: 5, joinDate: '2026-02-01', teacherId: 'T002', schedules: [{ day: 'Senin', time: '16.30' }, { day: 'Selasa', time: '16.30' }, { day: 'Rabu', time: '16.30' }, { day: 'Kamis', time: '16.30' }, { day: 'Jumat', time: '16.30' }], status: 'active', statusHistory: [{ date: '2026-02-01', action: 'activated', by: 'Admin' }] },
  { id: 'S003', fullName: 'Citra Maharani', parentName: 'Bapak Agus Maharani', address: 'Jl. Teratai No. 3, Batu Aji', phone: '08789012345', programId: 'bimbel-regular', sessionsPerWeek: 3, joinDate: '2026-01-15', teacherId: 'T001', schedules: [{ day: 'Selasa', time: '13.30' }, { day: 'Kamis', time: '13.30' }, { day: 'Sabtu', time: '10.30' }], status: 'active', statusHistory: [{ date: '2026-01-15', action: 'activated', by: 'Admin' }] },
  { id: 'S004', fullName: 'Dimas Prasetyo', parentName: 'Ibu Rina Prasetyo', address: 'Jl. Flamboyan No. 11, Bengkong', phone: '08890123456', programId: 'pra-calistung-regular', sessionsPerWeek: 3, joinDate: '2025-08-01', leaveDate: '2026-01-31', teacherId: 'T002', schedules: [{ day: 'Senin', time: '11.00' }, { day: 'Rabu', time: '11.00' }, { day: 'Jumat', time: '11.00' }], status: 'off', statusHistory: [{ date: '2025-08-01', action: 'activated', by: 'Admin' }, { date: '2026-01-31', action: 'deactivated', reason: 'Pindah domisili', by: 'Admin' }] },
  { id: 'S005', fullName: 'Elisa Putri Rahayu', parentName: 'Bapak Hendra Rahayu', address: 'Jl. Bougenville No. 9, Nongsa', phone: '08901234567', programId: 'english-regular', sessionsPerWeek: 3, joinDate: '2026-03-01', teacherId: 'T003', schedules: [{ day: 'Selasa', time: '15.00' }, { day: 'Kamis', time: '15.00' }, { day: 'Sabtu', time: '09.00' }], status: 'active', statusHistory: [{ date: '2026-03-01', action: 'activated', by: 'Admin' }] },
  { id: 'S006', fullName: 'Fajar Aditya', parentName: 'Ibu Sri Aditya', address: 'Jl. Tulip No. 4, Lubuk Baja', phone: '08012345678', programId: 'calistung-everyday', sessionsPerWeek: 5, joinDate: '2026-04-05', teacherId: 'T001', schedules: [{ day: 'Senin', time: '12.00' }, { day: 'Selasa', time: '12.00' }, { day: 'Rabu', time: '12.00' }, { day: 'Kamis', time: '12.00' }, { day: 'Sabtu', time: '12.00' }], status: 'active', statusHistory: [{ date: '2026-04-05', action: 'activated', by: 'Admin' }] },
  { id: 'S007', fullName: 'Ghania Az Zahra', parentName: 'Ibu Melati Sari', address: 'Perumahan Orchid Park Blok A8', phone: '081276541900', programId: 'pra-calistung-regular', sessionsPerWeek: 3, joinDate: '2025-11-12', teacherId: 'T005', schedules: [{ day: 'Senin', time: '11.00' }, { day: 'Rabu', time: '11.00' }, { day: 'Jumat', time: '11.00' }], status: 'active', statusHistory: [{ date: '2025-11-12', action: 'activated', by: 'Admin' }] },
  { id: 'S008', fullName: 'Hafiz Ramadhan', parentName: 'Bapak Firman Ramadhan', address: 'Taman Raya Tahap 3, Batam Kota', phone: '082288114579', programId: 'bimbel-everyday', sessionsPerWeek: 5, joinDate: '2025-12-20', teacherId: 'T002', schedules: [{ day: 'Senin', time: '13.30' }, { day: 'Selasa', time: '13.30' }, { day: 'Rabu', time: '13.30' }, { day: 'Kamis', time: '13.30' }, { day: 'Jumat', time: '13.30' }], status: 'active', statusHistory: [{ date: '2025-12-20', action: 'activated', by: 'Admin' }] },
  { id: 'S009', fullName: 'Intan Permata Sari', parentName: 'Ibu Rika Permata', address: 'Komplek Baloi Mas Blok B6', phone: '083870221105', programId: 'english-regular', sessionsPerWeek: 3, joinDate: '2026-01-22', teacherId: 'T006', schedules: [{ day: 'Selasa', time: '15.00' }, { day: 'Kamis', time: '15.00' }, { day: 'Sabtu', time: '09.00' }], status: 'active', statusHistory: [{ date: '2026-01-22', action: 'activated', by: 'Admin' }] },
  { id: 'S010', fullName: 'Jonathan Wijaya', parentName: 'Bapak Daniel Wijaya', address: 'Nagoya Garden Blok E3', phone: '085215400731', programId: 'english-everyday', sessionsPerWeek: 5, joinDate: '2026-02-14', teacherId: 'T006', schedules: [{ day: 'Senin', time: '16.30' }, { day: 'Selasa', time: '16.30' }, { day: 'Rabu', time: '16.30' }, { day: 'Kamis', time: '16.30' }, { day: 'Jumat', time: '16.30' }], status: 'active', statusHistory: [{ date: '2026-02-14', action: 'activated', by: 'Admin' }] },
  { id: 'S011', fullName: 'Kayla Maharani', parentName: 'Ibu Desi Maharani', address: 'Puri Legenda Blok F10', phone: '081364558702', programId: 'calistung-regular', sessionsPerWeek: 3, joinDate: '2026-02-28', teacherId: 'T005', schedules: [{ day: 'Senin', time: '15.00' }, { day: 'Rabu', time: '15.00' }, { day: 'Jumat', time: '15.00' }], status: 'active', statusHistory: [{ date: '2026-02-28', action: 'activated', by: 'Admin' }] },
  { id: 'S012', fullName: 'Luthfi Al Ghifari', parentName: 'Bapak Arif Hidayat', address: 'Buana Vista Indah, Batu Aji', phone: '082193087755', programId: 'bimbel-regular', sessionsPerWeek: 3, joinDate: '2026-03-07', teacherId: 'T002', schedules: [{ day: 'Selasa', time: '13.30' }, { day: 'Kamis', time: '13.30' }, { day: 'Sabtu', time: '10.30' }], status: 'active', statusHistory: [{ date: '2026-03-07', action: 'activated', by: 'Admin' }] },
  { id: 'S013', fullName: 'Mikayla Anindita', parentName: 'Ibu Sinta Anindita', address: 'Palm Spring Blok C12, Nongsa', phone: '085701335890', programId: 'pra-calistung-regular', sessionsPerWeek: 3, joinDate: '2026-03-18', teacherId: 'T007', schedules: [{ day: 'Senin', time: '12.00' }, { day: 'Rabu', time: '12.00' }, { day: 'Sabtu', time: '12.00' }], status: 'active', statusHistory: [{ date: '2026-03-18', action: 'activated', by: 'Admin' }] },
  { id: 'S014', fullName: 'Naufal Akbar', parentName: 'Bapak Rendi Akbar', address: 'Bengkong Laut Blok A4', phone: '081266098721', programId: 'calistung-everyday', sessionsPerWeek: 5, joinDate: '2026-04-10', teacherId: 'T001', schedules: [{ day: 'Senin', time: '12.00' }, { day: 'Selasa', time: '12.00' }, { day: 'Rabu', time: '12.00' }, { day: 'Kamis', time: '12.00' }, { day: 'Sabtu', time: '12.00' }], status: 'active', statusHistory: [{ date: '2026-04-10', action: 'activated', by: 'Admin' }] },
  { id: 'S015', fullName: 'Olivia Nathania', parentName: 'Ibu Grace Nathania', address: 'KDA Junction Blok H2', phone: '082274613588', programId: 'english-regular', sessionsPerWeek: 3, joinDate: '2026-05-02', teacherId: 'T008', schedules: [{ day: 'Selasa', time: '15.00' }, { day: 'Kamis', time: '15.00' }, { day: 'Sabtu', time: '09.00' }], status: 'active', statusHistory: [{ date: '2026-05-02', action: 'activated', by: 'Admin' }] },
  { id: 'S016', fullName: 'Putra Mahesa', parentName: 'Bapak Yoga Mahesa', address: 'Tiban Housing Blok J5', phone: '083192654004', programId: 'bimbel-everyday', sessionsPerWeek: 5, joinDate: '2026-05-16', teacherId: 'T008', schedules: [{ day: 'Senin', time: '13.30' }, { day: 'Selasa', time: '13.30' }, { day: 'Rabu', time: '13.30' }, { day: 'Kamis', time: '13.30' }, { day: 'Jumat', time: '13.30' }], status: 'active', statusHistory: [{ date: '2026-05-16', action: 'activated', by: 'Admin' }] },
  { id: 'S017', fullName: 'Qanita Aulia', parentName: 'Ibu Farah Aulia', address: 'Legenda Avenue Blok D9', phone: '085360218977', programId: 'calistung-regular', sessionsPerWeek: 3, joinDate: '2026-06-05', teacherId: 'T005', schedules: [{ day: 'Senin', time: '15.00' }, { day: 'Rabu', time: '15.00' }, { day: 'Jumat', time: '15.00' }], status: 'active', statusHistory: [{ date: '2026-06-05', action: 'activated', by: 'Admin' }] },
  { id: 'S018', fullName: 'Rafi Dzaky', parentName: 'Bapak Dedi Dzaky', address: 'Marina Park Blok B11', phone: '081378022614', programId: 'english-everyday', sessionsPerWeek: 5, joinDate: '2026-06-21', teacherId: 'T006', schedules: [{ day: 'Senin', time: '16.30' }, { day: 'Selasa', time: '16.30' }, { day: 'Rabu', time: '16.30' }, { day: 'Kamis', time: '16.30' }, { day: 'Jumat', time: '16.30' }], status: 'active', statusHistory: [{ date: '2026-06-21', action: 'activated', by: 'Admin' }] },
  { id: 'S019', fullName: 'Salsabila Putri', parentName: 'Ibu Nuraini Putri', address: 'Komp. Mitra Raya Blok C7', phone: '082167334190', programId: 'bimbel-regular', sessionsPerWeek: 3, joinDate: '2025-09-09', leaveDate: '2026-04-30', teacherId: 'T003', schedules: [{ day: 'Selasa', time: '13.30' }, { day: 'Kamis', time: '13.30' }, { day: 'Sabtu', time: '10.30' }], status: 'off', statusHistory: [{ date: '2025-09-09', action: 'activated', by: 'Admin' }, { date: '2026-04-30', action: 'deactivated', reason: 'Selesai program', by: 'Admin' }] },
  { id: 'S020', fullName: 'Tegar Saputra', parentName: 'Bapak Indra Saputra', address: 'Kampung Utama, Lubuk Baja', phone: '085278903144', programId: 'pra-calistung-regular', sessionsPerWeek: 3, joinDate: '2025-10-03', leaveDate: '2026-03-31', teacherId: 'T007', schedules: [{ day: 'Senin', time: '11.00' }, { day: 'Rabu', time: '11.00' }, { day: 'Jumat', time: '11.00' }], status: 'off', statusHistory: [{ date: '2025-10-03', action: 'activated', by: 'Admin' }, { date: '2026-03-31', action: 'deactivated', reason: 'Pindah sekolah', by: 'Admin' }] },
];

export const ADMINS: Admin[] = [
  { id: 'A001', name: 'Super Admin EdGLO', email: 'superadmin@edglo.id', role: 'super_admin', phone: '08111222333', createdAt: '2021-01-01' },
  { id: 'A002', name: 'Nur Hidayati', email: 'nur.hidayati@edglo.id', role: 'admin', phone: '08111333444', createdAt: '2022-02-15' },
  { id: 'A003', name: 'Putri Anggraini', email: 'putri.anggraini@edglo.id', role: 'admin', phone: '08111444555', createdAt: '2023-06-01' },
  { id: 'A004', name: 'Rina Amelia', email: 'rina.amelia@edglo.id', role: 'admin', phone: '081177420055', createdAt: '2024-03-11' },
  { id: 'A005', name: 'Bagus Ramadhan', email: 'bagus.ramadhan@edglo.id', role: 'admin', phone: '082211907733', createdAt: '2025-01-20' },
];

export const getProgramById = (id: string) => PROGRAMS.find((p) => p.id === id);
export const getTeacherById = (id: string) => TEACHERS.find((t) => t.id === id);
export const getStudentById = (id: string) => STUDENTS.find((s) => s.id === id);
export const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
export const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export const generatePayments = (): Payment[] => {
  const payments: Payment[] = [];
  let id = 1;
  const today = new Date(TODAY);

  STUDENTS.forEach((student) => {
    const program = getProgramById(student.programId);
    if (!program) return;
    const joinDate = new Date(student.joinDate);

    for (let m = 0; m <= 6; m += 1) {
      const date = new Date(joinDate);
      date.setMonth(joinDate.getMonth() + m);
      if (date > today) break;
      const dueDate = new Date(date);
      dueDate.setDate(joinDate.getDate());
      const registrationFee = m === 0 ? REGISTRATION_FEE : 0;
      const bookFee = m % 2 === 0 ? BOOK_FEE : 0;
      const total = program.price + registrationFee + bookFee;
      const isPaid = student.status === 'off' || id % 4 !== 0;
      payments.push({
        id: `PAY${String(id++).padStart(4, '0')}`,
        studentId: student.id,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        programFee: program.price,
        registrationFee,
        bookFee,
        total,
        dueDate: dueDate.toISOString().split('T')[0],
        paidDate: isPaid ? dueDate.toISOString().split('T')[0] : undefined,
        status: isPaid ? 'paid' : dueDate < today ? 'overdue' : 'pending',
      });
    }
  });

  return payments;
};

export const PAYMENTS = generatePayments();
