import { ColdStartTracker } from "./cold-start-tracker";
import { InvokeCommandOutput } from "@aws-sdk/client-lambda";
import { SNSEvent } from "aws-lambda";
import { LambdaWarmer } from "./lambda-warmer";
import functionConfiguration from "./functions.config.json";

const coldStartTracker = new ColdStartTracker();
const lambdaWarmer = new LambdaWarmer();

export const main = async (_: SNSEvent) => {
    console.log({region: process.env.RtRegion, functions: functionConfiguration.functions[process.env.RtRegion]})
    if (!coldStartTracker.coldExecutionEnvironment) { return; }
    coldStartTracker.setFlag();

    // Hit health checks to ensure warm lambda execution environments
    const invocations: Promise<InvokeCommandOutput>[] = [];

    for (const functionName of Object.keys(functionConfiguration.functions[process.env.RtRegion])) {
        const regions: string[] = functionConfiguration.functions[process.env.RtRegion][functionName];
        for (const region of regions) {
            invocations.push(new Promise<InvokeCommandOutput>(async res => {
                const result = await lambdaWarmer.warm(functionName, region);
                console.log({ functionName, resultCode: result?.$metadata.httpStatusCode });
                res(result);
            }));
        }
    }

    await Promise.all(invocations);
}
