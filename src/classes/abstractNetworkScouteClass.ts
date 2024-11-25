import { TransactionReceipt, TransactionResponse } from "ethers"
import { TokenData } from "../intefaces/interfaces"
export abstract class BaseNetworkScouter {
    /**
     * Class Poperties  Required To Create Class Instances
     * @param {string} chainName // Name of the Blcokchain  
     * @param {number} chainId // ChainId of The Blcokchain
     * @param {string} wallet // Address of the wallet which incoming and outgoing trannaction will be logged
     * @param {string} provider_url // HTTP url of Corresponded RPC Node Provider
     */
    constructor(public chainName: string, public chainId: number, public wallet: string, public provider_url: string) { }
    abstract checkAddress(wallet_addres: string, transactionResponse: TransactionResponse): boolean
    abstract createProvider(): void
    abstract getTransactionList(blockNumber: number): Promise<readonly string[]>;
    abstract getTransactionResponse(transactionHash: string): Promise<TransactionResponse>;
    abstract getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;
    abstract getTokenDetails(tokenAddress: string): Promise<TokenData>;
    abstract processTransactionList(transactionList: readonly string[] | undefined): Promise<void>
    abstract processBlock(blockNumber: number): Promise<void>
    abstract scoutOnNewMinedBlock(): void
    retry<T>(
        fn: () => Promise<T>,
        maxTries: number,
        attempts: number,
        timeout: number
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // Attempt to execute the function
            fn()
                .then(resolve) // Resolve if successful
                .catch((error) => {
                    // Check if maximum attempts are reached
                    if (attempts >= maxTries) {
                        reject(`Failed after ${maxTries} attempts: ${error}`);
                    } else {
                        console.log(`Retrying Attemp No:  ${attempts} .......`)
                        console.log(`Error :\n${error}`)

                        setTimeout(() => {
                            resolve(this.retry(fn, maxTries, attempts + 1, timeout));
                        }, timeout * 2);
                    }
                });
        });
    }


}