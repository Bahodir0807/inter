import { create } from 'zustand';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  title: string;
  tone: ToastTone;
}

interface ToastStore {
  items: ToastItem[];
  push: (title: string, tone: ToastTone) => void;
  remove: (id: number) => void;
}

const useToastStore = create<ToastStore>(set => ({
  items: [],
  push: (title, tone) => {
    const id = Date.now() + Math.round(Math.random() * 1000);
    set(state => ({ items: [...state.items, { id, title, tone }] }));
    window.setTimeout(() => {
      set(state => ({ items: state.items.filter(item => item.id !== id) }));
    }, 3200);
  },
  remove: id => set(state => ({ items: state.items.filter(item => item.id !== id) })),
}));

export const toast = {
  success: (title: string) => useToastStore.getState().push(title, 'success'),
  error: (title: string) => useToastStore.getState().push(title, 'error'),
  info: (title: string) => useToastStore.getState().push(title, 'info'),
};

export function Toaster() {
  const items = useToastStore(state => state.items);
  const remove = useToastStore(state => state.remove);

  return (
    <div className="toast-stack" aria-live="polite">
      {items.map(item => (
        <button
          key={item.id}
          className={`toast toast--${item.tone}`}
          type="button"
          onClick={() => remove(item.id)}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}
