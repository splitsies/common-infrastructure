import { ColdStartTracker } from "./cold-start-tracker";
import { InvokeCommandOutput } from "@aws-sdk/client-lambda";
import { SNSEvent } from "aws-lambda";
import { LambdaWarmer } from "./lambda-warmer";
import { FunctionInfoDao } from "./dao/function-info-dao";

const coldStartTracker = new ColdStartTracker();
const lambdaWarmer = new LambdaWarmer();
const dao = new FunctionInfoDao();

export const main = async (event: SNSEvent) => {
    // if (!coldStartTracker.coldExecutionEnvironment) { return; }
    console.log({ coldStart: coldStartTracker.coldExecutionEnvironment, event, region: process.env.RtRegion });
    coldStartTracker.setFlag();

    // Hit health checks to ensure warm lambda execution environments
    const invocations: Promise<InvokeCommandOutput>[] = [];
    const functionInfos = await dao.listFunctions(process.env.RtRegion);

    for (const { functionName, region } of functionInfos) {
        invocations.push(new Promise<InvokeCommandOutput>(async res => {
            const result = await lambdaWarmer.warm(functionName, region);
            console.info({ functionName: functionName, resultCode: result?.$metadata.httpStatusCode });
            res(result);
        }));        
    }

    await Promise.all(invocations);
}
