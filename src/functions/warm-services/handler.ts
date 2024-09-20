import { container } from "./inversify.config";
import { IColdStartTracker } from "./cold-start-tracker";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";


const coldStartTracker = container.get<IColdStartTracker>(IColdStartTracker);

export const main = async (event) => {
    console.log({ coldStart: coldStartTracker.coldExecutionEnvironment });
    console.log({ event });
    coldStartTracker.setFlag();

    const client = new LambdaClient({ region: "us-west-1" });

    const result = await client.send(new InvokeCommand({
        FunctionName: "ocr-service-dev-pr-TestTimeFunction-OVptx72kGdvU",
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(event),
    }));

    console.log({
        resultCode: result.$metadata.httpStatusCode,
        payload: result.Payload ? JSON.parse(Buffer.from(result.Payload).toString()) : undefined,
    });
    


    const east1Client = new LambdaClient({ region: process.env.RtRegion });
    const processResult = await east1Client.send(new InvokeCommand({
        FunctionName: "ocr-service-dev-pr-TestTimeFunction-OVptx72kGdvU",
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ ping: true }),
    }));

    console.log({
        resultCode: processResult.$metadata.httpStatusCode,
        payload: processResult.Payload ? JSON.parse(Buffer.from(processResult.Payload).toString()) : undefined,
    });

    const getForUserResult = await east1Client.send(new InvokeCommand({
        FunctionName: "expense-service-dev-pr-getForUser",
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ ping: true }),
    }));
    
    console.log({
        resultCode: getForUserResult.$metadata.httpStatusCode,
        payload: getForUserResult.Payload ? JSON.parse(Buffer.from(getForUserResult.Payload).toString()) : undefined,
    });


    if (!coldStartTracker.coldExecutionEnvironment) { return; }
    // Send ping events to the configured endpoints with auth header
}
