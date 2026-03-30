import { Animation } from './types';

/**
 * Collection of available animations for video editor elements.
 * Provides predefined animation configurations with sample previews
 * that can be applied to timeline elements.
 *
 * @example
 * ```js
 * import { ANIMATIONS } from '@twick/video-editor';
 *
 * // Get all available animations
 * const allAnimations = ANIMATIONS;
 *
 * // Find a specific animation
 * const fadeAnimation = ANIMATIONS.find(anim => anim.name === 'fade');
 *
 * // Get animation sample
 * const sampleGif = fadeAnimation.getSample();
 *
 * // Apply animation to element
 * element.setAnimation(fadeAnimation);
 * ```
 *
 * @example
 * ```js
 * // Use animation with custom settings
 * const riseAnimation = ANIMATIONS.find(anim => anim.name === 'rise');
 * const customRise = {
 *   ...riseAnimation,
 *   direction: 'down',
 *   interval: 2
 * };
 *
 * element.setAnimation(customRise);
 * ```
 */
export declare const ANIMATIONS: Animation[];
