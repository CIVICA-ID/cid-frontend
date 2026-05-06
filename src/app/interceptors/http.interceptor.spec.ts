import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { httpInterceptorService } from './http.interceptor';
import { IdempotencyClientService } from '@/services/idempotency-client.service';
import { SessionService } from '@/services/session.service';
import { Router } from '@angular/router';

describe('httpInterceptorService', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let currentBranch: string | null;

    const sessionServiceMock: Pick<SessionService, 'ensureFreshAccessToken' | 'getBranch' | 'logout' | 'refreshAccessToken'> = {
        ensureFreshAccessToken: jasmine.createSpy('ensureFreshAccessToken').and.returnValue(of('access-token')),
        refreshAccessToken: jasmine.createSpy('refreshAccessToken').and.returnValue(of('access-token')),
        getBranch: () => currentBranch,
        logout: jasmine.createSpy('logout')
    };

    const routerMock = {
        navigate: jasmine.createSpy('navigate').and.resolveTo(true)
    };

    beforeEach(() => {
        currentBranch = 'branch-a';

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([httpInterceptorService])),
                provideHttpClientTesting(),
                IdempotencyClientService,
                { provide: SessionService, useValue: sessionServiceMock },
                { provide: Router, useValue: routerMock }
            ]
        });

        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        (sessionServiceMock.ensureFreshAccessToken as jasmine.Spy).calls.reset();
        (sessionServiceMock.refreshAccessToken as jasmine.Spy).calls.reset();
        (sessionServiceMock.logout as jasmine.Spy).calls.reset();
        (routerMock.navigate as jasmine.Spy).calls.reset();
    });

    it('shares one mutating request for the same branch and body', () => {
        const firstResponse: Array<unknown> = [];
        const secondResponse: Array<unknown> = [];

        http.post('/api/items', { name: 'test' }).subscribe((value) => {
            firstResponse.push(value);
        });
        http.post('/api/items', { name: 'test' }).subscribe((value) => {
            secondResponse.push(value);
        });

        const requests = httpMock.match('/api/items');
        expect(requests.length).toBe(1);

        const request = requests[0];
        expect(request.request.headers.get('Idempotency-Key')).toBeTruthy();
        expect(request.request.headers.get('x-access-token')).toBe('access-token');
        expect(request.request.headers.get('x-access-branch')).toBe('branch-a');

        request.flush({ ok: true });

        expect(firstResponse).toEqual([{ ok: true }]);
        expect(secondResponse).toEqual([{ ok: true }]);
    });

    it('treats the branch as part of the idempotency signature', () => {
        http.post('/api/items', { name: 'test' }).subscribe();
        currentBranch = 'branch-b';
        http.post('/api/items', { name: 'test' }).subscribe();

        const requests = httpMock.match('/api/items');
        expect(requests.length).toBe(2);
        expect(requests[0].request.headers.get('x-access-branch')).toBe('branch-a');
        expect(requests[1].request.headers.get('x-access-branch')).toBe('branch-b');
        expect(requests[0].request.headers.get('Idempotency-Key')).not.toBe(requests[1].request.headers.get('Idempotency-Key'));

        requests[0].flush({ ok: true });
        requests[1].flush({ ok: true });
    });

    it('does not attach idempotency or auth headers to auth endpoints', () => {
        http.post('/auth/login', { user: 'demo' }).subscribe();

        const request = httpMock.expectOne('/auth/login');
        expect(request.request.headers.has('Idempotency-Key')).toBeFalse();
        expect(request.request.headers.has('x-access-token')).toBeFalse();
        expect(request.request.headers.has('x-access-branch')).toBeFalse();

        request.flush({ ok: true });
    });
});
