import { TrackElement } from '../elements/base.element';
import { Track } from './track';

/**
 * Friend class that provides explicit access to Track's protected methods
 * This implements the Friend Class Pattern for better encapsulation control
 */
export declare class TrackFriend {
    private track;
    constructor(track: Track);
    /**
     * Add an element to the track with validation
     * @param element The element to add
     * @param skipValidation If true, skips validation (use with caution)
     * @returns true if element was added successfully, throws ValidationError if validation fails
     */
    addElement(element: TrackElement, skipValidation?: boolean): boolean;
    /**
     * Remove an element from the track
     * @param element The element to remove
     */
    removeElement(element: TrackElement): void;
    /**
     * Update an element in the track with validation
     * @param element The element to update
     * @returns true if element was updated successfully, throws ValidationError if validation fails
     */
    updateElement(element: TrackElement): boolean;
    /**
     * Get the track instance (for advanced operations)
     * @returns The track instance
     */
    getTrack(): Track;
}
//# sourceMappingURL=track.friend.d.ts.map