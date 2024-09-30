import { useQueries, useQueryClient } from "@tanstack/react-query"
import { useActionOptions } from "../../../react"
import { CreateShitstrap, CreateShitstrapData } from "./CreateShitstrap"
import { ActionComponent, ActionComponentProps, ActionContextType, ActionKey, ActionMaker, DurationUnits, SegmentedControlsProps, ShitstrapPaymentMode, TokenType, TypedOption, UnifiedCosmosMsg, UseDecodedCosmosMsg, UseDefaults, UseHideFromPicker, UseTransformToCosmos, WidgetId } from "@dao-dao/types"
import { cwShitstrapExtraQueries, cwShitstrapFactoriesExtraQuery, shitStrapFactoryQueries } from "@dao-dao/state/query"
import { convertDenomToMicroDenomWithDecimals, convertMicroDenomToDenomWithDecimals, decodeJsonFromBase64, decodePolytoneExecuteMsg, encodeJsonToBase64, getChainAddressForActionOptions, getDisplayNameForChainId, getNativeTokenForChainId, makeCombineQueryResultsIntoLoadingDataWithError, makeWasmMessage, maybeMakePolytoneExecuteMessage, objectMatchesStructure } from "@dao-dao/utils"
import { useTranslation } from "react-i18next"
import { ComponentType, useCallback } from "react"

import { SuspenseLoader } from "../../../../components"
import { AddressInput, EntityDisplay, Loader, MoneyWingsEmoji, SegmentedControls, useCachedLoadable } from "@dao-dao/stateless"
import { useTokenBalances } from "../../../hooks"
import { useFormContext } from "react-hook-form"
import { useQueryLoadingData } from "../../../../hooks"
import { ShitstrapInfo } from "@dao-dao/types/contracts/ShitStrap"
import { useWidget } from "../../../../widgets"
import { ManageVestingData } from "../ManageVesting"

import { } from "@dao-dao/types/contracts/ShitStrap"
import { InstantiateMsg as ShitstrapInstantiateMsg } from "@dao-dao/types/contracts/ShitStrap"
import { InstantiateNativeShitstrapContractMsg, ExecuteMsg, Uint128 } from "@dao-dao/types/contracts/ShitstrapFactory"
import { coins } from "@cosmjs/amino"
import { genericTokenSelector } from "@dao-dao/state/recoil"
import { constSelector } from "recoil"
import { ShitstrapPaymentWidgetData, } from "../../../../widgets/widgets/ShitStrap/types"
import { MakeShitstrapPayment, MakeShitstrapPaymentData } from "./MakeShitstrapPayment"


export type ManageShitStrapData = {
    mode: ShitstrapPaymentMode
    create: CreateShitstrapData
    payment: MakeShitstrapPaymentData
}

const instantiateStructure = {
    instantiate_msg: {
        cutoff: {},
        shitmos: {},
        accepted: {},
        owner: {},
    },
    label: {},
}

/**
* Get the shitstrap infos owned by the current
* entity executing an action. 
*/
const useShitstrapInfoOwnedByEntity = () => {
    const {
        context,
        address: nativeAddress,
        chain: { chain_id: nativeChainId },
    } = useActionOptions()
    const queryClient = useQueryClient()

    return useQueries({
        queries:
            context.type === ActionContextType.Dao
                ? // Get vesting infos owned by any of the DAO's accounts.
                context.dao.accounts.map(({ chainId, address }) =>
                    cwShitstrapFactoriesExtraQuery.listAllShitstrapContractsByInstantiator(queryClient, {
                        chainId,
                        address,
                        instantiator: address,
                    })
                )
                : [],
        combine: makeCombineQueryResultsIntoLoadingDataWithError({
            transform: (infos) => infos.flat(),
        }),
    })
}

const Component: ComponentType<
    ActionComponentProps<undefined, ManageShitStrapData> & {
        widgetData?: ShitstrapPaymentWidgetData
    }
> = ({ widgetData, ...props }) => {
    const { t } = useTranslation()
    const {
        chain: { chain_id: nativeChainId },
    } = useActionOptions()

    const { setValue, watch, setError, clearErrors, trigger } =
        useFormContext<ManageShitStrapData>()


    const mode = watch((props.fieldNamePrefix + 'mode') as 'mode')
    const selectedChainId =
        mode === 'create'
            ? watch((props.fieldNamePrefix + 'create.chainId') as 'create.chainId')
            : nativeChainId

    const shitstrapInfos = useShitstrapInfoOwnedByEntity()

    const queryClient = useQueryClient()

    const tokenBalances = useTokenBalances()

    const tabs: SegmentedControlsProps<ManageShitStrapData['mode']>['tabs'] = [
        // Only allow beginning a vest if widget is setup.
        ...(widgetData
            ? ([
                {
                    label: t('title.createShitstrap'),
                    value: 'create',
                },
                {
                    label: t('title.makeShitstrapPayment'),
                    value: 'payment',
                },
                {
                    label: t('title.flushShitstrap'),
                    value: 'flush',
                },
                {
                    label: t('title.refundShitstrapOverflow'),
                    value: 'refund',
                },
            ] as TypedOption<ManageShitStrapData['mode']>[])
            : []),

    ]
    const selectedTab = tabs.find((tab) => tab.value === mode)

    return (
        <SuspenseLoader
            fallback={<Loader />}
            forceFallback={
                // Manually trigger loader.
                tokenBalances.loading
            }
        >

            {props.isCreating ? (
                <SegmentedControls<ManageShitStrapData['mode']>
                    className="mb-2"
                    onSelect={(value) =>
                        setValue((props.fieldNamePrefix + 'mode') as 'mode', value)
                    }
                    selected={mode}
                    tabs={tabs}
                />
            ) : (
                <p className="title-text mb-2">{selectedTab?.label}</p>
            )}

            {mode === ShitstrapPaymentMode.Create ? (

                <CreateShitstrap
                    {...props}
                    errors={props.errors?.create}
                    fieldNamePrefix={props.fieldNamePrefix + 'create.'}
                    options={{
                        widgetData,
                        tokens: tokenBalances.loading ? [] : tokenBalances.data,
                        AddressInput,
                        // EntityDisplay,
                    }}
                />

            ) : null}
            {mode === ShitstrapPaymentMode.Payment ? (


            // TODO: select from list of possible shitstrapInfos to make payment for 
                // <MakeShitstrapPayment
                //     {...props}
                //     errors={props.errors?.create}
                //     fieldNamePrefix={props.fieldNamePrefix + 'payment.'}
                //     options={{
                //         shitstrapInfos
                //         widgetData,
                //         tokens: tokenBalances.loading ? [] : tokenBalances.data,
                //         // AddressInput,
                //         // EntityDisplay,
                //     }}
                // />
                <></>
            ) : null}

        </SuspenseLoader>)
}


// Only check if widget exists in DAOs.
const DaoComponent: ActionComponent<undefined, ManageShitStrapData> = (props) => {
    const widgetData = useWidget<ShitstrapPaymentWidgetData>(
        WidgetId.ShitStrap
    )?.daoWidget.values

    return <Component {...props} widgetData={widgetData} />
}

const WalletComponent: ActionComponent<undefined, ManageShitStrapData> = (
    props
) => <Component {...props} />



export const makeManageShitstrapAction: ActionMaker<ManageShitStrapData> = (
    options
) => {
    const {
        t,
        context,
        address: nativeAddress,
        chain: { chain_id: nativeChainId },
    } = options

    // Only available in DAO and wallet contexts.
    if (
        context.type !== ActionContextType.Dao &&
        context.type !== ActionContextType.Wallet
    ) {
        return null
    }

    const makeUseDefaults =
        (hasWidgetData: boolean): UseDefaults<ManageShitStrapData> =>
            () => {
                const {
                    address,
                    chain: { chain_id: chainId },
                } = useActionOptions()

                const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

                return {
                    // Cannot use begin if no widget setup, so default to cancel.
                    mode: hasWidgetData ? ShitstrapPaymentMode.Create : ShitstrapPaymentMode.Flush,
                    create: {
                        chainId,
                        cutoff: 1,
                        denomOrAddress: getNativeTokenForChainId(chainId).denomOrAddress,
                        title: '',
                        description: '',
                        recipient: '',
                        startDate: `${start.toISOString().split('T')[0]} 12:00 AM`,
                        ownerMode: 'me',
                        owner: '',
                        eligibleAssets: [],
                    },
                    flush: {
                        chainId,
                        address: '',
                    },
                    payment: {
                        chainId,
                        address: '',
                        shitToken: undefined,
                        amount: '',
                        eligibleAssets: [],
                    },
                    refund: {
                        chainId,
                        address: '',
                    },
                }
            }

    const makeUseTransformToCosmos = (
        widgetData?: ShitstrapPaymentWidgetData
    ): UseTransformToCosmos<ManageShitStrapData> => {
        // Potential chains and owner addresses that the current entity can create a
        // new vesting contract from.
        const possibleShitstrapSources = widgetData?.factories
            ? Object.entries(widgetData.factories).map(
                ([chainId, { address: factory, version }]) => ({
                    chainId,
                    owner: getChainAddressForActionOptions(options, chainId),
                    factory,
                    version,
                })

                // If the factories are undefined, this DAO is using an old version of
                // the vesting widget which only allows a single factory on the same
                // chain as the DAO. If widget data is undefined, this is being used
                // by a wallet.
            )
            : []

        return () => {
            const loadingTokenBalances = useTokenBalances()
            const queryClient = useQueryClient()

            // Load all shitstrap infos owned by the current entity.
            const loadingShitStrapInfos = useShitstrapInfoOwnedByEntity()
            return useCallback(
                ({ mode, create, }: ManageShitStrapData) => {

                    let chainId: string
                    let cosmosMsg: UnifiedCosmosMsg

                    // Can only begin a shitstrap if there is widget data available.
                    if (mode === 'create' && widgetData) {
                        if (
                            loadingTokenBalances.loading
                        ) {
                            return
                        }

                        const shitstrapSourceIndex = possibleShitstrapSources.findIndex(
                            ({ chainId }) => chainId === create.chainId
                        )
                        if (
                            shitstrapSourceIndex === -1
                            // || possibleShitstrapSources.length !==
                            // nativeUnstakingDurationSecondsLoadable.contents.length
                        ) {
                            throw new Error(
                                t('error.noChainShitstrapManager', {
                                    chain: getDisplayNameForChainId(create.chainId),
                                })
                            )
                        }
                        const shitstrapSource = possibleShitstrapSources[shitstrapSourceIndex]

                        const token = loadingTokenBalances.data.find(
                            ({ token }) => token.denomOrAddress === create.denomOrAddress
                        )?.token
                        if (!token) {
                            throw new Error(`Unknown token: ${create.denomOrAddress}`)
                        }

                        const total = convertDenomToMicroDenomWithDecimals(
                            create.cutoff,
                            token.decimals
                        )

                        const instantiateMsg: ShitstrapInstantiateMsg = {
                            title: create.title,
                            description: create.description,
                            accepted: create.eligibleAssets.map((asset) => ({
                                token: asset.token,
                                shit_rate: BigInt(Number(asset.shit_rate) * Math.pow(10, 6)).toString(),
                            })),
                            cutoff: (BigInt(create.cutoff * Math.pow(10, 6))).toString(),
                            owner: create.owner,
                            shitmos: token.type === TokenType.Native ? {
                                native: token.denomOrAddress,
                            } : {
                                cw20: token.denomOrAddress,
                            }
                        }
                        const msg: InstantiateNativeShitstrapContractMsg = {
                            instantiate_msg: instantiateMsg,
                            label: `shitstrap_owned_by${create.owner}_${Date.now()}`,
                        }
                        if (token.type === TokenType.Native) {
                            chainId = create.chainId
                            cosmosMsg = makeWasmMessage({
                                wasm: {
                                    execute: {
                                        contract_addr: shitstrapSource.factory,
                                        funds: [],
                                        msg: {
                                            create_native_shit_strap_contract: msg,
                                        } as ExecuteMsg,
                                    },
                                },
                            })
                        } else if (token.type === TokenType.Cw20) {
                            chainId = create.chainId
                            // Execute CW20 send message.
                            cosmosMsg = makeWasmMessage({
                                wasm: {
                                    execute: {
                                        contract_addr: token.denomOrAddress,
                                        funds: [],
                                        msg: {
                                            send: {
                                                amount: BigInt(total).toString(),
                                                contract: shitstrapSource.factory,
                                                msg: encodeJsonToBase64({
                                                    instantiate_payroll_contract: msg,
                                                }),
                                            },
                                        },
                                    },
                                },
                            })
                        } else {
                            throw new Error(t('error.unexpectedError'))
                        }
                    } else {
                        throw new Error(t('error.unexpectedError'))
                    }
                    return maybeMakePolytoneExecuteMessage(
                        nativeChainId,
                        chainId,
                        cosmosMsg
                    )
                },
                [
                    loadingTokenBalances,
                    loadingShitStrapInfos,
                ]
            )
        }
    }


    // Only check if widget exists in DAOs.
    const useDefaults: UseDefaults<ManageShitStrapData> =
        context.type === ActionContextType.Dao
            ? () => {
                const widgetData = useWidget<ShitstrapPaymentWidgetData>(
                    WidgetId.ShitStrap
                )?.daoWidget.values
                return makeUseDefaults(!!widgetData)()
            }
            : makeUseDefaults(false)

    // Only check if widget exists in DAOs.
    const useTransformToCosmos =
        context.type === ActionContextType.Dao
            ? () => {
                const widgetData = useWidget<ShitstrapPaymentWidgetData>(
                    WidgetId.ShitStrap
                )?.daoWidget.values
                return makeUseTransformToCosmos(widgetData)()
            }
            : makeUseTransformToCosmos()

    const useDecodedCosmosMsg: UseDecodedCosmosMsg<ManageShitStrapData> = (
        msg: Record<string, any>
    ) => {
        let chainId = nativeChainId
        const decodedPolytone = decodePolytoneExecuteMsg(chainId, msg)
        if (decodedPolytone.match) {
            chainId = decodedPolytone.chainId
            msg = decodedPolytone.msg
        }

        const defaults = useDefaults() as ManageShitStrapData

        const isNativeCreate =
            objectMatchesStructure(msg, {
                wasm: {
                    execute: {
                        contract_addr: {},
                        funds: {},
                        msg: {
                            create_native_shit_strap_contract: instantiateStructure,
                        },
                    },
                },
            }) &&
            msg.wasm.execute.funds.length === 1 &&
            objectMatchesStructure(msg.wasm.execute.funds[0], {
                amount: {},
                denom: {},
            })

        const isCreate = isNativeCreate // || isCw20Begin

        // Defined if the message is a begin vesting message.
        const tokenLoadable = useCachedLoadable(
            isCreate
                ? genericTokenSelector({
                    chainId,
                    type: isNativeCreate ? TokenType.Native : TokenType.Cw20,
                    denomOrAddress: isNativeCreate
                        ? msg.wasm.execute.funds[0].denom
                        : msg.wasm.execute.contract_addr,
                })
                : constSelector(undefined)
        )

        let instantiateMsg: ShitstrapInstantiateMsg | undefined
        if (isCreate) {
            if (isNativeCreate) {
                instantiateMsg =
                    msg.wasm.execute.msg.create_native_shit_strap_contract
                        .instantiate_msg
            }
            // isCw20Begin
            // else {
            //   // Extract instantiate message from cw20 send message.
            //   instantiateMsg = decodeJsonFromBase64(
            //     msg.wasm.execute.msg.send.msg,
            //     true
            //   ).instantiate_payroll_contract?.instantiate_msg as ShitstrapInstantiateMsg
            // }

            if (
                tokenLoadable.state !== 'hasValue'
            ) {
                return { match: false }
            }

            const token = tokenLoadable.contents
            if (isCreate && token && instantiateMsg) {
                const ownerMode = !instantiateMsg.owner
                    ? 'none'
                    : instantiateMsg.owner ===
                        getChainAddressForActionOptions(options, chainId)
                        ? 'me'
                        : 'other'

                return {
                    match: true,
                    data: {
                        ...defaults,
                        mode: ShitstrapPaymentMode.Create,
                        create: {

                            title: defaults.create.title,
                            description: defaults.create.title,
                            startDate: defaults.create.owner,
                            owner: defaults.create.owner,
                            ownerMode,
                            chainId,
                            denomOrAddress: token.denomOrAddress,
                            cutoff: convertMicroDenomToDenomWithDecimals(
                                instantiateMsg.cutoff,
                                token.decimals
                            ),
                            eligibleAssets: instantiateMsg.accepted,
                        },
                    },
                    ownerMode,
                }
            }
        }
        return { match: false }
    }

    // Don't show if shistrap payment widget is not enabled (for DAOs) and this
    // account owns no shitstrap payments.
    const useHideFromPicker: UseHideFromPicker =
        context.type === ActionContextType.Dao
            ? // For a DAO, check if the widget is enabled or if it owns any payments.
            () => {
                const hasWidget = useWidget(WidgetId.ShitStrap)
                const ownedShitstrapPaymentsLoading = useShitstrapInfoOwnedByEntity()
                const ownsShitstrapPayments =
                    !ownedShitstrapPaymentsLoading.loading &&
                    !ownedShitstrapPaymentsLoading.errored &&
                    !!ownedShitstrapPaymentsLoading.data.length

                return !hasWidget && !ownsShitstrapPayments
            }
            : // For a non-DAO, just check if address owns any payments.
            () => {
                const ownedShitstrapPaymentsLoading = useShitstrapInfoOwnedByEntity()
                const ownsShitstrapPayments =
                    !ownedShitstrapPaymentsLoading.loading &&
                    !ownedShitstrapPaymentsLoading.errored &&
                    !!ownedShitstrapPaymentsLoading.data.length

                return !ownsShitstrapPayments
            }


    return {
        key: ActionKey.ManageShitstrap,
        Icon: MoneyWingsEmoji,
        label: t('title.manageShitstrap'),
        description: t('widgetDescription.shitstrap'),
        Component:
            context.type === ActionContextType.Dao ? DaoComponent : WalletComponent,
        useDefaults,
        useTransformToCosmos,
        useDecodedCosmosMsg,
        useHideFromPicker,
    }
}