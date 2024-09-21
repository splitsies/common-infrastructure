import { container } from "./inversify.config";
import { IColdStartTracker } from "./cold-start-tracker";
import { InvokeCommand, InvokeCommandOutput, LambdaClient } from "@aws-sdk/client-lambda";
import regionConfiguration from "./regions.config.json";
import functionConfiguration from "./functions.config.json";

const coldStartTracker = container.get<IColdStartTracker>(IColdStartTracker);
const regions = new Map<string, LambdaClient>();

for (const region of regionConfiguration.regions) {
    regions.set(region, new LambdaClient({ region }));
}

const warm = (functionName: string, region: string): Promise<InvokeCommandOutput> => {
    if (!regions.has(region)) {
        console.error(`Region ${region} was not defined in configuration`);
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

    return regions.get(region).send(command);
};

export const main = async (event) => {
    console.log({ coldStart: coldStartTracker.coldExecutionEnvironment, region: process.env.RtRegion, event });
    coldStartTracker.setFlag();

    const invocations: Promise<InvokeCommandOutput>[] = [];

    for (const functionName of Object.keys(functionConfiguration.functions)) {
        const regions: string[] = functionConfiguration.functions[functionName];
        for (const region of regions) {
            invocations.push(new Promise<InvokeCommandOutput>(async res => {
                const result = await warm(functionName, region);

                console.log({
                    functionName,
                    resultCode: result.$metadata.httpStatusCode,
                    // payload: result.Payload ? JSON.parse(Buffer.from(result.Payload).toString()) : undefined,
                });

                res(result);
            }));
        }
    }

    await Promise.all(invocations);

    if (!coldStartTracker.coldExecutionEnvironment) { return; }
    // Send ping events to the configured endpoints with auth header
}
