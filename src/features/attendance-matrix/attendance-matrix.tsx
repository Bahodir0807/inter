import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, AttendanceEntry, AttendanceStatus } from '../../entities/attendance/api';
import { getNextStatus, getStatusConfig } from '../../entities/attendance/config';
import { AppUser } from '../../shared/types/auth';
import { cn } from '../../shared/lib/cn';
import { toast } from '../../shared/ui/feedback/toaster';
import { Button } from '../../shared/ui/buttons/button';

type DatePeriod = 'week' | 'month' | 'custom';

interface AttendanceMatrixProps {
  groupId: string;
  students: AppUser[];
  dates: string[];
  initialData?: AttendanceEntry[];
  readOnly?: boolean;
  onPeriodChange?: (period: DatePeriod) => void;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
}

export function AttendanceMatrix({
  groupId,
  students,
  dates,
  initialData,
  readOnly = false,
}: AttendanceMatrixProps) {
  const queryClient = useQueryClient();
  const [localStatuses, setLocalStatuses] = useState<Map<string, AttendanceStatus | null>>(new Map());

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', groupId, dates[0]],
    queryFn: () => attendanceApi.getByGroup(groupId, dates[0]),
    initialData: initialData ? { groupId, date: dates[0], records: initialData } : undefined,
    enabled: dates.length > 0,
  });

  const markMutation = useMutation({
    mutationFn: (payload: { studentId: string; date: string; status: AttendanceStatus }) =>
      attendanceApi.mark({
        groupId,
        studentId: payload.studentId,
        date: payload.date,
        status: payload.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', groupId] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: (date: string) =>
      Promise.all(
        students.map(student =>
          attendanceApi.mark({
            groupId,
            studentId: student.id,
            date,
            status: 'PRESENT',
          })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', groupId] });
      toast.success('Всех отмечено как «Пришел»');
    },
  });

  const getCellKey = (studentId: string, date: string) => `${studentId}-${date}`;

  const getStatus = (studentId: string, date: string): AttendanceStatus | null => {
    const localStatus = localStatuses.get(getCellKey(studentId, date));
    if (localStatus !== undefined) return localStatus;

    const record = attendanceData?.records.find(
      r => r.student === studentId && r.date === date
    );
    return record?.status || null;
  };

  const handleCellClick = (studentId: string, date: string) => {
    if (readOnly) return;

    const currentStatus = getStatus(studentId, date);
    const nextStatus = currentStatus ? getNextStatus(currentStatus) : 'PRESENT';

    // Check for duplicate TRIAL
    if (nextStatus === 'TRIAL') {
      const hasExistingTrial = attendanceData?.records.some(
        r => r.student === studentId && r.status === 'TRIAL'
      );
      if (hasExistingTrial) {
        toast.info('У этого ученика уже есть пробный урок в этой группе');
      }
    }

    const cellKey = getCellKey(studentId, date);
    setLocalStatuses(prev => new Map(prev).set(cellKey, nextStatus));

    markMutation.mutate({ studentId, date, status: nextStatus });
  };

  const handleMarkAllAsPresent = (date: string) => {
    if (readOnly) return;
    markAllMutation.mutate(date);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold sticky left-0 z-10 bg-gray-50">
                Ученик
              </th>
              {dates.slice(0, 3).map(date => (
                <th key={date} className="border border-gray-300 bg-gray-50 px-2 py-2 text-center font-semibold">
                  <div className="animate-pulse bg-gray-200 h-4 w-12 mx-auto rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 3).map((_, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2 sticky left-0 z-10 bg-white">
                  <div className="animate-pulse bg-gray-200 h-4 w-24 rounded" />
                </td>
                {dates.slice(0, 3).map(date => (
                  <td key={date} className="border border-gray-300 px-2 py-2">
                    <div className="animate-pulse bg-gray-200 h-6 w-8 mx-auto rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold sticky left-0 z-10 bg-gray-50 shadow-sm">
              Ученик
            </th>
            {dates.map(date => (
              <th
                key={date}
                className="border border-gray-300 bg-gray-50 px-2 py-2 text-center font-semibold sticky top-0 z-20"
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{formatDate(date)}</span>
                  {!readOnly && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleMarkAllAsPresent(date)}
                      disabled={markAllMutation.isPending}
                      className="text-xs px-2 py-1"
                      title="Отметить всех как «Пришел»"
                    >
                      Всех ✓
                    </Button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td className="border border-gray-300 px-4 py-2 font-medium sticky left-0 z-10 bg-white shadow-sm">
                {student.fullName || student.username}
              </td>
              {dates.map(date => {
                const status = getStatus(student.id, date);
                const config = status ? getStatusConfig(status) : null;
                const isPending = markMutation.isPending;

                return (
                  <td
                    key={date}
                    onClick={() => !isPending && handleCellClick(student.id, date)}
                    className={cn(
                      'border border-gray-300 px-2 py-2 text-center cursor-pointer transition-colors min-w-[60px]',
                      !readOnly && 'hover:bg-gray-50',
                      config?.bgColor,
                      config?.borderColor,
                      config?.textColor
                    )}
                  >
                    {status ? (
                      <span className="text-sm font-medium">{config?.label}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
