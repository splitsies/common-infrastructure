export class ColdStartTracker {

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

