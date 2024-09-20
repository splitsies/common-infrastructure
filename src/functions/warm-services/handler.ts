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

    console.log({ result });

    if (!coldStartTracker.coldExecutionEnvironment) { return; }
    // Send ping events to the configured endpoints with auth header
}
