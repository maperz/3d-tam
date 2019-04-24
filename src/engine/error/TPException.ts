
export class TPException extends Error {

    constructor(message: string) {
        super(message);
    }
}

export function TPAssert(cond, msg) {
    if (!cond) {
        throw new TPException(msg);
    }
}
