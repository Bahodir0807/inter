import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Group } from '../../entities/group/api';
import { usersApi } from '../../entities/user/api';
import { AttendanceMatrix, AdminSelectionFlow, DatePeriodFilter } from '../../features/attendance-matrix';
import { PageLayout } from '../../widgets/page/page-layout';
import { Card } from '../../shared/ui/surfaces/card';
import { useI18n } from '../../shared/i18n/i18n';

type DatePeriod = 'week' | 'month' | 'custom';

export function AttendancePage() {
  const { t } = useI18n();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>('week');
  const [dates, setDates] = useState<string[]>([]);

  const { data: studentsData } = useQuery({
    queryKey: ['students', selectedGroup?.id],
    queryFn: () => usersApi.getStudents({ limit: 100 }),
    enabled: !!selectedGroup,
  });

  const students = studentsData || [];

  const handleGroupSelected = (group: Group) => {
    setSelectedGroup(group);
  };

  const handlePeriodChange = (period: DatePeriod, newDates?: string[]) => {
    setSelectedPeriod(period);
    if (newDates) {
      setDates(newDates);
    }
  };

  const handleBackToSelection = () => {
    setSelectedGroup(null);
  };

  return (
    <PageLayout
      eyebrow={t('common.attendance')}
      title={t('attendance.title')}
      description={t('attendance.description')}
    >
      {!selectedGroup ? (
        <Card>
          <AdminSelectionFlow onGroupSelected={handleGroupSelected} />
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedGroup.name}</h2>
                <p className="text-sm text-gray-500">
                  {typeof selectedGroup.course === 'object' ? selectedGroup.course.name : selectedGroup.course}
                </p>
              </div>
              <button
                onClick={handleBackToSelection}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Выбрать другую группу
              </button>
            </div>
            <DatePeriodFilter onPeriodChange={handlePeriodChange} initialPeriod={selectedPeriod} />
          </Card>

          {dates.length > 0 && (
            <Card>
              <AttendanceMatrix
                groupId={selectedGroup.id}
                students={students}
                dates={dates}
                readOnly={false}
              />
            </Card>
          )}
        </div>
      )}
    </PageLayout>
  );
}
