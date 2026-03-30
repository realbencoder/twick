import { TrackJSON } from '../../types';
import { TrackElement } from '../elements/base.element';
import { TrackFriend } from './track.friend';

/**
 * Track class represents a timeline track that contains multiple elements.
 * A track is a container for timeline elements (video, audio, text, etc.) that
 * can be arranged sequentially or in parallel. Tracks provide validation,
 * serialization, and element management capabilities.
 *
 * @example
 * ```js
 * import { Track, VideoElement, TextElement } from '@twick/timeline';
 *
 * // Create a new track
 * const videoTrack = new Track("Video Track");
 *
 * // Add elements to the track
 * const videoElement = new VideoElement({
 *   src: "video.mp4",
 *   start: 0,
 *   end: 10
 * });
 *
 * videoTrack.createFriend().addElement(videoElement);
 *
 * // Serialize the track
 * const trackData = videoTrack.serialize();
 * ```
 */
export declare class Track {
    private id;
    private name;
    private type;
    private language?;
    private props;
    private elements;
    private validator;
    /**
     * Creates a new Track instance.
     *
     * @param name - The display name for the track
     * @param type - The type of the track
     * @param id - Optional unique identifier (auto-generated if not provided)
     *
     * @example
     * ```js
     * const track = new Track("My Video Track");
     * const trackWithId = new Track("Audio Track", "element", "video-track-1");
     * ```
     */
    constructor(name: string, type?: string, id?: string);
    /**
     * Creates a friend instance for explicit access to protected methods.
     * This implements the Friend Class Pattern to allow controlled access
     * to protected methods while maintaining encapsulation.
     *
     * @returns TrackFriend instance that can access protected methods
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const friend = track.createFriend();
     *
     * // Use friend to add elements
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     * friend.addElement(element);
     * ```
     */
    createFriend(): TrackFriend;
    /**
     * Friend method to add element (called by TrackFriend).
     * Provides controlled access to the protected addElement method.
     *
     * @param element - The element to add to the track
     * @param skipValidation - If true, skips validation (use with caution)
     * @returns true if element was added successfully
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const friend = track.createFriend();
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     *
     * const success = track.addElementViaFriend(element);
     * // success = true if element was added successfully
     * ```
     */
    addElementViaFriend(element: TrackElement, skipValidation?: boolean): boolean;
    /**
     * Friend method to remove element (called by TrackFriend).
     * Provides controlled access to the protected removeElement method.
     *
     * @param element - The element to remove from the track
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     *
     * track.removeElementViaFriend(element);
     * // Element is removed from the track
     * ```
     */
    removeElementViaFriend(element: TrackElement): void;
    /**
     * Friend method to update element (called by TrackFriend).
     * Provides controlled access to the protected updateElement method.
     *
     * @param element - The updated element to replace the existing one
     * @returns true if element was updated successfully
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     *
     * // Update the element
     * element.setEnd(15);
     * const success = track.updateElementViaFriend(element);
     * // success = true if element was updated successfully
     * ```
     */
    updateElementViaFriend(element: TrackElement): boolean;
    /**
     * Gets the unique identifier of the track.
     *
     * @returns The track's unique ID string
     *
     * @example
     * ```js
     * const track = new Track("My Track", "element", "track-123");
     * const id = track.getId(); // "track-123"
     * ```
     */
    getId(): string;
    /**
     * Gets the display name of the track.
     *
     * @returns The track's display name
     *
     * @example
     * ```js
     * const track = new Track("Video Track");
     * const name = track.getName(); // "Video Track"
     * ```
     */
    getName(): string;
    setName(name: string): this;
    /**
     * Gets the type of the track.
     *
     * @returns The track's type string
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const type = track.getType(); // "element"
     * ```
     */
    getType(): string;
    setType(type: string): this;
    getLanguage(): string | undefined;
    setLanguage(language?: string): this;
    /**
     * Gets a read-only array of all elements in the track.
     * Returns a copy of the elements array to prevent external modification.
     *
     * @returns Read-only array of track elements
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const elements = track.getElements();
     * // elements is a read-only array of TrackElement instances
     *
     * elements.forEach(element => {
     *   console.log(`Element: ${element.getId()}, Duration: ${element.getEnd() - element.getStart()}`);
     * });
     * ```
     */
    getElements(): ReadonlyArray<TrackElement>;
    getProps(): Record<string, any>;
    setProps(props: Record<string, any>): this;
    /**
     * Validates a single element using the track's validator.
     * Checks if the element meets all validation requirements.
     *
     * @param element - The element to validate
     * @returns true if valid, throws ValidationError if invalid
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     *
     * try {
     *   const isValid = track.validateElement(element);
     *   console.log('Element is valid:', isValid);
     * } catch (error) {
     *   if (error instanceof ValidationError) {
     *     console.log('Validation failed:', error.errors);
     *   }
     * }
     * ```
     */
    validateElement(element: TrackElement): boolean;
    /**
     * Gets the total duration of the track.
     * Calculates the duration based on the end time of the last element.
     *
     * @returns The total duration of the track in seconds
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const duration = track.getTrackDuration(); // 0 if no elements
     *
     * // After adding elements
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 30 });
     * track.createFriend().addElement(element);
     * const newDuration = track.getTrackDuration(); // 30
     * ```
     */
    getTrackDuration(): number;
    /**
     * Adds an element to the track with validation.
     * Protected method that should be accessed through TrackFriend.
     *
     * @param element - The element to add to the track
     * @param skipValidation - If true, skips validation (use with caution)
     * @returns true if element was added successfully, throws ValidationError if validation fails
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     *
     * // Use friend to access this protected method
     * const friend = track.createFriend();
     * const success = friend.addElement(element);
     * ```
     */
    protected addElement(element: TrackElement, skipValidation?: boolean): boolean;
    isElementColliding(element: TrackElement): boolean;
    /**
     * Removes an element from the track.
     * Protected method that should be accessed through TrackFriend.
     *
     * @param element - The element to remove from the track
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     *
     * // Use friend to access this protected method
     * const friend = track.createFriend();
     * friend.removeElement(element);
     * ```
     */
    protected removeElement(element: TrackElement): void;
    /**
     * Updates an element in the track with validation.
     * Protected method that should be accessed through TrackFriend.
     *
     * @param element - The updated element to replace the existing one
     * @returns true if element was updated successfully, throws ValidationError if validation fails
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     *
     * // Use friend to access this protected method
     * const friend = track.createFriend();
     * element.setEnd(15);
     * const success = friend.updateElement(element);
     * ```
     */
    protected updateElement(element: TrackElement): boolean;
    /**
     * Finds an element in the track by its ID.
     *
     * @param id - The unique identifier of the element to find
     * @returns The found element or undefined if not found
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     * track.createFriend().addElement(element);
     *
     * const foundElement = track.getElementById(element.getId());
     * // foundElement is the same element instance
     * ```
     */
    getElementById(id: string): Readonly<TrackElement> | undefined;
    /**
     * Validates all elements in the track and returns combined result and per-element status.
     * Provides detailed validation information for each element including errors and warnings.
     *
     * @returns Object with overall isValid and array of per-element validation results
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const element1 = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     * const element2 = new TextElement({ text: "Hello", start: 5, end: 15 });
     *
     * track.createFriend().addElement(element1);
     * track.createFriend().addElement(element2);
     *
     * const validation = track.validateAllElements();
     * console.log('Overall valid:', validation.isValid);
     *
     * validation.results.forEach(result => {
     *   console.log(`Element ${result.element.getId()}: ${result.isValid ? 'Valid' : 'Invalid'}`);
     *   if (result.errors) {
     *     console.log('Errors:', result.errors);
     *   }
     *   if (result.warnings) {
     *     console.log('Warnings:', result.warnings);
     *   }
     * });
     * ```
     */
    validateAllElements(): {
        isValid: boolean;
        results: Array<{
            element: TrackElement;
            isValid: boolean;
            errors?: string[];
            warnings?: string[];
        }>;
    };
    /**
     * Serializes the track and all its elements to JSON format.
     * Converts the track structure to a format that can be stored or transmitted.
     *
     * @returns TrackJSON object representing the track and its elements
     *
     * @example
     * ```js
     * const track = new Track("My Track");
     * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
     * track.createFriend().addElement(element);
     *
     * const trackData = track.serialize();
     * // trackData = {
     * //   id: "t-abc123",
     * //   name: "My Track",
     * //   type: "element",
     * //   elements: [{ ... }]
     * // }
     *
     * // Save to localStorage
     * localStorage.setItem('track-data', JSON.stringify(trackData));
     * ```
     */
    serialize(): TrackJSON;
    /**
     * Creates a Track instance from JSON data.
     * Static factory method for deserializing track data.
     *
     * @param json - JSON object containing track data
     * @returns New Track instance with loaded data
     *
     * @example
     * ```js
     * const trackData = {
     *   id: "t-abc123",
     *   name: "My Track",
     *   type: "element",
     *   elements: [
     *     {
     *       id: "e-def456",
     *       type: "video",
     *       src: "video.mp4",
     *       start: 0,
     *       end: 10
     *     }
     *   ]
     * };
     *
     * const track = Track.fromJSON(trackData);
     * console.log(track.getName()); // "My Track"
     * console.log(track.getElements().length); // 1
     * ```
     */
    static fromJSON(json: any): Track;
}
//# sourceMappingURL=track.d.ts.map