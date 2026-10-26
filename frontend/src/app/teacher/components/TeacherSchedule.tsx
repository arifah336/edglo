'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, GraduationCap, MapPin, UsersRound } from 'lucide-react';
import type { TeacherPortalClass } from '../../../types';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

type Props = { classes: TeacherPortalClass[]; todayName: string };

export default function TeacherSchedule({ classes, todayName }: Props) {
  const initialDay = classes.some((item) => item.day === todayName) ? todayName : (classes[0]?.day ?? 'Senin');
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const selectedClasses = useMemo(() => classes.filter((item) => item.day === selectedDay).sort((a, b) => a.time.localeCompare(b.time)), [classes, selectedDay]);

  return <div className="teacher-schedule-page">
    <section className="teacher-day-picker" aria-label="Pilih hari jadwal">
      {DAYS.map((day) => <button type="button" key={day} className={selectedDay === day ? 'active' : ''} onClick={() => setSelectedDay(day)}><span>{day.slice(0, 3)}</span><strong>{classes.filter((item) => item.day === day).length}</strong>{day === todayName && <small>Hari ini</small>}</button>)}
    </section>

    <section className="teacher-schedule-board">
      <div className="teacher-section-heading"><div><span className="eyebrow">JADWAL MINGGUAN</span><h3>{selectedDay}</h3><p>{selectedClasses.length} kelas aktif pada hari ini</p></div><div className="teacher-schedule-legend"><i /> Kelas aktif</div></div>
      <div className="teacher-class-list">
        {selectedClasses.map((item, index) => <article key={item.id}>
          <div className="teacher-class-order">{String(index + 1).padStart(2, '0')}</div>
          <div className="teacher-class-time"><Clock3 size={16} /><strong>{item.time}</strong><small>WIB</small></div>
          <div className="teacher-class-main"><strong>{item.programName}</strong><span><MapPin size={13} />{item.room}</span></div>
          <div className="teacher-class-students"><div className="teacher-avatar-stack">{item.students.slice(0, 4).map((student) => <span key={student.id} title={student.fullName} style={student.photo ? { backgroundImage: `url(${student.photo})` } : undefined}>{student.photo ? '' : student.fullName.charAt(0)}</span>)}</div><span>{item.students.length} / {item.capacity} murid</span></div>
        </article>)}
        {!selectedClasses.length && <div className="teacher-agenda-empty large"><CalendarDays size={28} /><div><strong>Belum ada kelas pada {selectedDay}</strong><span>Pilih hari lain untuk melihat agenda mengajar.</span></div></div>}
      </div>
    </section>

    <section className="teacher-class-catalog">
      <div className="teacher-section-heading"><div><span className="eyebrow">KELAS AKTIF</span><h3>Seluruh kelas yang Anda pegang</h3></div></div>
      <div>{classes.map((item) => <article key={`catalog-${item.id}`}><span><GraduationCap size={18} /></span><div><strong>{item.programName}</strong><small>{item.day}, {item.time} WIB · {item.room}</small></div><b><UsersRound size={14} />{item.students.length}</b></article>)}</div>
    </section>
  </div>;
}
