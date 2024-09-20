import "reflect-metadata";
import { Container } from "inversify";
import { ColdStartTracker, IColdStartTracker } from "./cold-start-tracker";

const container = new Container({ defaultScope: "Singleton" });

container.bind<IColdStartTracker>(IColdStartTracker).to(ColdStartTracker);

export { container };
