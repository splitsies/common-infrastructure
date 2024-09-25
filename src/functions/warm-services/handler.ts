import { ColdStartTracker } from "./utils/cold-start-tracker";
import { SNSEvent } from "aws-lambda";
import { LambdaWarmer } from "./utils/lambda-warmer";
import { FunctionInfoDao } from "./dao/function-info-dao";

const coldStartTracker = new ColdStartTracker();
const lambdaWarmer = new LambdaWarmer();
const dao = new FunctionInfoDao();

export const main = async (event: SNSEvent) => {
    const regions = new Set<string>(event.Records.map(r => {
        try {
            console.log({ message: r.Sns.Message });
            return JSON.parse(r.Sns.Message).data || process.env.RtRegion
        } catch {
            return process.env.RtRegion;
        }
    }));
    
    for (const messageRegion of regions) {
        // if (coldStartTracker.timeSinceLastWarm(messageRegion) < 300000) { continue; }
        coldStartTracker.setWarmTime(messageRegion);

        // Hit health checks to ensure warm lambda execution environments
        const functionInfos = await dao.listFunctions(messageRegion);
        await lambdaWarmer.warmInBatches(functionInfos);  
    }
}
