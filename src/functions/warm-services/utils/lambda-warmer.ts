import { InvokeCommand, InvokeCommandOutput, LambdaClient } from "@aws-sdk/client-lambda";
import regionConfiguration from "../configuration/regions.config.json";
import { FunctionInfo } from "../models/function-info";

export class LambdaWarmer {
    private readonly BATCH_SIZE = 5;
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

            for (const { functionName, region, priority } of batch) {
                try {
                    console.log(`Initiating request ${priority} for ${functionName}`);
                    const start = Date.now();

                    const result = this.warm(functionName, region).then((res) => {
                        const end = Date.now();
                        console.info({ region, functionName, resultCode: res?.$metadata.httpStatusCode, latency: `${end - start}ms` });
                        return res;
                    });
                   
                    invocations.push(result);
                } catch (e) {
                    console.error(`Error occurred during request ${priority} for ${functionName}`, e);
                }

                await new Promise<void>(res => setTimeout(() => res(), 50));
            }
            
            await Promise.all(invocations);
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
