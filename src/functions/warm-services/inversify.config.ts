import { Container, injectable } from "inversify";
import "reflect-metadata";
import { ColdStartTracker, IColdStartTracker } from "./cold-start-tracker";
const container = new Container({ defaultScope: "Singleton" });
container.bind<IColdStartTracker>(IColdStartTracker).to(ColdStartTracker);
export { container };
