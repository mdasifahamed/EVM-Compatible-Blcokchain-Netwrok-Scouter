import { BaseScouterFactory } from "./abstracScouterfactory";
import { NetworkScouter } from "./NetworkScouterClass";
import { NetworScouterConfigs } from "../intefaces/interfaces";

export class NetworkScouterFactory extends BaseScouterFactory {


    /**
     * createNetworScouter(): Creates Instances Of The Of NetworkScouter Class Stores it The Class property `networkScouters` array
     * @param {NetworScouterConfigs} networScouterConfigs Configuration List Of each Blockchain Network Whose NetworkScouter Will Be Craeted
     */
    createNetworScouter(networScouterConfigs: NetworScouterConfigs): void {
        console.log(`Creating Network Scouters`)
        networScouterConfigs.map((networkScouter) => {
            const newNetworkScouter = new NetworkScouter(networkScouter.chianName, networkScouter.chainId, networkScouter.wallet, networkScouter.provider_url)
            return this.networkScouters.push(newNetworkScouter);
        })
        console.log(`All The Network Scouters Are Created`)
    }


    /**
     * createAllProviders(): Creates The global node provider for each NetworScouter Class Instances
     */
    createAllProviders(): void {
        try {
            this.networkScouters.map((networkScouter) => {
                return networkScouter.createProvider()
            })
        } catch (error) {
            console.log(error)
        }
    }

    /**
     * runAllScouter(): Start the scounting of Network for all of the  NetworkScouter instances  parallelly
     */
    runAllScouter(): void {

        try {
            this.networkScouters.forEach(async (networkScouter) => {
                await networkScouter.scoutOnNewMinedBlock()
            })
        } catch (error) {
            console.log(error)
        }
    }
}