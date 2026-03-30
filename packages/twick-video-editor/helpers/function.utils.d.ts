/**
 * Creates a debounced version of a function.
 * The function will only be called after it has not been invoked
 * for the specified delay.
 *
 * Useful for expensive operations that should not run on every
 * keystroke / mouse move (e.g. resize handlers, search, etc.).
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Creates a throttled version of a function.
 * The function will be called at most once in every `interval`
 * milliseconds, ignoring additional calls in between.
 *
 * Useful for high–frequency events like scroll / mousemove where
 * you still want regular updates but not on every event.
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, interval: number): (...args: Parameters<T>) => void;
