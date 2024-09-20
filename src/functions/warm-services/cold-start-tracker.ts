import { injectable } from "inversify";


export const IColdStartTracker = Symbol.for("IColdStartTracker");
export interface IColdStartTracker {
    readonly coldExecutionEnvironment: boolean;
    setFlag(): void;
}

@injectable()
export class ColdStartTracker implements IColdStartTracker {

    private _coldExecutionEnvironment: boolean = true;

    constructor() {
        // Leverages Singleton lifetime from inversify to determine
        // if this flag has been set by any operation
        this._coldExecutionEnvironment = true;
    }

    get coldExecutionEnvironment(): boolean {
        return this._coldExecutionEnvironment;
    }

    setFlag(): void {
        this._coldExecutionEnvironment = false;
    }
}

