import { ColdStartTracker } from "./cold-start-tracker";
import { InvokeCommandOutput } from "@aws-sdk/client-lambda";
import { SNSEvent } from "aws-lambda";
import { LambdaWarmer } from "./lambda-warmer";
import functionConfiguration from "./functions.config.json";

const coldStartTracker = new ColdStartTracker();
const lambdaWarmer = new LambdaWarmer();

export const main = async (_: SNSEvent) => {
    if (!coldStartTracker.coldExecutionEnvironment) { return; }
    coldStartTracker.setFlag();

    // Hit health checks to ensure warm lambda execution environments
    const invocations: Promise<InvokeCommandOutput>[] = [];

    for (const region of Object.keys(functionConfiguration.functions[process.env.Stage])) {
        const functionNames: string[] = functionConfiguration.functions[process.env.Stage][process.env.RtRegion];
        for (const functionName of functionNames) {
            invocations.push(new Promise<InvokeCommandOutput>(async res => {
                const result = await lambdaWarmer.warm(functionName, region);
                console.info({ functionName: functionName, resultCode: result?.$metadata.httpStatusCode });
                res(result);
            }));
        }
    }

    await Promise.all(invocations);
}
