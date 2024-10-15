/**
 * This file was automatically generated by @cosmwasm/ts-codegen@0.24.0.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */

import { PossibleShit } from './ShitStrap'

export interface ShitstrapFactoryInstantiateMsg {
  shitstrap_id: number
}
export interface ShitstrapInstantiateMsg {
  accepted: PossibleShit[]
  cutoff: Uint128
  owner: string
  shitmos: UncheckedDenom
}
export type InstantiateNativeShitstrapContractMsg = {
  instantiate_msg: ShitstrapInstantiateMsg
  label: string
}

export type ExecuteMsg =
  | {
      create_native_shit_strap_contract: {
        instantiate_msg: ShitstrapInstantiateMsg
        label: string
      }
    }
  | {
      update_code_id: {
        shitstrap_code_id: number
      }
    }
  | {
      update_ownership: Action
    }
export type Uint128 = string
export type UncheckedDenom =
  | {
      native: string
    }
  | {
      cw20: string
    }
export type Action =
  | {
      transfer_ownership: {
        expiry?: Expiration | null
        new_owner: string
      }
    }
  | 'accept_ownership'
  | 'renounce_ownership'
export type Expiration =
  | {
      at_height: number
    }
  | {
      at_time: Timestamp
    }
  | {
      never: {}
    }
export type Timestamp = Uint64
export type Uint64 = string
export type QueryMsg =
  | {
      list_shitstrap_contracts: {
        limit?: number | null
        start_after?: string | null
      }
    }
  | {
      list_shitstrap_contracts_reverse: {
        limit?: number | null
        start_before?: string | null
      }
    }
  | {
      list_shitstrap_contracts_by_instantiator: {
        instantiator: string
        limit?: number | null
        start_after?: string | null
      }
    }
  | {
      list_shitstrap_contracts_by_instantiator_reverse: {
        instantiator: string
        limit?: number | null
        start_before?: string | null
      }
    }
  | {
      list_shitstrap_contracts_by_token: {
        limit?: number | null
        recipient: string
        start_after?: string | null
      }
    }
  | {
      list_shitstrap_contracts_by_token_reverse: {
        limit?: number | null
        recipient: string
        start_before?: string | null
      }
    }
  | {
      ownership: {}
    }
  | {
      code_id: {}
    }
export type ArrayOfShitstrapContract = ShitstrapContract[]
export interface ShitstrapContract {
  contract: string
  instantiator: string
  shit: string
}
export type Addr = string
export interface OwnershipForAddr {
  owner?: Addr | null
  pending_expiry?: Expiration | null
  pending_owner?: Addr | null
}
