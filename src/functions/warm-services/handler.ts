import { container } from "./inversify.config";
import { IColdStartTracker } from "./cold-start-tracker";

const coldStartTracker = container.get<IColdStartTracker>(IColdStartTracker);

export const main = async (event) => {
    console.log({ coldStart: coldStartTracker.coldExecutionEnvironment }, event);
    coldStartTracker.setFlag();
    if (!coldStartTracker.coldExecutionEnvironment) { return; }

    // Send ping events to the configured endpoints with auth header
}
