import { Injectable } from '@angular/core';
import { Observable, finalize, shareReplay } from 'rxjs';

function createStableKey(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }

    return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

@Injectable({
    providedIn: 'root'
})
export class IdempotencyClientService {
    private readonly inFlightRequests = new Map<string, Observable<unknown>>();
    private readonly requestKeys = new Map<string, string>();

    getOrCreateKey(signature: string): string {
        const existing = this.requestKeys.get(signature);
        if (existing) {
            return existing;
        }

        const nextKey = createStableKey();
        this.requestKeys.set(signature, nextKey);
        return nextKey;
    }

    getOrShare<T>(signature: string, factory: () => Observable<T>): Observable<T> {
        const existing = this.inFlightRequests.get(signature) as Observable<T> | undefined;
        if (existing) {
            return existing;
        }

        const shared$ = factory().pipe(
            shareReplay({ bufferSize: 1, refCount: false }),
            finalize(() => {
                this.inFlightRequests.delete(signature);
                this.requestKeys.delete(signature);
            })
        );

        this.inFlightRequests.set(signature, shared$ as Observable<unknown>);
        return shared$;
    }

    clear(signature?: string): void {
        if (signature) {
            this.inFlightRequests.delete(signature);
            this.requestKeys.delete(signature);
            return;
        }

        this.inFlightRequests.clear();
        this.requestKeys.clear();
    }
}
