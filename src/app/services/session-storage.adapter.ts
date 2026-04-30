import { Injectable } from '@angular/core';

export abstract class SessionStorageAdapter {
    abstract getItem(key: string): string | null;
    abstract setItem(key: string, value: string): void;
    abstract removeItem(key: string): void;
}

@Injectable()
export class BrowserSessionStorageAdapter extends SessionStorageAdapter {
    private readonly memoryStorage = new Map<string, string>();

    private get storage(): Storage | null {
        return typeof localStorage !== 'undefined' ? localStorage : null;
    }

    getItem(key: string): string | null {
        return this.storage?.getItem(key) ?? this.memoryStorage.get(key) ?? null;
    }

    setItem(key: string, value: string): void {
        const storage = this.storage;
        if (storage) {
            storage.setItem(key, value);
            return;
        }

        this.memoryStorage.set(key, value);
    }

    removeItem(key: string): void {
        const storage = this.storage;
        if (storage) {
            storage.removeItem(key);
            return;
        }

        this.memoryStorage.delete(key);
    }
}
