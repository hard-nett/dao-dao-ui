/**
 * This file was automatically generated by @cosmwasm/ts-codegen@1.10.0.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */

import { StdFee } from '@cosmjs/amino'
import {
  CosmWasmClient,
  ExecuteResult,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate'

import {
  Coin,
  Config,
  CosmosMsgForNeutronMsg,
  NullableString,
  ProposalListResponse,
  SingleChoiceProposal,
} from '@dao-dao/types/contracts/NeutronCwdSubdaoTimelockSingle'
import { CHAIN_GAS_MULTIPLIER } from '@dao-dao/utils'

export interface NeutronCwdSubdaoTimelockSingleReadOnlyInterface {
  contractAddress: string
  config: () => Promise<Config>
  proposal: ({
    proposalId,
  }: {
    proposalId: number
  }) => Promise<SingleChoiceProposal>
  listProposals: ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: number
  }) => Promise<ProposalListResponse>
  proposalExecutionError: ({
    proposalId,
  }: {
    proposalId: number
  }) => Promise<NullableString>
}
export class NeutronCwdSubdaoTimelockSingleQueryClient
  implements NeutronCwdSubdaoTimelockSingleReadOnlyInterface
{
  client: CosmWasmClient
  contractAddress: string
  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client
    this.contractAddress = contractAddress
    this.config = this.config.bind(this)
    this.proposal = this.proposal.bind(this)
    this.listProposals = this.listProposals.bind(this)
    this.proposalExecutionError = this.proposalExecutionError.bind(this)
  }
  config = async (): Promise<Config> => {
    return this.client.queryContractSmart(this.contractAddress, {
      config: {},
    })
  }
  proposal = async ({
    proposalId,
  }: {
    proposalId: number
  }): Promise<SingleChoiceProposal> => {
    return this.client.queryContractSmart(this.contractAddress, {
      proposal: {
        proposal_id: proposalId,
      },
    })
  }
  listProposals = async ({
    limit,
    startAfter,
  }: {
    limit?: number
    startAfter?: number
  }): Promise<ProposalListResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      list_proposals: {
        limit,
        start_after: startAfter,
      },
    })
  }
  proposalExecutionError = async ({
    proposalId,
  }: {
    proposalId: number
  }): Promise<NullableString> => {
    return this.client.queryContractSmart(this.contractAddress, {
      proposal_execution_error: {
        proposal_id: proposalId,
      },
    })
  }
}
export interface NeutronCwdSubdaoTimelockSingleInterface
  extends NeutronCwdSubdaoTimelockSingleReadOnlyInterface {
  contractAddress: string
  sender: string
  timelockProposal: (
    {
      msgs,
      proposalId,
    }: {
      msgs: CosmosMsgForNeutronMsg[]
      proposalId: number
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  executeProposal: (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  overruleProposal: (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  updateConfig: (
    {
      overrulePrePropose,
      owner,
    }: {
      overrulePrePropose?: string
      owner?: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
}
export class NeutronCwdSubdaoTimelockSingleClient
  extends NeutronCwdSubdaoTimelockSingleQueryClient
  implements NeutronCwdSubdaoTimelockSingleInterface
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
    this.timelockProposal = this.timelockProposal.bind(this)
    this.executeProposal = this.executeProposal.bind(this)
    this.overruleProposal = this.overruleProposal.bind(this)
    this.updateConfig = this.updateConfig.bind(this)
  }
  timelockProposal = async (
    {
      msgs,
      proposalId,
    }: {
      msgs: CosmosMsgForNeutronMsg[]
      proposalId: number
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        timelock_proposal: {
          msgs,
          proposal_id: proposalId,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  executeProposal = async (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        execute_proposal: {
          proposal_id: proposalId,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  overruleProposal = async (
    {
      proposalId,
    }: {
      proposalId: number
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        overrule_proposal: {
          proposal_id: proposalId,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  updateConfig = async (
    {
      overrulePrePropose,
      owner,
    }: {
      overrulePrePropose?: string
      owner?: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        update_config: {
          overrule_pre_propose: overrulePrePropose,
          owner,
        },
      },
      fee,
      memo,
      _funds
    )
  }
}
