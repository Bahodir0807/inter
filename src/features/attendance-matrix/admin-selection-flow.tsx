import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { groupsApi, Group } from '../../entities/group/api';
import { cn } from '../../shared/lib/cn';
import { Button } from '../../shared/ui/buttons/button';

interface AdminSelectionFlowProps {
  onGroupSelected: (group: Group) => void;
}

interface TeacherOption {
  id: string;
  fullName: string;
  username: string;
}

export function AdminSelectionFlow({ onGroupSelected }: AdminSelectionFlowProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getAll(),
  });

  const teachers = groups?.reduce<Map<string, TeacherOption>>((acc, group) => {
    const teacher = group.teacher;
    if (typeof teacher === 'object' && teacher) {
      if (!acc.has(teacher.id)) {
        acc.set(teacher.id, {
          id: teacher.id,
          fullName: teacher.fullName || teacher.username,
          username: teacher.username,
        });
      }
    }
    return acc;
  }, new Map());

  const teachersList = Array.from(teachers?.values() || []);

  const filteredGroups = selectedTeacherId
    ? (groups || []).filter(group => {
        const teacher = group.teacher;
        return typeof teacher === 'object' ? teacher.id === selectedTeacherId : teacher === selectedTeacherId;
      })
    : [];

  if (groupsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedTeacher = teachersList.find(t => t.id === selectedTeacherId);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Администрирование</span>
        <span className="text-gray-400">/</span>
        {selectedTeacher ? (
          <>
            <span className="font-medium">{selectedTeacher.fullName}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500">Выбор группы</span>
          </>
        ) : (
          <span className="text-gray-500">Выбор преподавателя</span>
        )}
      </nav>

      <div>
        <h2 className="text-xl font-semibold mb-4">Выберите преподавателя</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachersList.map(teacher => (
            <button
              key={teacher.id}
              onClick={() => setSelectedTeacherId(teacher.id)}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                selectedTeacherId === teacher.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="font-medium">{teacher.fullName}</div>
              <div className="text-sm text-gray-500">@{teacher.username}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedTeacherId && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Выберите группу</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedTeacherId(null)}
            >
              ← Назад к преподавателям
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => (
              <button
                key={group.id}
                onClick={() => onGroupSelected(group)}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="font-medium">{group.name}</div>
                <div className="text-sm text-gray-500">
                  {typeof group.course === 'object' ? group.course.name : group.course}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Учеников: {Array.isArray(group.students) ? group.students.length : 0}
                </div>
              </button>
            ))}
          </div>
          {filteredGroups.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">У этого преподавателя нет групп</p>
              <Button
                variant="secondary"
                onClick={() => setSelectedTeacherId(null)}
              >
                Выбрать другого преподавателя
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
