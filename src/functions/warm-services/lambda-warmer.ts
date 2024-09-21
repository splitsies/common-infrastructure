import { InvokeCommand, InvokeCommandOutput, LambdaClient } from "@aws-sdk/client-lambda";
import regionConfiguration from "./regions.config.json";

export class LambdaWarmer {
    private readonly _regions = new Map<string, LambdaClient>();

    constructor() {
        for (const region of regionConfiguration.regions) {
            this._regions.set(region, new LambdaClient({ region }));
        }
    }

    warm(functionName: string, region: string): Promise<InvokeCommandOutput> {
        if (!this._regions.has(region)) {
            console.error(`Region ${region} was not defined in configuration. Function=${functionName}`);
            return Promise.resolve(undefined);
        }
    
        const command = new InvokeCommand({
            FunctionName: functionName,
            InvocationType: 'Event',
            Payload: JSON.stringify({
                body: JSON.stringify({}),
                headers: { 'X-Sp-Health-Check': 'true' },
                isBase64Encoded: false
            })
        });
    
        return this._regions.get(region).send(command);
    };
}
