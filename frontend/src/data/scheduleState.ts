import type { ClassSession, Student } from '../types';

function sessionKey(session: Pick<ClassSession, 'day' | 'time' | 'teacherId' | 'programId'>) {
  return [session.day, session.time, session.teacherId, session.programId].join('|');
}

function nextSessionId(sessions: ClassSession[]) {
  const largest = sessions.reduce((max, session) => {
    const numericId = Number(session.id.replace(/\D/g, ''));
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
  }, 0);

  return `CLS${String(largest + 1).padStart(3, '0')}`;
}

export function createClassSessions(students: Student[]): ClassSession[] {
  const grouped = new Map<string, Omit<ClassSession, 'id'>>();

  students
    .filter((student) => student.status === 'active')
    .forEach((student) => {
      student.schedules.forEach((schedule) => {
        const key = sessionKey({
          day: schedule.day,
          time: schedule.time,
          teacherId: student.teacherId,
          programId: student.programId,
        });
        const existing = grouped.get(key);

        if (existing) {
          grouped.set(key, {
            ...existing,
            studentIds: [...existing.studentIds, student.id],
          });
          return;
        }

        grouped.set(key, {
          day: schedule.day,
          time: schedule.time,
          teacherId: student.teacherId,
          programId: student.programId,
          studentIds: [student.id],
          room: `Ruang ${String.fromCharCode(65 + (grouped.size % 3))}`,
          capacity: 6,
          notes: '',
        });
      });
    });

  return Array.from(grouped.values()).map((session, index) => ({
    ...session,
    id: `CLS${String(index + 1).padStart(3, '0')}`,
  }));
}

export function reconcileSessionsWithStudents(
  sessions: ClassSession[],
  students: Student[],
): ClassSession[] {
  const assignments = new Map<string, string[]>();

  students
    .filter((student) => student.status === 'active')
    .forEach((student) => {
      student.schedules.forEach((schedule) => {
        const key = sessionKey({
          day: schedule.day,
          time: schedule.time,
          teacherId: student.teacherId,
          programId: student.programId,
        });
        const current = assignments.get(key) ?? [];
        if (!current.includes(student.id)) assignments.set(key, [...current, student.id]);
      });
    });

  const existingKeys = new Set(sessions.map(sessionKey));
  const reconciled = sessions.map((session) => ({
    ...session,
    studentIds: assignments.get(sessionKey(session)) ?? [],
  }));

  assignments.forEach((studentIds, key) => {
    if (existingKeys.has(key)) return;
    const [day, time, teacherId, programId] = key.split('|');
    reconciled.push({
      id: nextSessionId(reconciled),
      day,
      time,
      teacherId,
      programId,
      studentIds,
      room: 'Ruang A',
      capacity: Math.max(6, studentIds.length),
      notes: '',
    });
  });

  return reconciled;
}

export function applySessionsToStudents(
  students: Student[],
  sessions: ClassSession[],
): Student[] {
  return students.map((student) => {
    if (student.status !== 'active') return student;

    const assignedSessions = sessions.filter((session) => session.studentIds.includes(student.id));
    const schedules = assignedSessions
      .map((session) => ({ day: session.day, time: session.time }))
      .sort((a, b) => `${a.day}-${a.time}`.localeCompare(`${b.day}-${b.time}`));

    return {
      ...student,
      teacherId: assignedSessions[0]?.teacherId ?? student.teacherId,
      schedules,
      sessionsPerWeek: schedules.length,
    };
  });
}
