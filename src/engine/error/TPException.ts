
export class TPException extends Error {

    constructor(message: string) {
        super(message);
    }
}

export function TPAssert(cond, msg = null) {
    if (!cond) {
        if(msg == null) {
            msg = "";
        }
        throw new TPException(msg);
    }
}
