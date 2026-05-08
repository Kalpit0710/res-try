export type DataChangeEventDetail = { type: 'classes' | 'subjects' | 'all' };

const BROADCAST_DELAY = 50; // ms delay to ensure listener is ready

export function emitDataChange(detail: DataChangeEventDetail = { type: 'all' }) {
  // Small delay to ensure listeners are ready
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent<DataChangeEventDetail>('data-change', { detail }));
  }, BROADCAST_DELAY);
}

export function addDataChangeListener(listener: (detail: DataChangeEventDetail) => void) {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<DataChangeEventDetail>;
    listener(custom.detail);
  };

  window.addEventListener('data-change', handler as EventListener);
  return () => window.removeEventListener('data-change', handler as EventListener);
}
