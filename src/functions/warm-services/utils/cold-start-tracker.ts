export class ColdStartTracker {    
    // Leverages Singleton lifetime from inversify to determine
    // if this flag has been set by any operation
    private _regionLastWarmTime = new Map<string, number>();

    timeSinceLastWarm(region: string): number {
        return Date.now() - (this._regionLastWarmTime.get(region) ?? 0);
    }

    setWarmTime(region: string): void {
        this._regionLastWarmTime.set(region, Date.now());
    }
}

