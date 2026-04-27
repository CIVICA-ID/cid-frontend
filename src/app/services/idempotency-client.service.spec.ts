import { Subject, of } from 'rxjs';
import { IdempotencyClientService } from './idempotency-client.service';

describe('IdempotencyClientService', () => {
    let service: IdempotencyClientService;

    beforeEach(() => {
        service = new IdempotencyClientService();
    });

    it('reuses the same key for the same signature until it is cleared', () => {
        const signature = 'POST|/api/items|branch-a|{"name":"test"}';

        const firstKey = service.getOrCreateKey(signature);
        const secondKey = service.getOrCreateKey(signature);

        expect(firstKey).toBe(secondKey);

        service.clear(signature);

        const thirdKey = service.getOrCreateKey(signature);
        expect(thirdKey).not.toBe(firstKey);
    });

    it('shares the same in-flight observable for one signature and releases it when completed', () => {
        const signature = 'POST|/api/items|branch-a|{"name":"test"}';
        const source$ = new Subject<number>();
        let factoryCalls = 0;
        let firstValue: number | undefined;
        let secondValue: number | undefined;

        const first$ = service.getOrShare(signature, () => {
            factoryCalls++;
            return source$.asObservable();
        });

        const second$ = service.getOrShare(signature, () => {
            factoryCalls++;
            return of(99);
        });

        first$.subscribe((value) => {
            firstValue = value;
        });
        second$.subscribe((value) => {
            secondValue = value;
        });

        expect(factoryCalls).toBe(1);

        source$.next(7);
        source$.complete();

        expect(firstValue).toBe(7);
        expect(secondValue).toBe(7);

        const third$ = service.getOrShare(signature, () => {
            factoryCalls++;
            return of(13);
        });

        let thirdValue: number | undefined;
        third$.subscribe((value) => {
            thirdValue = value;
        });

        expect(factoryCalls).toBe(2);
        expect(thirdValue).toBe(13);
    });
});
