/**
 * This file was automatically generated by @cosmwasm/ts-codegen@1.10.0.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */

import { Coin } from '@cosmjs/amino'
import {
  CosmWasmClient,
  ExecuteResult,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate'

import {
  ActiveThreshold,
  ActiveThresholdResponse,
  AnyContractInfo,
  Auth,
  Boolean,
  ClaimsResponse,
  Config,
  DenomResponse,
  Duration,
  GetHooksResponse,
  InfoResponse,
  ListStakersResponse,
  NullableAddr,
  TotalPowerAtHeightResponse,
  Uint128,
  VotingPowerAtHeightResponse,
} from '@dao-dao/types/contracts/SecretDaoVotingTokenStaked'
import { SECRET_GAS } from '@dao-dao/utils'

export interface SecretDaoVotingTokenStakedReadOnlyInterface {
  contractAddress: string
  getConfig: () => Promise<Config>
  claims: ({ auth }: { auth: Auth }) => Promise<ClaimsResponse>
  listStakers: ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: string
  }) => Promise<ListStakersResponse>
  activeThreshold: () => Promise<ActiveThresholdResponse>
  getHooks: () => Promise<GetHooksResponse>
  tokenContract: () => Promise<NullableAddr>
  denom: () => Promise<DenomResponse>
  isActive: () => Promise<Boolean>
  votingPowerAtHeight: ({
    auth,
    height,
  }: {
    auth: Auth
    height?: number
  }) => Promise<VotingPowerAtHeightResponse>
  totalPowerAtHeight: ({
    height,
  }: {
    height?: number
  }) => Promise<TotalPowerAtHeightResponse>
  dao: () => Promise<AnyContractInfo>
  info: () => Promise<InfoResponse>
}
export class SecretDaoVotingTokenStakedQueryClient
  implements SecretDaoVotingTokenStakedReadOnlyInterface
{
  client: CosmWasmClient
  contractAddress: string
  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client
    this.contractAddress = contractAddress
    this.getConfig = this.getConfig.bind(this)
    this.claims = this.claims.bind(this)
    this.listStakers = this.listStakers.bind(this)
    this.activeThreshold = this.activeThreshold.bind(this)
    this.getHooks = this.getHooks.bind(this)
    this.tokenContract = this.tokenContract.bind(this)
    this.denom = this.denom.bind(this)
    this.isActive = this.isActive.bind(this)
    this.votingPowerAtHeight = this.votingPowerAtHeight.bind(this)
    this.totalPowerAtHeight = this.totalPowerAtHeight.bind(this)
    this.dao = this.dao.bind(this)
    this.info = this.info.bind(this)
  }
  getConfig = async (): Promise<Config> => {
    return this.client.queryContractSmart(this.contractAddress, {
      get_config: {},
    })
  }
  claims = async ({ auth }: { auth: Auth }): Promise<ClaimsResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      claims: {
        auth,
      },
    })
  }
  listStakers = async ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: string
  }): Promise<ListStakersResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      list_stakers: {
        limit,
        start_after: startAfter,
      },
    })
  }
  activeThreshold = async (): Promise<ActiveThresholdResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      active_threshold: {},
    })
  }
  getHooks = async (): Promise<GetHooksResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      get_hooks: {},
    })
  }
  tokenContract = async (): Promise<NullableAddr> => {
    return this.client.queryContractSmart(this.contractAddress, {
      token_contract: {},
    })
  }
  denom = async (): Promise<DenomResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      denom: {},
    })
  }
  isActive = async (): Promise<Boolean> => {
    return this.client.queryContractSmart(this.contractAddress, {
      is_active: {},
    })
  }
  votingPowerAtHeight = async ({
    auth,
    height,
  }: {
    auth: Auth
    height?: number
  }): Promise<VotingPowerAtHeightResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      voting_power_at_height: {
        auth,
        height,
      },
    })
  }
  totalPowerAtHeight = async ({
    height,
  }: {
    height?: number
  }): Promise<TotalPowerAtHeightResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      total_power_at_height: {
        height,
      },
    })
  }
  dao = async (): Promise<AnyContractInfo> => {
    return this.client.queryContractSmart(this.contractAddress, {
      dao: {},
    })
  }
  info = async (): Promise<InfoResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      info: {},
    })
  }
}
export interface SecretDaoVotingTokenStakedInterface
  extends SecretDaoVotingTokenStakedReadOnlyInterface {
  contractAddress: string
  sender: string
  stake: (
    fee?: number,
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  unstake: (
    {
      amount,
    }: {
      amount: Uint128
    },
    fee?: number,
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  updateConfig: (
    {
      duration,
    }: {
      duration?: Duration
    },
    fee?: number,
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  claim: (
    fee?: number,
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  updateActiveThreshold: (
    {
      newThreshold,
    }: {
      newThreshold?: ActiveThreshold
    },
    fee?: number,
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  addHook: (
    {
      addr,
      codeHash,
    }: {
      addr: string
      codeHash: string
    },
    fee?: number,
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  removeHook: (
    {
      addr,
      codeHash,
    }: {
      addr: string
      codeHash: string
    },
    fee?: number,
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
}
export class SecretDaoVotingTokenStakedClient
  extends SecretDaoVotingTokenStakedQueryClient
  implements SecretDaoVotingTokenStakedInterface
{
  client: SigningCosmWasmClient
  sender: string
  contractAddress: string
  constructor(
    client: SigningCosmWasmClient,
    sender: string,
    contractAddress: string
  ) {
    super(client, contractAddress)
    this.client = client
    this.sender = sender
    this.contractAddress = contractAddress
    this.stake = this.stake.bind(this)
    this.unstake = this.unstake.bind(this)
    this.updateConfig = this.updateConfig.bind(this)
    this.claim = this.claim.bind(this)
    this.updateActiveThreshold = this.updateActiveThreshold.bind(this)
    this.addHook = this.addHook.bind(this)
    this.removeHook = this.removeHook.bind(this)
  }
  stake = async (
    fee: number = SECRET_GAS.STAKE,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        stake: {},
      },
      fee,
      memo,
      _funds
    )
  }
  unstake = async (
    {
      amount,
    }: {
      amount: Uint128
    },
    fee: number = SECRET_GAS.UNSTAKE,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        unstake: {
          amount,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  updateConfig = async (
    {
      duration,
    }: {
      duration?: Duration
    },
    fee: number = 1_000_000,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        update_config: {
          duration,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  claim = async (
    fee: number = SECRET_GAS.CLAIM,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        claim: {},
      },
      fee,
      memo,
      _funds
    )
  }
  updateActiveThreshold = async (
    {
      newThreshold,
    }: {
      newThreshold?: ActiveThreshold
    },
    fee: number = 1_000_000,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        update_active_threshold: {
          new_threshold: newThreshold,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  addHook = async (
    {
      addr,
      codeHash,
    }: {
      addr: string
      codeHash: string
    },
    fee: number = 1_000_000,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        add_hook: {
          addr,
          code_hash: codeHash,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  removeHook = async (
    {
      addr,
      codeHash,
    }: {
      addr: string
      codeHash: string
    },
    fee: number = 1_000_000,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        remove_hook: {
          addr,
          code_hash: codeHash,
        },
      },
      fee,
      memo,
      _funds
    )
  }
}
