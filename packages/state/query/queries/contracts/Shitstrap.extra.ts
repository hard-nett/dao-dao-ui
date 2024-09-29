import { QueryClient, queryOptions } from "@tanstack/react-query"
import { Config as ShitstrapConfig, ShitstrapInfo } from "@dao-dao/types/contracts/ShitStrap"
import { shitStrapQueries } from "./ShitStrap"

import { GenericToken, TokenType } from '@dao-dao/types'
/**
 * Fetch info for a shitstrap contract
 */
export const fetchShitstrapInfo = async (
    queryClient: QueryClient,
    {
        chainId,
        address,
    }: {
        chainId: string
        address: string
    }
): Promise<ShitstrapInfo> => {

    const [
        config,
    ] = await Promise.all([
        queryClient.fetchQuery(
            shitStrapQueries.config(queryClient, {
                chainId,
                contractAddress: address,
            })
        ).then(async (config) => {
            config.accepted

            return (config)
        }),
    ])

    // convert types from contract into dao-dao ui compatible types
    let shit: GenericToken = {
        chainId,
        type: TokenType.Native,// accepted.token, // if token is cw20 uncheckeddenom type, set to Tokentype cw20. otherwise Tokentype is native
        denomOrAddress:  'native' in config.shitmos_addr ? config.shitmos_addr.native : config.shitmos_addr.cw20, 
        symbol: "",
        decimals: 6,
        imageUrl: undefined,
        source: {
            chainId,
            type: 'native' in config.shitmos_addr ? TokenType.Native : TokenType.Cw20,
            denomOrAddress:  'native' in config.shitmos_addr ? config.shitmos_addr.native : config.shitmos_addr.cw20,
        }
    }
    let acceptedGenericShit = config.accepted.map((accepted) => {
        let token: GenericToken = {
            chainId,
            type: 'native' in accepted.token ? TokenType.Native : TokenType.Cw20,
            denomOrAddress: 'native' in accepted.token ? accepted.token.native : accepted.token.cw20,
            symbol: "",
            decimals: 6,
            imageUrl: undefined,
            source: {
                chainId,
                type: 'native' in accepted.token ? TokenType.Native : TokenType.Cw20,
                denomOrAddress: 'native' in accepted.token ? accepted.token.native : accepted.token.cw20,
            }
        }
         return token
    })

    return {
        title: config.title,
        description: config.description,
        owner: config.owner,
        chainId,
        shitstrapContractAddr: address,
        eligibleAssets: config.accepted,
        elegibleGenericAssets: acceptedGenericShit,
        shit,
        full: config.full_of_shit,
        cutoff: config.cutoff
    }
}

export const cwShitstrapExtraQueries = {

    /**
      * Fetch info for a shitstrap contract.
    **/
    info: (
        queryClient: QueryClient,
        options: Parameters<typeof fetchShitstrapInfo>[1]
    ) =>
        queryOptions({
            queryKey: ['cwShitStrapExtra', 'fetchShitstrapInfo', options],
            queryFn: () => fetchShitstrapInfo(queryClient, options),
        }),
}