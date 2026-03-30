import { default as BaseMediaManager } from './base-media-manager';
import { MediaItem, PaginationOptions, SearchOptions } from '../types';

declare class BrowserMediaManager extends BaseMediaManager {
    private dbName;
    private storeName;
    private db;
    private initDB;
    private getStore;
    private convertArrayBufferToBlob;
    addItem(item: Omit<MediaItem, 'id'>): Promise<MediaItem>;
    addItems(items: Omit<MediaItem, 'id'>[]): Promise<MediaItem[]>;
    getItem(id: string): Promise<MediaItem | undefined>;
    getItems(options?: PaginationOptions): Promise<MediaItem[]>;
    updateItem(id: string, updates: Partial<MediaItem>): Promise<MediaItem | undefined>;
    updateItems(updates: {
        id: string;
        updates: Partial<MediaItem>;
    }[]): Promise<MediaItem[]>;
    deleteItem(id: string): Promise<boolean>;
    deleteItems(ids: string[]): Promise<boolean>;
    search(options: SearchOptions): Promise<MediaItem[]>;
    getTotalCount(): Promise<number>;
}
export default BrowserMediaManager;
