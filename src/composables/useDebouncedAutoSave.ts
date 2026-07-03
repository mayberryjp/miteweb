import { onUnmounted, ref } from "vue";

export interface UseDebouncedAutoSaveOptions {
  /** Performs the actual save. Called after the debounce elapses or on flush. */
  save: () => void | Promise<void>;
  /**
   * Optional guard. When provided and it returns false, scheduling is ignored
   * and flush becomes a no-op unless a save is already pending. Typically
   * `() => !loading.value && isDirty.value`.
   */
  canSave?: () => boolean;
  /** Debounce delay in milliseconds. */
  delay?: number;
}

/**
 * Encapsulates the debounced auto-save pattern (debounce timer + pending flag +
 * flush + automatic cleanup on unmount) that was previously duplicated across
 * every settings panel.
 */
export function useDebouncedAutoSave(options: UseDebouncedAutoSaveOptions) {
  const { save, canSave, delay = 600 } = options;
  const pending = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const runSave = () => {
    pending.value = false;
    void save();
  };

  /** Debounce a save; ignored when `canSave` returns false. */
  const schedule = () => {
    if (canSave && !canSave()) return;
    pending.value = true;
    cancel();
    timer = setTimeout(() => {
      timer = null;
      if (!pending.value) return;
      runSave();
    }, delay);
  };

  /** Save immediately if there is a pending change (or `canSave` allows it). */
  const flush = () => {
    if (!pending.value && !(canSave ? canSave() : false)) return;
    cancel();
    runSave();
  };

  onUnmounted(cancel);

  return { pending, schedule, flush, cancel };
}
