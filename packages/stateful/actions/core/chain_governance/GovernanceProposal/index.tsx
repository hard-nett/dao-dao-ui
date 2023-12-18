import { Coin } from '@cosmjs/stargate'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useRecoilValue, waitForAll } from 'recoil'

import {
  chainSupportsV1GovModuleSelector,
  genericTokenSelector,
  govParamsSelector,
} from '@dao-dao/state'
import {
  ChainProvider,
  DaoSupportedChainPickerInput,
  Loader,
  RaisedHandEmoji,
  useCachedLoading,
  useCachedLoadingWithError,
} from '@dao-dao/stateless'
import {
  ActionComponent,
  ActionContextType,
  ActionKey,
  ActionMaker,
  GOVERNANCE_PROPOSAL_TYPES,
  GovProposalVersion,
  GovernanceProposalActionData,
  TokenType,
  UseDecodedCosmosMsg,
  UseDefaults,
  UseTransformToCosmos,
} from '@dao-dao/types'
import {
  cwMsgToProtobuf,
  decodeGovProposalV1Messages,
  decodePolytoneExecuteMsg,
  getChainAddressForActionOptions,
  getNativeTokenForChainId,
  isDecodedStargateMsg,
  makeStargateMessage,
  maybeMakePolytoneExecuteMessage,
  objectMatchesStructure,
} from '@dao-dao/utils'
import { CommunityPoolSpendProposal } from '@dao-dao/utils/protobuf/codegen/cosmos/distribution/v1beta1/distribution'
import { MsgSubmitProposal as MsgSubmitProposalV1 } from '@dao-dao/utils/protobuf/codegen/cosmos/gov/v1/tx'
import { TextProposal } from '@dao-dao/utils/protobuf/codegen/cosmos/gov/v1beta1/gov'
import { MsgSubmitProposal as MsgSubmitProposalV1Beta1 } from '@dao-dao/utils/protobuf/codegen/cosmos/gov/v1beta1/tx'
import { ParameterChangeProposal } from '@dao-dao/utils/protobuf/codegen/cosmos/params/v1beta1/params'
import { SoftwareUpgradeProposal } from '@dao-dao/utils/protobuf/codegen/cosmos/upgrade/v1beta1/upgrade'
import { Any } from '@dao-dao/utils/protobuf/codegen/google/protobuf/any'

import { GovProposalActionDisplay } from '../../../../components'
import { AddressInput } from '../../../../components/AddressInput'
import { SuspenseLoader } from '../../../../components/SuspenseLoader'
import { TokenAmountDisplay } from '../../../../components/TokenAmountDisplay'
import {
  GovActionsProvider,
  useActionOptions,
  useLoadedActionsAndCategories,
} from '../../../react'
import { GovernanceProposalComponent as StatelessGovernanceProposalComponent } from './Component'

const Component: ActionComponent<undefined, GovernanceProposalActionData> = (
  props
) => {
  const { watch } = useFormContext<GovernanceProposalActionData>()
  const chainId = watch((props.fieldNamePrefix + 'chainId') as 'chainId')
  const options = useActionOptions()

  return (
    <>
      {options.context.type === ActionContextType.Dao && (
        <DaoSupportedChainPickerInput
          disabled={!props.isCreating}
          fieldName={props.fieldNamePrefix + 'chainId'}
          onlyDaoChainIds
        />
      )}

      <ChainProvider chainId={chainId}>
        <SuspenseLoader
          key={
            // Re-render when chain changes.
            chainId
          }
          fallback={<Loader />}
        >
          <GovActionsProvider>
            <InnerComponent {...props} />
          </GovActionsProvider>
        </SuspenseLoader>
      </ChainProvider>
    </>
  )
}

const InnerComponent: ActionComponent<
  undefined,
  GovernanceProposalActionData
> = (props) => {
  const { setValue } = useFormContext<GovernanceProposalActionData>()

  // `GovActionsProvier` wraps this, which sets these values.
  const {
    address: govModuleAddress,
    chain: { chain_id: chainId },
    context,
  } = useActionOptions()

  // Type-check.
  if (context.type !== ActionContextType.Gov) {
    throw new Error('Invalid action context.')
  }

  const supportsV1GovProposals = useRecoilValue(
    chainSupportsV1GovModuleSelector({
      chainId,
    })
  )

  // Update gov module address in data.
  useEffect(() => {
    setValue(
      (props.fieldNamePrefix + 'govModuleAddress') as 'govModuleAddress',
      govModuleAddress
    )
  }, [govModuleAddress, setValue, props.fieldNamePrefix])

  // On chain change, reset deposit.
  useEffect(() => {
    setValue((props.fieldNamePrefix + 'deposit') as 'deposit', [
      {
        denom: context.params.minDeposit[0].denom,
        amount: Number(context.params.minDeposit[0].amount),
      },
    ])
  }, [chainId, setValue, props.fieldNamePrefix, context.params.minDeposit])

  const minDeposits = useCachedLoading(
    waitForAll(
      context.params.minDeposit.map(({ denom }) =>
        genericTokenSelector({
          type: TokenType.Native,
          denomOrAddress: denom,
          chainId,
        })
      )
    ),
    []
  )

  const { categories, loadedActions } = useLoadedActionsAndCategories({
    isCreating: props.isCreating,
  })

  return (
    <StatelessGovernanceProposalComponent
      {...props}
      options={{
        govModuleAddress,
        supportsV1GovProposals,
        minDeposits: minDeposits.loading
          ? { loading: true }
          : {
              loading: false,
              data: minDeposits.data.map((token, index) => ({
                token,
                balance: context.params.minDeposit[index].amount,
              })),
            },
        categories,
        loadedActions,
        TokenAmountDisplay,
        AddressInput,
        SuspenseLoader,
        GovProposalActionDisplay,
      }}
    />
  )
}

const defaultParameterChanges = JSON.stringify(
  [
    {
      subspace: 'INSERT',
      key: 'INSERT',
      value: 'INSERT',
    },
  ],
  null,
  2
)
const defaultPlan = JSON.stringify(
  {
    name: 'INSERT',
    height: 'INSERT',
    info: 'INSERT',
    upgradedClientState: 'INSERT',
  },
  null,
  2
)

const defaultCustom = JSON.stringify(
  {
    type: 'cosmos-sdk/...',
    value: {
      title: '[AUTOMATICALLY INSERTED]',
      description: '[AUTOMATICALLY INSERTED]',
      key1: 'value1',
      key2: 'value2',
    },
  },
  null,
  2
)

export const makeGovernanceProposalAction: ActionMaker<
  GovernanceProposalActionData
> = (options) => {
  const {
    t,
    address,
    chain: { chain_id: currentChainId },
  } = options

  const useDefaults: UseDefaults<GovernanceProposalActionData> = () => {
    const govParams = useCachedLoadingWithError(
      govParamsSelector({
        chainId: currentChainId,
      })
    )

    const supportsV1GovProposals = useCachedLoadingWithError(
      chainSupportsV1GovModuleSelector({
        chainId: currentChainId,
      })
    )

    if (govParams.loading || supportsV1GovProposals.loading) {
      return
    }
    if (govParams.errored) {
      return govParams.error
    }
    if (supportsV1GovProposals.errored) {
      return supportsV1GovProposals.error
    }

    const deposit = govParams.data.minDeposit[0]

    return {
      chainId: currentChainId,
      version: supportsV1GovProposals.data
        ? GovProposalVersion.V1
        : GovProposalVersion.V1_BETA_1,
      title: '',
      description: '',
      deposit: deposit
        ? [
            {
              denom: deposit.denom,
              amount: Number(deposit.amount),
            },
          ]
        : [
            {
              denom: getNativeTokenForChainId(currentChainId).denomOrAddress,
              amount: 0,
            },
          ],
      legacy: {
        typeUrl: TextProposal.typeUrl,
        spends: [],
        spendRecipient: address,
        parameterChanges: defaultParameterChanges,
        upgradePlan: defaultPlan,
        custom: defaultCustom,
      },
      legacyContent: Any.fromPartial({}) as any,
      msgs: [],
      metadataCid: '',
    }
  }

  const useTransformToCosmos: UseTransformToCosmos<
    GovernanceProposalActionData
  > =
    () =>
    ({
      chainId,
      govModuleAddress,
      version,
      title,
      description,
      deposit,
      legacyContent,
      msgs,
      metadataCid,
    }) => {
      if (!govModuleAddress) {
        throw new Error(
          `Could not find gov module address for chain ID ${chainId}.`
        )
      }

      let msg
      if (version === GovProposalVersion.V1_BETA_1) {
        msg = makeStargateMessage({
          stargate: {
            typeUrl: MsgSubmitProposalV1Beta1.typeUrl,
            value: {
              content: legacyContent,
              initialDeposit: deposit.map(({ amount, denom }) => ({
                amount: BigInt(amount).toString(),
                denom,
              })),
              proposer: getChainAddressForActionOptions(options, chainId),
            } as MsgSubmitProposalV1Beta1,
          },
        })
      } else {
        msg = makeStargateMessage({
          stargate: {
            typeUrl: MsgSubmitProposalV1.typeUrl,
            value: {
              messages: msgs.map((msg) =>
                cwMsgToProtobuf(msg, govModuleAddress)
              ),
              initialDeposit: deposit.map(({ amount, denom }) => ({
                amount: BigInt(amount).toString(),
                denom,
              })),
              proposer: getChainAddressForActionOptions(options, chainId),
              metadata: `ipfs://${metadataCid}`,
              title,
              summary: description,
              expedited: false,
            } as MsgSubmitProposalV1,
          },
        })
      }

      return maybeMakePolytoneExecuteMessage(currentChainId, chainId, msg)
    }

  const useDecodedCosmosMsg: UseDecodedCosmosMsg<
    GovernanceProposalActionData
  > = (msg: Record<string, any>) => {
    let chainId = currentChainId
    const decodedPolytone = decodePolytoneExecuteMsg(chainId, msg)
    if (decodedPolytone.match) {
      chainId = decodedPolytone.chainId
      msg = decodedPolytone.msg
    }

    const defaults = useDefaults()
    if (!defaults || defaults instanceof Error) {
      return {
        match: false,
      }
    }

    if (
      !isDecodedStargateMsg(msg) ||
      !objectMatchesStructure(msg.stargate.value, {
        proposer: {},
      })
    ) {
      return {
        match: false,
      }
    }

    if (
      msg.stargate.typeUrl === MsgSubmitProposalV1Beta1.typeUrl &&
      msg.stargate.value.content
    ) {
      const proposal = msg.stargate.value as MsgSubmitProposalV1Beta1
      const type = proposal.content?.typeUrl
      if (
        !proposal.content ||
        !type ||
        !GOVERNANCE_PROPOSAL_TYPES.some(({ typeUrl }) => typeUrl === type)
      ) {
        return {
          match: false,
        }
      }

      // Try to stringify all proposal content for custom field, but ignore
      // failures in case something can't be serialized.
      let customContent = '{}'
      try {
        customContent = JSON.stringify(proposal.content, null, 2)
      } catch {}

      return {
        match: true,
        data: {
          ...defaults,
          chainId,
          version: GovProposalVersion.V1_BETA_1,
          title: proposal.content.title,
          description: proposal.content.description,
          deposit: proposal.initialDeposit.map(({ amount, ...coin }) => ({
            ...coin,
            amount: Number(amount),
          })),
          legacy: {
            typeUrl: type,
            spends:
              proposal.content.typeUrl === CommunityPoolSpendProposal.typeUrl
                ? (proposal.content.amount as Coin[]).map(
                    ({ amount, denom }) => ({
                      amount: Number(amount),
                      denom,
                    })
                  )
                : [],
            spendRecipient:
              proposal.content.typeUrl === CommunityPoolSpendProposal.typeUrl
                ? proposal.content.recipient
                : address,
            parameterChanges:
              proposal.content.typeUrl === ParameterChangeProposal.typeUrl
                ? JSON.stringify(proposal.content.changes, null, 2)
                : defaultParameterChanges,
            upgradePlan:
              proposal.content.typeUrl === SoftwareUpgradeProposal.typeUrl
                ? JSON.stringify(proposal.content.plan, null, 2)
                : defaultPlan,
            custom: customContent,
          },
          legacyContent: proposal.content,
        },
      }
    }

    if (msg.stargate.typeUrl === MsgSubmitProposalV1.typeUrl) {
      const proposal = msg.stargate.value as MsgSubmitProposalV1
      const decodedMessages = decodeGovProposalV1Messages(proposal.messages)

      return {
        match: true,
        data: {
          ...defaults,
          chainId,
          version: GovProposalVersion.V1,
          title: proposal.title,
          description: proposal.summary,
          deposit: proposal.initialDeposit.map(({ amount, ...coin }) => ({
            ...coin,
            amount: Number(amount),
          })),
          msgs: decodedMessages,
          metadataCid: proposal.metadata.replace('ipfs://', ''),
        },
      }
    }

    return {
      match: false,
    }
  }

  return {
    key: ActionKey.GovernanceProposal,
    Icon: RaisedHandEmoji,
    label: t('title.submitGovernanceProposal'),
    description: t('info.submitGovernanceProposalDescription'),
    Component,
    useDefaults,
    useTransformToCosmos,
    useDecodedCosmosMsg,
  }
}
