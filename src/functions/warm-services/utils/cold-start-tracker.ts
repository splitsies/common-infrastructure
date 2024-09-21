export class ColdStartTracker {    
    // Leverages Singleton lifetime from inversify to determine
    // if this flag has been set by any operation
    private _regionColdStartCache = new Map<string, boolean>();

    isColdStart(region: string): boolean {
        // If no entry exists, that means that we are in a cold start for that region.
        return this._regionColdStartCache.get(region) ?? true;
    }

    setFlag(region: string): void {
        this._regionColdStartCache.set(region, false);
    }
}

