const EXPLICIT_TIMEZONE_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i;
const LOCAL_DATE_TIME_PATTERN =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;

export function formatLocalDateTime(date: Date): string {
    const pad = (value: number): string => String(Math.trunc(Math.abs(value))).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function serializeDateTimeForApi(value: unknown): string | null {
    if (value instanceof Date) {
        return formatLocalDateTime(value);
    }

    if (value === null || value === undefined) {
        return null;
    }

    const normalizedValue = String(value).trim();
    return normalizedValue.length ? normalizedValue : null;
}

export function deserializeApiDateTime(value: unknown): Date | null {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    const normalizedValue = String(value).trim();
    if (!normalizedValue.length) {
        return null;
    }

    if (EXPLICIT_TIMEZONE_PATTERN.test(normalizedValue)) {
        const parsed = new Date(normalizedValue);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const match = normalizedValue.match(LOCAL_DATE_TIME_PATTERN);
    if (!match) {
        const parsed = new Date(normalizedValue);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const [, year, month, day, hours = '00', minutes = '00', seconds = '00', milliseconds = '0'] = match;

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
        Number(seconds),
        Number(milliseconds.padEnd(3, '0'))
    );
}

export function serializeDateTimeFields<T extends Record<string, any>>(data: T, fields: readonly string[]): T {
    const serialized = { ...data } as Record<string, unknown>;

    fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(serialized, field)) {
            serialized[field] = serializeDateTimeForApi(serialized[field]);
        }
    });

    return serialized as T;
}
