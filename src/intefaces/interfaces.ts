/**
 * Type Interface For Logging Transfer Of A ERC20 Token 
 */
export interface TransferEventData {
    transactionHash: string | null,
    chainName: string,
    chainId: number
    tokenInfo: TokenData | undefined,
    from: string,
    to: string,
    transferAmount: string
}

/**
 * Type Interface For ERC20 Token Informations
*/
export interface TokenData {
    tokenName: string,
    tokenSymbol: string,
    tokenAddress: string,
    tokenDecimal: number,
}


/**
 * Type Interface For Logging Native Token Transfer
*/

export interface NativeTokenTransferdata {
    transactionHash: string | null,
    from: string | null,
    to: string | null,
    transferAmount: number | null
    chainName: string,
    chainId: number
}

/**
 * Type Interface For Setting Up BlockChain Network Configuration For Scouting
 *  And Creating Instance Of NetworkScouter
 */
export interface NetworScouterConfig {
    chianName: string,
    chainId: number,
    wallet: string,
    provider_url: string
}

/**
 * Type Extention To Array From Single Object
 */
export type NetworScouterConfigs = NetworScouterConfig[]





