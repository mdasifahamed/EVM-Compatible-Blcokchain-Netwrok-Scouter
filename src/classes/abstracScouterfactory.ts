
import { NetworScouterConfigs } from "../intefaces/interfaces";
import { NetworkScouter } from "./NetworkScouterClass";

export abstract class BaseScouterFactory {
    networkScouters: NetworkScouter[] = [] // List NetworkScouter Instances.
    abstract createNetworScouter(neworkScouterConfigs: NetworScouterConfigs): void
    abstract createAllProviders(networkScouters: NetworkScouter[]): void
    abstract runAllScouter(networkScouters: NetworkScouter[]): void

}