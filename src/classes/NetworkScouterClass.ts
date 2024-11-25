import { Block, Contract, ethers, JsonRpcProvider, TransactionReceipt, TransactionResponse } from "ethers";
import { BaseNetworkScouter } from "./abstractNetworkScouteClass";
import { ERC20_ABI } from "../intefaces/TOKEN_ABI";
import { NativeTokenTransferdata, TokenData, TransferEventData } from '../intefaces/interfaces';



export class NetworkScouter extends BaseNetworkScouter {
    private isProcessing: boolean = false; // checkPoint for queueing a block

    private queueBlockList: number[] = [] // list queued blcoks

    private nodeProvider: JsonRpcProvider = new JsonRpcProvider() // global node provider for the class
    private static readonly ERC20_TRANSFER_INTERFACE = new ethers.Interface([
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]); // Event interface for parsing transerfer event

    private currentProccessingBlock: number = 0; // to hold current proccessing blocknumber

    /**
     * createProvider() creates global node provider to use accross the class
     * It uses class property  `provider_url` fro creating JSON-RPC provider
     * Set the class private property `nodeProvider`
     */

    createProvider(): void {
        if (!this.provider_url) {
            throw new Error(`Provider URL not found at getProvider() for chain ${this.chainName}`);
        }

        try {
            const provider: JsonRpcProvider = new ethers.JsonRpcProvider(this.provider_url);
            this.nodeProvider = provider
        } catch (error) {
            console.error(`Failed to connect to the provider at ${this.chainName} with ChainId ${this.chainId}`);
            console.error(error);
            throw new Error(`Failed to connect to the provider: ${error}`);
        }

    }

    /**
     * checkAddress(): Checks for wallet address in a transation 
     * @param {string} wallet Address of the wallet that needs to be checked for logging 
     * @param {TransactionResponse} transactionResponse Object of the Transaction Response  
     * @returns true/false
     */

    checkAddress(wallet: string, transactionResponse: TransactionResponse): boolean {
        if (!transactionResponse) {
            return false;
        }
        const walletLower = wallet.toLowerCase();
        const fromLower = transactionResponse.from?.toLowerCase();
        const toLower = transactionResponse.to?.toLowerCase();
        return walletLower === fromLower || walletLower === toLower;
    }

    /**
     * getTransactionList() retrives teh transactions list from a blcok
     * @param {number} blockNumber Number of the blocks from where the transction list will retrived. 
     * @returns {readonly string[]} List of Transaction Hashes
     */

    async getTransactionList(blockNumber: number): Promise<readonly string[]> {
        if (!blockNumber) {
            throw new Error(`Invalid block number provided at getTransactionList() for chain ${this.chainName}`);
        }

        try {
            const blockDetails: Block | null = await this.retry(() => this.nodeProvider.getBlock(blockNumber), 6, 1, 10000);

            if (blockDetails === null) {
                console.error(`BlockDetails Not Found at ${this.chainName}`);
                throw new Error(`Block details not found for block number ${blockNumber} on chain ${this.chainName}`);
            }

            const transactionList: readonly string[] = blockDetails.transactions;
            return transactionList;
        } catch (error) {
            console.error(`Unexpected error at getTransactionList() on chain ${this.chainName}:\n${error}`);
            throw new Error(`Unexpected error occurred while fetching transaction list for chain ${this.chainName}`);
        }
    }


    /**
     * getTransactionResponse(): Takes Transcation hash and returns the TransactionResponse Objects
     * @param {string} transactionHash Hash of transactions
     * @returns {TransactionResponse} If successfull return TransactionResponse object else throw error
     */

    async getTransactionResponse(transactionHash: string): Promise<TransactionResponse> {
        if (!transactionHash) {
            console.error(`Invalid Transaction Hash: ${transactionHash}`);
            throw new Error(`Invalid Transaction Hash provided at ${this.chainName} in getTransactionResponse()`);
        }
        try {
            const transactionResponse: TransactionResponse | null = await this.retry(() => this.nodeProvider.getTransaction(transactionHash), 5, 6, 6000);
            if (!transactionResponse) {
                console.error(`Failed to get transaction response for: ${transactionHash}`);
                throw new Error(`Transaction response not found at ${this.chainName} in getTransactionResponse()`);
            }
            return transactionResponse;
        } catch (error) {
            console.error(`Unexpected error occurred at ${this.chainName} in getTransactionResponse():`, error);
            throw new Error(`Failed to fetch transaction response for ${transactionHash} at ${this.chainName}`);
        }
    }

    /**
     * getTransactionReceipt(): Takes Transcation hash and returns the TransactionReceipt Objects
     * @param {string} transactionHash Hash of transactions
     * @returns {TransactionReceipt} If successfull return TransactionReceipt object else throw error
     */

    async getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt> {
        if (!transactionHash) {
            console.error(`Invalid Transaction Hash: ${transactionHash}`);
            throw new Error(`Invalid Transaction Hash provided at ${this.chainName} in getTransactionReceipt()`);
        }

        try {
            const transactionReceipt: TransactionReceipt | null = await this.retry(() => this.nodeProvider.getTransactionReceipt(transactionHash), 5, 6, 6000);
            if (!transactionReceipt) {
                console.error(`Failed to get transaction receipt for: ${transactionHash}`);
                throw new Error(`Transaction receipt not found at ${this.chainName} in getTransactionReceipt()`);
            }
            return transactionReceipt;
        } catch (error) {
            console.error(`Unexpected error occurred at ${this.chainName} in getTransactionReceipt():`, error);
            throw new Error(`Failed to fetch transaction receipt for ${transactionHash} at ${this.chainName}`);
        }
    }

    /**
     * getTokenDetails() takes address of token return token information
     * @param {string} tokenAddress Address of the token 
     * @returns {TokenData} if successfull retruns TokenData object
     */

    async getTokenDetails(tokenAddress: string): Promise<TokenData> {
        if (!tokenAddress) {
            throw new Error(`Token address is required at getTokenDetails() for chain ${this.chainName}`);
        }

        const tokenContract: Contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.nodeProvider);
        if (!tokenContract) {
            console.error(`Invalid Token Address or Token ABI!`);
            throw new Error(`Invalid Token Address or Token ABI for ${this.chainName} in getTokenDetails()`);
        }

        try {
            const tokenName = await this.retry(() => tokenContract.name(), 5, 1, 10000);
            const tokenSymbol = await this.retry(() => tokenContract.symbol(), 6, 1, 10000);
            const tokenDecimal = parseInt(await tokenContract.decimals());

            return {
                tokenAddress,
                tokenName,
                tokenSymbol,
                tokenDecimal,
            };
        } catch (error) {
            console.error(`Failed to fetch token details at ${this.chainName} in getTokenDetails(): ${error}`);
            throw new Error(`Error fetching token details for ${tokenAddress} on chain ${this.chainName}`);
        }
    }

    /**
     * processTransactionList(): proccss the transactionlist and logs the corresponsded transaction if found in the transationList of block
     * @param {readonly string[]} transactionList List of th transaction hashes
     * @returns Logs the transaction log if is native token transafer then logs `NativeTokenTransferdata` for ER20 token transfer logs `TransferEventData`
     * for any issues throws error.
     */

    async processTransactionList(transactionList: readonly string[] | undefined): Promise<void> {
        if (!transactionList || transactionList.length === 0) {
            console.log('Invalid or Empty Transaction List');
            return; // Early return if the list is invalid or empty
        }
        const totalTransactions = transactionList.length;
        for (let i = 0; i < totalTransactions; i++) {
            console.log(`Proccessing Transaction No ${i + 1} At Block ${this.currentProccessingBlock} At ${this.chainName} `)
            try {
                const result = await Promise.allSettled([
                    this.retry(() => this.getTransactionResponse(transactionList[i]), 6, 1, 6000),
                    this.retry(() => this.getTransactionReceipt(transactionList[i]), 6, 1, 6000),
                ])

                if ((result[0].status === "fulfilled") && (result[1].status === "fulfilled")) {
                    const transactionResponse = result[0].value;
                    const transactionReceipt = result[1].value;
                    if (!this.checkAddress(this.wallet.toLowerCase(), transactionResponse)) {
                        continue;
                    }

                    const nativetransferValue = parseFloat(ethers.formatEther(transactionResponse.value))
                    // check native token transfer
                    if (nativetransferValue !== 0) {
                        const nativeTokenTransferValue: NativeTokenTransferdata = {
                            chainName: this.chainName,
                            chainId: this.chainId,
                            transactionHash: transactionResponse.hash,
                            from: transactionResponse.from,
                            to: transactionResponse.to,
                            transferAmount: nativetransferValue
                        }
                        console.log("Native Token Transaction \n", nativeTokenTransferValue)
                    }

                    if (transactionReceipt.logs.length !== 0) {
                        const eventInfo: ethers.LogDescription | null = NetworkScouter.ERC20_TRANSFER_INTERFACE.parseLog(transactionReceipt.logs[0])
                        try {
                            const tokenData: TokenData = await this.retry(() => this.getTokenDetails(transactionReceipt.logs[0].address), 6, 1, 6000)
                            const tokenTransferData: TransferEventData = {
                                tokenInfo: tokenData,
                                chainName: this.chainName,
                                chainId: this.chainId,
                                transactionHash: transactionReceipt.hash,
                                from: eventInfo?.args[0],
                                to: eventInfo?.args[1],
                                transferAmount: ethers.formatEther(eventInfo?.args[2])
                            }
                            console.log("Token Transfer \n", tokenTransferData)
                        } catch (error) {
                            console.log(`Failed Get Token Info At ${this.chainName}`)
                            console.log(error)
                        }
                    }

                }
            } catch (error) {
                console.log(`Error at processing transaction list at:${this.chainName}`);
                console.log(error)
            }

        }
    }


    /**
     * processBlock(): proccess a block by its number by  doing retriving transactionList from a block
     * then proccess that transactionList.
     * @param {number} blockNumber number of the block to process 
     * @returns log transations if found on the block or for any issue throws error
     */
    async processBlock(blockNumber: number): Promise<void> {
        console.log(`Looking for transactions at block: ${blockNumber} from chain: ${this.chainName} with ChainId: ${this.chainId}`);

        const transactionList: readonly string[] = await this.retry(() => this.getTransactionList(blockNumber), 6, 1, 6000) || [];
        console.log(`Number of transactions found ${transactionList.length} at block: ${blockNumber} from chain: ${this.chainName} with ChainId: ${this.chainId}`);

        if (transactionList.length === 0) {
            console.log(`No transactions found at block: ${blockNumber} from chain: ${this.chainName} with ChainId: ${this.chainId}`);
            return; // Early return if no transactions are found
        }

        try {
            await this.retry(() => this.processTransactionList(transactionList), 6, 1, 6000); // Process transactions if the list is valid
        } catch (error) {
            console.log(`Failed to process block: ${blockNumber} from chain: ${this.chainName} with ChainId: ${this.chainId}`);
            throw error; // 
        }
    }


    /**
     * scoutOnNewMinedBlock(): It starts listening for newly mined than block then catcth the block on the 
     * class propety to quesd block then pass the a pass block to the proccessBlock() to proccess 
     * Continuously queue the block and send it to proccessBlock() from the queue to proccessTransactionList and 
     * To log the transactions
     */
    async scoutOnNewMinedBlock(): Promise<void> {


        this.nodeProvider.on("block", async (blockNumber) => {
            console.log(`New Block Mined: ${blockNumber} at ${this.chainName} with ChainId: ${this.chainId}`);
            this.queueBlockList.push(blockNumber)

            // Only process one block at a time
            if (!this.isProcessing) {
                this.isProcessing = true;
                try {
                    const blockToLook = this.queueBlockList.shift(); // Removes the first element from the array
                    this.currentProccessingBlock = blockToLook ?? 0
                    if (!blockToLook || this.currentProccessingBlock === 0) {
                        console.log("Block Not Found");
                        return; // Return early if no block to process
                    }

                    // Process the block
                    await this.retry(() => this.processBlock(blockToLook), 6, 1, 6000);
                    this.isProcessing = false; // Reset processing state once done

                } catch (error) {
                    console.log(`Failed to process block ${blockNumber} at chain ${this.chainName} with ChainId: ${this.chainId}`);
                    throw error; // Rethrow error to propagate
                }
            } else {
                console.log(`Already processing a block at ${this.chainName}, queuing block: ${blockNumber} for ${this.chainName}`);
            }
        });
    }


}