import "reflect-metadata";
import { Container } from "inversify";
import { ColdStartTracker, IColdStartTracker } from "./cold-start-tracker";
import { ILambdaWarmer, LambdaWarmer } from "./lambda-warmer";

const container = new Container({ defaultScope: "Singleton" });

container.bind<IColdStartTracker>(IColdStartTracker).to(ColdStartTracker);
container.bind<ILambdaWarmer>(ILambdaWarmer).to(LambdaWarmer);

export { container };
