import { container } from "./inversify.config";
import { IColdStartTracker } from "./cold-start-tracker";
import { InvokeCommandOutput } from "@aws-sdk/client-lambda";
import { ILambdaWarmer } from "./lambda-warmer";
import functionConfiguration from "./functions.config.json";

const coldStartTracker = container.get<IColdStartTracker>(IColdStartTracker);
const lambdaWarmer = container.get<ILambdaWarmer>(ILambdaWarmer);

export const main = async (event) => {
    console.log({ coldStart: coldStartTracker.coldExecutionEnvironment, region: process.env.RtRegion, event });
    coldStartTracker.setFlag();

    const invocations: Promise<InvokeCommandOutput>[] = [];

    for (const functionName of Object.keys(functionConfiguration.functions)) {
        const regions: string[] = functionConfiguration.functions[functionName];
        for (const region of regions) {
            invocations.push(new Promise<InvokeCommandOutput>(async res => {
                const result = await lambdaWarmer.warm(functionName, region);
                console.debug({ functionName, resultCode: result?.$metadata.httpStatusCode });
                res(result);
            }));
        }
    }

    await Promise.all(invocations);

    if (!coldStartTracker.coldExecutionEnvironment) { return; }
    // Send ping events to the configured endpoints with auth header
}
