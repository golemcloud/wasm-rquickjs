import { fail, failEnum, failString, failRecord, Gate } from 'quickjs:error-provider/api';

const json = (value) => JSON.stringify(value, (_key, item) =>
    typeof item === 'bigint' ? String(item) : item,
);

async function describe(call) {
    try {
        return await call();
    } catch (error) {
        return {
            text: String(error),
            message: new Error(error).message,
            json: json(error),
            keys: typeof error === 'object' ? Object.keys(error) : [],
            spread: typeof error === 'object' ? json({ ...error }) : null,
        };
    }
}

export async function observe() {
    return JSON.stringify([
        await describe(() => fail('permission-denied')),
        await describe(() => fail('backend-error')),
        await describe(() => fail('nested')),
        await describe(() => Gate.failStatic('backend-error')),
        await describe(failEnum),
        await describe(failString),
        await describe(failRecord),
        await describe(() => fail('success')),
    ]);
}

export const output = {
    async rethrow(kind) {
        try {
            return await fail(kind);
        } catch (error) {
            String(error);
            throw error;
        }
    },
};
