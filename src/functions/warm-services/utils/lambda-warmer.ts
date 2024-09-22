import { InvokeCommand, InvokeCommandOutput, LambdaClient } from "@aws-sdk/client-lambda";
import regionConfiguration from "../configuration/regions.config.json";
import { FunctionInfo } from "../models/function-info";

export class LambdaWarmer {
    private readonly BATCH_INTERVAL_MS = 150;
    private readonly BATCH_SIZE = 9;
    private readonly _regions = new Map<string, LambdaClient>();

    constructor() {
        for (const region of regionConfiguration.regions) {
            this._regions.set(region, new LambdaClient({ region }));
        }
    }  

    async warmInBatches(functionInfos: FunctionInfo[]): Promise<void> {

        for (let index = 0; index < functionInfos.length; index += this.BATCH_SIZE) {
            const invocations: Promise<InvokeCommandOutput>[] = [];
            const batch = functionInfos.slice(index, index + this.BATCH_SIZE);

            invocations.push(...batch.map(async ({ functionName, region }, index) => {
                try {
                    console.log(`Initiating request ${index} for ${functionName}`);
                    const start = Date.now();
                    const result = await this.warm(functionName, region);
                    const end = Date.now();
                    console.info({ region, functionName, resultCode: result?.$metadata.httpStatusCode, latency: `${end - start}ms` });
                    return result;
                } catch (e) {
                    console.error(`Error occurred during request ${index} for ${functionName}`, e);
                }
            }));
            
            await Promise.all(invocations);
            await new Promise<void>(res => setTimeout(() => res(), this.BATCH_INTERVAL_MS));
        }
    } 

    private warm(functionName: string, region: string): Promise<InvokeCommandOutput> {
        if (!this._regions.has(region)) {
            console.error(`Region ${region} was not defined in configuration. Function=${functionName}`);
            return Promise.resolve(undefined);
        }
    
        const command = new InvokeCommand({
            FunctionName: functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({
                body: JSON.stringify({}),
                headers: { 'X-Sp-Health-Check': 'true' },
                isBase64Encoded: false
            })
        });
    
        return this._regions.get(region).send(command);
    };   
}
