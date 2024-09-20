import { container } from "./inversify.config";
import { IColdStartTracker } from "./cold-start-tracker";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";


const coldStartTracker = container.get<IColdStartTracker>(IColdStartTracker);
const mockRequest = {
    event: {
        body: null,
        headers: {
            Accept: '*/*',
            Host: 'localhost:12948',
            'Content-Type': "application/json",
            'User-Agent': 'curl/8.7.1',
            'X-Forwarded-Port': '12948',
            'X-Forwarded-Proto': 'http'
        },
        httpMethod: 'GET',
        isBase64Encoded: false,
        multiValueHeaders: {
            Accept: [Array],
            Host: [Array],
            'User-Agent': [Array],
            'X-Forwarded-Port': [Array],
            'X-Forwarded-Proto': [Array]
        },
        multiValueQueryStringParameters: null,
        path: '/test',
        pathParameters: null,
        queryStringParameters: null,
        requestContext: {
            accountId: '123456789012',
            apiId: '1234567890',
            domainName: 'localhost:12948',
            extendedRequestId: null,
            httpMethod: 'GET',
            identity: [Object],
            path: '/test',
            protocol: 'HTTP/1.1',
            requestId: '604a2c3c-8170-4290-865c-c86d2826ad6c',
            requestTime: '20/Sep/2024:21:49:46 +0000',
            requestTimeEpoch: 1726868986,
            resourceId: '123456',
            resourcePath: '/test',
            stage: 'Stage'
        },
        resource: '/test',
        stageVariables: null
    }
};

export const main = async (event) => {
    console.log({ coldStart: coldStartTracker.coldExecutionEnvironment });
    console.log({ event });
    coldStartTracker.setFlag();

    const client = new LambdaClient({ region: "us-west-1" });

    const result = await client.send(new InvokeCommand({
        FunctionName: "ocr-service-dev-pr-TestTimeFunction-OVptx72kGdvU",
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(mockRequest),
    }));

    console.log({
        resultCode: result.$metadata.httpStatusCode,
        payload: result.Payload ? JSON.parse(Buffer.from(result.Payload).toString()) : undefined,
    });
    


    const east1Client = new LambdaClient({ region: process.env.RtRegion });
    const processResult = await east1Client.send(new InvokeCommand({
        FunctionName: "ocr-service-dev-pr-TestTimeFunction-OVptx72kGdvU",
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ ...mockRequest, body: { ping: true } }),
    }));

    console.log({
        resultCode: processResult.$metadata.httpStatusCode,
        payload: processResult.Payload ? JSON.parse(Buffer.from(processResult.Payload).toString()) : undefined,
    });

    const getForUserResult = await east1Client.send(new InvokeCommand({
        FunctionName: "expense-service-dev-pr-getForUser",
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ ...mockRequest, body: { ping: true } }),
    }));
    
    console.log({
        resultCode: getForUserResult.$metadata.httpStatusCode,
        payload: getForUserResult.Payload ? JSON.parse(Buffer.from(getForUserResult.Payload).toString()) : undefined,
    });


    if (!coldStartTracker.coldExecutionEnvironment) { return; }
    // Send ping events to the configured endpoints with auth header
}
