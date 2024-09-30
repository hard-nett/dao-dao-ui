import { ActionChainContextType, ActionComponent, ActionContextType, ActionKey, AddressInputProps, GenericToken, GenericTokenBalanceWithOwner, LoadingDataWithError, StatefulEntityDisplayProps, TokenType } from "@dao-dao/types"
import { ShitstrapPaymentWidgetData } from "../../../../widgets/widgets/ShitStrap/types"
import { ComponentType } from "react"
import { Button, ChainProvider, IconButton, InputErrorMessage, InputLabel, TokenInput } from "@dao-dao/stateless"
import { useTranslation } from "react-i18next"
import { useActionForKey, useActionOptions } from "../../../react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { PossibleShit, ShitstrapInfo } from "@dao-dao/types/contracts/ShitStrap"
import { convertMicroDenomToDenomWithDecimals, getChainAddressForActionOptions, getChainForChainId, getSupportedChainConfig } from "@dao-dao/utils"
import { Close } from "@mui/icons-material"
import { Options } from "@dao-dao/types/protobuf/codegen/osmosis/accum/v1beta1/accum"
import { useQueryClient } from "@tanstack/react-query"
import { useQueryLoadingDataWithError } from "../../../../hooks"
import { cwShitstrapExtraQueries } from "@dao-dao/state/query"

export type MakeShitstrapPaymentData = {
    chainId: string
    shitToken?: GenericToken
    amount: string
    eligibleAssets: PossibleShit[]
}

export type MakeShitstrapPaymentOptions = {
    shitstrapInfo: ShitstrapInfo,
    widgetData: ShitstrapPaymentWidgetData | undefined
    tokens: GenericTokenBalanceWithOwner[]
    // AddressInput: ComponentType<AddressInputProps<MakeShitstrapPaymentData>>
    // EntityDisplay: ComponentType<StatefulEntityDisplayProps>
}


export const MakeShitstrapPayment: ActionComponent<MakeShitstrapPaymentOptions> = ({
    fieldNamePrefix,
    errors,
    isCreating,
    addAction,
    remove,
    index: actionIndex,
    allActionsWithData,
    options: {
        shitstrapInfo: fallbackInfo,
        widgetData,
        tokens,
        // AddressInput,
        // EntityDisplay,
    },
}) => {
    const { t } = useTranslation()
    const actionOptions = useActionOptions()
    const {
        context,
        chainContext,
        chain: { chain_id: nativeChainId },
    } = actionOptions

    if (chainContext.type !== ActionChainContextType.Supported) {
        throw new Error('Unsupported chain context')
    }

    const queryClient = useQueryClient()
    // Use info passed into props as fallback, since it came from the list query;
    // the individual query updates more frequently.
    const freshInfo = useQueryLoadingDataWithError(
        cwShitstrapExtraQueries.info(queryClient, {
            chainId: nativeChainId,
            address: fallbackInfo.shitstrapContractAddr,
        })
    )
    const shitstrapInfo =
        freshInfo.loading || freshInfo.errored ? fallbackInfo : freshInfo.data


    const { control, register, watch, setValue, setError, clearErrors } =
        useFormContext<MakeShitstrapPaymentData>()

    // set chain id to form 
    const chainId = watch((fieldNamePrefix + 'chainId') as 'chainId')

    // form value of the token selected for the shitstrap
    const watchShitToken = watch(
        (fieldNamePrefix + 'shitToken') as 'shitToken'
    )
    // set token or denom of token to shit
    const amountToShit = watch(
        (fieldNamePrefix + 'amount') as 'amount'
    )

    const selectedToken = watchShitToken
        ? tokens.find(
            ({ token: { denomOrAddress } }) => denomOrAddress === watchShitToken.denomOrAddress
        ) : undefined

    const configureCreateShitStrapActionDefaults = useActionForKey(
        ActionKey.MakeShitstrapPayment
    )?.useDefaults()

    const selectedDecimals = selectedToken?.token.decimals ?? 0
    const selectedMicroBalance = selectedToken?.balance ?? 0
    const selectedBalance = convertMicroDenomToDenomWithDecimals(
        selectedMicroBalance,
        selectedDecimals
    )


    // const selectedSymbol = selectedToken?.token?.symbol ?? t('info.tokens')
    // // If widget not set up, don't render anything because begin vesting cannot be
    // // used.
    if (!widgetData) {
        return null
    }

    if (!shitstrapInfo) {
        return null
    }

    const { bech32_prefix: bech32Prefix } = getChainForChainId(nativeChainId)
    const chainAddressOwner = getChainAddressForActionOptions(
        actionOptions,
        chainId
    )

    const shitstrapManagerExists =
        !!widgetData?.factories?.[chainId]

    const crossChainAccountActionExists = allActionsWithData.some(
        (action) => action.actionKey === ActionKey.MakeShitstrapPayment
    )

    // A DAO can create a shitstrap payment factory on the current chain and any
    // polytone connection that is also a supported chain (since the shitstrap
    // factory+contract only exists on supported chains).
    const possibleChainIds = [
        nativeChainId,
        ...Object.keys(chainContext.config.polytone || {}).filter((chainId) =>
            getSupportedChainConfig(chainId)
        ),
    ]


    return (
        <ChainProvider chainId={chainId}>
            {/* Eligible Assets */}
            <div className="flex flex-col gap-3">
                <InputLabel name={t('form.eligibleAssets')} primary />
                <div
                    // key={id}
                    className="flex flex-row flex-wrap items-center gap-2"
                >
                    <div className="flex shrink-0 flex-col gap-1">
                        <div className="flex flex-row items-end justify-between gap-2">
                            {/* <InputLabel name={'...' + t('form.eligibleAssets')} /> */}
                        </div>

                        <div className="flex flex-row gap-1">

                            {shitstrapInfo?.eligibleAssets.map(({ shit_rate, token }, index,) => (
                                <TokenInput
                                    amount={{
                                        watch,
                                        setValue: (fieldName, value) => {
                                            setValue(fieldName, value);
                                        },
                                        register,
                                        fieldName: (fieldNamePrefix + `eligibleAssets.${index}.shit_rate`) as `eligibleAssets.${number}.shit_rate`,
                                        error: errors?.amount,
                                        min: 0,
                                        max: 999999999999,
                                        step: convertMicroDenomToDenomWithDecimals(1, 0), // selectedDecimals
                                        validations: [],
                                    }}
                                    onSelectToken={({ chainId, denomOrAddress, type }) => {
                                        if (type === TokenType.Native) {
                                            setValue((fieldNamePrefix + 'chainId') as 'chainId', chainId)
                                            setValue(
                                                (fieldNamePrefix + `eligibleAssets.${index}.token`) as `eligibleAssets.${number}.token`,
                                                { native: denomOrAddress }
                                            )
                                        } else if (type === TokenType.Cw20) {
                                            setValue((fieldNamePrefix + 'chainId') as 'chainId', chainId)
                                            setValue(
                                                (fieldNamePrefix + `eligibleAssets.${index}.token`) as `eligibleAssets.${number}.token`,
                                                { cw20: denomOrAddress }
                                            )
                                        }
                                    }}
                                    readOnly={!isCreating}
                                    selectedToken={selectedToken?.token}
                                    showChainImage
                                    tokens={{
                                        loading: false,
                                        data: tokens
                                            .filter(({ token: { chainId } }) =>
                                                possibleChainIds.includes(chainId)
                                            )
                                            .map(({ balance, token }) => ({
                                                ...token,
                                                description:
                                                    t('title.balance') +
                                                    ': ' +
                                                    convertMicroDenomToDenomWithDecimals(
                                                        balance,
                                                        token.decimals
                                                    ).toLocaleString(undefined, {
                                                        maximumFractionDigits: token.decimals,
                                                    }),

                                            })),
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <InputErrorMessage error={errors?.eligibleAssets} />
            </div>
        </ChainProvider>
    )
}