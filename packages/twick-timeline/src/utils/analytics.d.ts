import { PostHog } from 'posthog-js';

/**
 * Configuration for analytics tracking
 */
export interface AnalyticsConfig {
    /** Whether analytics is enabled */
    enabled?: boolean;
    /** PostHog API key (optional, can use environment variable) */
    apiKey?: string;
    /** PostHog API host */
    apiHost?: string;
    /** Disable session recording */
    disableSessionRecording?: boolean;
}
/**
 * Check if analytics should be enabled
 */
export declare function isAnalyticsEnabled(config?: AnalyticsConfig): boolean;
/**
 * Get PostHog API key from config or environment
 */
export declare function getPostHogApiKey(config?: AnalyticsConfig): string | undefined;
/**
 * Get PostHog API host
 */
export declare function getPostHogApiHost(config?: AnalyticsConfig): string;
/**
 * Safely capture an event if analytics is enabled
 */
export declare function trackEvent(posthog: PostHog, eventName: string, properties?: Record<string, any>, config?: AnalyticsConfig): void;
/**
 * Get PostHog options based on config
 */
export declare function getPostHogOptions(config?: AnalyticsConfig, onLoaded?: (posthog: PostHog) => void): {
    api_host: string;
    disable_session_recording: boolean;
    loaded: ((posthog: PostHog) => void) | undefined;
};
//# sourceMappingURL=analytics.d.ts.map