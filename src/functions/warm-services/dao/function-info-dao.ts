import { DynamoDBClient, QueryCommand, QueryCommandInput, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { FunctionInfo } from "../models/function-info";

export class FunctionInfoDao {
    private readonly _client: DynamoDBClient;

    constructor() {
        this._client = new DynamoDBClient({
            region: process.env.RtRegion
        });
    }

    async listFunctions(region: string, timeoutMs = 25000): Promise<FunctionInfo[]> {
        const timeout = Date.now() + timeoutMs;
        const items: FunctionInfo[] = [];
        const queryInput: QueryCommandInput = {
            TableName: `Splitsies-FunctionWarmingIndex-${process.env.Stage}`,
            KeyConditionExpression: "#region = :region",
            ExpressionAttributeNames: { "#region": "region" },
            ExpressionAttributeValues: { ":region": { S: region } },
        };

        do {
            const response = await this._client.send(new QueryCommand(queryInput));
            items.push(...this.unmarshallResults(response));
            queryInput.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (queryInput.ExclusiveStartKey && Date.now() < timeout);

        if (queryInput.ExclusiveStartKey) {
            console.error(
                `QueryAll failed for ${queryInput.TableName}: Too many records. Fetched ${items.length} records in ${timeout}ms`,
            );
            throw new Error();
        }

        return items;
    }

    protected unmarshallResults(data: QueryCommandOutput): FunctionInfo[] {
        if (!data?.Items) return [];
        return data.Items.map((i) => new FunctionInfo(i.region.S, parseInt(i.priority.N), i.functionName.S));
    }
}