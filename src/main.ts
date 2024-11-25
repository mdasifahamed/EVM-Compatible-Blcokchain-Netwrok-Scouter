import { NetworScouterConfigs } from "./networkScouterConfig";
import { NetworkScouterFactory } from "./classes/NetworkScouterFactory";

async function main(): Promise<void> {
    const networworkScouterFactory = new NetworkScouterFactory();
    try {
        networworkScouterFactory.createNetworScouter(NetworScouterConfigs);
        networworkScouterFactory.createAllProviders();
        networworkScouterFactory.runAllScouter()
    } catch (error) {
        console.log(error)
    }
}

main().catch((err) => {
    console.log(err)
    process.exit(1)
})