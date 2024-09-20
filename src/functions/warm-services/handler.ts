import { container } from "./inversify.config";
import { IColdStartTracker } from "./cold-start-tracker";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";


const coldStartTracker = container.get<IColdStartTracker>(IColdStartTracker);
const mockRequest = {
    body: JSON.stringify({}),
    headers: {
        Accept: '*/*',
        Host: 'localhost:12948',
        'Content-Type': "application/json",
        'User-Agent': 'curl/8.7.1',
        'X-Forwarded-Port': '12948',
        'X-Forwarded-Proto': 'http'
    },
    httpMethod: 'GET',
    isBase64Encoded: false
};

export const main = async (event) => {
    console.log({ coldStart: coldStartTracker.coldExecutionEnvironment, region: process.env.RtRegion });
    console.log({ event });
    coldStartTracker.setFlag();

    const client = new LambdaClient({ region: "us-west-1" });

    const result = await client.send(new InvokeCommand({
        FunctionName: "ocr-service-dev-pr-TestTimeFunction-OVptx72kGdvU",
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(mockRequest),
    }));

    console.log({
        FunctionName: "ocr-service-dev-pr-TestTimeFunction-OVptx72kGdvU",
        resultCode: result.$metadata.httpStatusCode,
        payload: result.Payload ? JSON.parse(Buffer.from(result.Payload).toString()) : undefined,
    });
    


    const east1Client = new LambdaClient({ region: process.env.RtRegion || "us-east-1" });
    const processResult = await east1Client.send(new InvokeCommand({
        FunctionName: "ocr-service-dev-pr-process",
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ ...mockRequest, body: { ping: true } }),
    }));

    console.log({
        FunctionName: "ocr-service-dev-pr-process",
        resultCode: processResult.$metadata.httpStatusCode,
        payload: processResult.Payload ? JSON.parse(Buffer.from(processResult.Payload).toString()) : undefined,
    });

    const getForUserResult = await east1Client.send(new InvokeCommand({
        FunctionName: "expense-service-dev-pr-getForUser",
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ ...mockRequest, body: { ping: true } }),
    }));
    
    console.log({
        FunctionName: "expense-service-dev-pr-getForUser",
        resultCode: getForUserResult.$metadata.httpStatusCode,
        payload: getForUserResult.Payload ? JSON.parse(Buffer.from(getForUserResult.Payload).toString()) : undefined,
    });


    if (!coldStartTracker.coldExecutionEnvironment) { return; }
    // Send ping events to the configured endpoints with auth header
}
