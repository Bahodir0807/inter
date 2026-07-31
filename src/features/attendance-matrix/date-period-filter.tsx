import { useState } from 'react';
import { cn } from '../../shared/lib/cn';
import { Button } from '../../shared/ui/buttons/button';

type DatePeriod = 'week' | 'month' | 'custom';

interface DatePeriodFilterProps {
  onPeriodChange: (period: DatePeriod, dates?: string[]) => void;
  initialPeriod?: DatePeriod;
}

export function DatePeriodFilter({ onPeriodChange, initialPeriod = 'week' }: DatePeriodFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>(initialPeriod);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  const generateDatesForPeriod = (period: DatePeriod): string[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dates: string[] = [];
    
    if (period === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
    } else if (period === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      for (let i = 0; i <= endOfMonth.getDate() - 1; i++) {
        const date = new Date(startOfMonth);
        date.setDate(startOfMonth.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  const generateCustomDates = (): string[] => {
    if (!customStartDate || !customEndDate) return [];
    
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const dates: string[] = [];
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const handlePeriodChange = (period: DatePeriod) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      const dates = generateDatesForPeriod(period);
      onPeriodChange(period, dates);
    }
  };

  const handleCustomDateApply = () => {
    if (!customStartDate || !customEndDate) {
      setDateError('Выберите обе даты');
      return;
    }

    const start = new Date(customStartDate);
    const end = new Date(customEndDate);

    if (end < start) {
      setDateError('Дата окончания не может быть раньше даты начала');
      return;
    }

    setDateError(null);
    const dates = generateCustomDates();
    if (dates.length > 0) {
      onPeriodChange('custom', dates);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Период:</span>
        <button
          onClick={() => handlePeriodChange('week')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            selectedPeriod === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          )}
        >
          Неделя
        </button>
        <button
          onClick={() => handlePeriodChange('month')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            selectedPeriod === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          )}
        >
          Месяц
        </button>
        <button
          onClick={() => handlePeriodChange('custom')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            selectedPeriod === 'custom'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          )}
        >
          Выбрать диапазон
        </button>
      </div>

      {selectedPeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 ml-4">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => {
              setCustomStartDate(e.target.value);
              setDateError(null);
            }}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-sm"
          />
          <span className="text-gray-500">—</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => {
              setCustomEndDate(e.target.value);
              setDateError(null);
            }}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-sm"
          />
          <Button
            size="sm"
            onClick={handleCustomDateApply}
            disabled={!customStartDate || !customEndDate}
          >
            Применить
          </Button>
          {dateError && (
            <span className="text-sm text-red-500 ml-2">{dateError}</span>
          )}
        </div>
      )}
    </div>
  );
}
