import { ColdStartTracker } from "./utils/cold-start-tracker";
import { InvokeCommandOutput } from "@aws-sdk/client-lambda";
import { SNSEvent } from "aws-lambda";
import { LambdaWarmer } from "./utils/lambda-warmer";
import { FunctionInfoDao } from "./dao/function-info-dao";

const coldStartTracker = new ColdStartTracker();
const lambdaWarmer = new LambdaWarmer();
const dao = new FunctionInfoDao();

export const main = async (event: SNSEvent) => {
    const regions = new Set<string>(event.Records.map(r => {
        try {
            return JSON.parse(r.Sns.Message).data || process.env.RtRegion
        } catch {
            return process.env.RtRegion;
        }
    }));

    const invocations: Promise<InvokeCommandOutput>[] = [];
    for (const messageRegion of regions) {
        if (!coldStartTracker.isColdStart(messageRegion)) { continue; }
        coldStartTracker.setFlag(messageRegion);

        // Hit health checks to ensure warm lambda execution environments
        const functionInfos = await dao.listFunctions(messageRegion);
        invocations.push(...functionInfos.map(async ({ functionName, region }) => {
            const start = Date.now();
            const result = await lambdaWarmer.warm(functionName, region);
            const end = Date.now();
            console.info({ region, functionName, resultCode: result?.$metadata.httpStatusCode, latency: `${end - start}ms` });
            return result;
        }));
    }

    await Promise.all(invocations);
}
