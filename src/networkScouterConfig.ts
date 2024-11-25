import dotenv from "dotenv";
dotenv.config()
import { NetworScouterConfig } from "./intefaces/interfaces";
export const NetworScouterConfigs: NetworScouterConfig[] = [{
    chianName: "Sepolia",
    chainId: 11155111,
    wallet: "",
    provider_url: process.env.SEPOLIA || "Invalid RPC Url",

}, {
    chianName: "ZetaChainTestNet",
    chainId: 7001,
    wallet: "",
    provider_url: process.env.ZETACHAIN || "Invalid RPC Url"
},
{
    chianName: "BNB Smart Chain Testnet",
    chainId: 97,
    wallet: "",
    provider_url: process.env.BSC || "Invalid RPC Url"

},

{
    chianName: "Polygon Amoy Testnet",
    chainId: 8002,
    wallet: "",
    provider_url: process.env.POLYGON_AMOY || "Invalid RPC Url"

},
{
    chianName: "Avalance Fuji TestNet",
    chainId: 43113,
    wallet: "",
    provider_url: process.env.AVALANCHE_FUJI || "Invalid RPC Url"

},

{
    chianName: "Base Sepolia ",
    chainId: 84532,
    wallet: "",
    provider_url: process.env.Base || "Invalid RPC Url"

},
{
    chianName: "Optimism Sepolia ",
    chainId: 11155420,
    wallet: "",
    provider_url: process.env.OPTIMISM || "Invalid RPC Url"

}
]

