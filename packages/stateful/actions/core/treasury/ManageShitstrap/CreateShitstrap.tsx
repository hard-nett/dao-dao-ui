import { NullableArrayOfPossibleShit, PossibleShit } from "@dao-dao/types/contracts/ShitStrap"
import { ShitstrapPaymentWidgetData } from "../../../../widgets/widgets/ShitStrap/types"
import { ActionChainContextType, ActionComponent, ActionContextType, ActionKey, AddressInputProps, GenericTokenBalanceWithOwner, StatefulEntityDisplayProps, TokenType } from "@dao-dao/types"
import { ComponentType, useEffect } from "react"
import { Button, ChainProvider, IconButton, InputErrorMessage, InputLabel, NumberInput, StatusCard, TextAreaInput, TextInput, TokenInput } from "@dao-dao/stateless"
import { useTranslation } from "react-i18next"
import { useActionForKey, useActionOptions } from "../../../react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { convertMicroDenomToDenomWithDecimals, getChainAddressForActionOptions, getChainForChainId, getDisplayNameForChainId, convertDenomToMicroDenomStringWithDecimals, getSupportedChainConfig, makeValidateAddress, validateNonNegative, validateRequired } from "@dao-dao/utils"
import { ArrowRightAltRounded, Close, SubdirectoryArrowRightRounded } from "@mui/icons-material"


export type CreateShitstrapData = {
    chainId: string
    cutoff: number
    title: string
    description: string
    denomOrAddress: string
    eligibleAssets: PossibleShit[]
    startDate: string
    ownerMode: 'none' | 'me' | 'other' | 'many'
    owner: string
}

export type BeginShitstrapOptions = {
    // If undefined, no widget is setup, and begin vesting should be disabled.
    widgetData: ShitstrapPaymentWidgetData | undefined
    tokens: GenericTokenBalanceWithOwner[]
    AddressInput: ComponentType<AddressInputProps<CreateShitstrapData>>
    // EntityDisplay: ComponentType<StatefulEntityDisplayProps>
}

export const CreateShitstrap: ActionComponent<BeginShitstrapOptions> = ({
    fieldNamePrefix,
    errors,
    isCreating,
    addAction,
    remove,
    index: actionIndex,
    allActionsWithData,
    options: {
        widgetData,
        tokens,
        AddressInput,
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

    const { control, register, watch, setValue, setError, clearErrors } =
        useFormContext<CreateShitstrapData>()

    // handle multiple eligible assets
    const {
        fields: eligibleAssetFields,
        append: appendEligibleAsset,
        remove: removeEligibleAsset,
    } = useFieldArray({
        control,
        name: (fieldNamePrefix + 'eligibleAssets') as 'eligibleAssets',
    })

    const chainId = watch((fieldNamePrefix + 'chainId') as 'chainId')
    const watchCutoffAmount = watch((fieldNamePrefix + 'cutoff') as 'cutoff')
    const watchShitmosDenomOrAddress = watch(
        (fieldNamePrefix + 'denomOrAddress') as 'denomOrAddress'
    )

    const eligible = watch((fieldNamePrefix + 'eligibleAssets') as 'eligibleAssets')

    const description = watch((fieldNamePrefix + 'description') as 'description')
    const parsedStartDate = Date.parse(
        watch((fieldNamePrefix + 'startDate') as 'startDate')
    )


    const insufficientBalanceI18nKey =
        context.type === ActionContextType.Wallet
            ? 'error.insufficientWalletBalance'
            : 'error.cantSpendMoreThanTreasury'

    const configureCreateShitStrapActionDefaults = useActionForKey(
        ActionKey.CreateShitStrap
    )?.useDefaults()

    const selectedToken = tokens.find(
        ({ token: { denomOrAddress } }) => denomOrAddress === watchShitmosDenomOrAddress
    )

    const selectedDecimals = selectedToken?.token.decimals ?? 0
    const selectedMicroBalance = selectedToken?.balance ?? 0
    const selectedBalance = convertMicroDenomToDenomWithDecimals(
        selectedMicroBalance,
        selectedDecimals
    )
    const selectedSymbol = selectedToken?.token?.symbol ?? t('info.tokens')
    // If widget not set up, don't render anything because begin vesting cannot be
    // used.
    if (!widgetData) {
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
        (action) => action.actionKey === ActionKey.CreateShitStrap
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
            <div className="flex flex-col gap-4">
                {isCreating && !shitstrapManagerExists && configureCreateShitStrapActionDefaults && (
                    <StatusCard
                        className="max-w-lg"
                        content={t('info.shitstrapManagerNeeded', {
                            chain: getDisplayNameForChainId(chainId),
                        })}
                        style="warning"
                    >

                        <Button
                            disabled={crossChainAccountActionExists}
                            onClick={() => {
                                remove()
                                addAction(
                                    {
                                        actionKey: ActionKey.CreateShitStrap,
                                        data: configureCreateShitStrapActionDefaults,
                                    },
                                    actionIndex
                                )
                            }}
                            variant="primary"
                        >
                            {crossChainAccountActionExists
                                ? t('button.shitstrapManagerSetupActionAdded')
                                : t('button.addShitstrapManagerSetupAction')}
                        </Button>
                    </StatusCard>
                )}
                <div className="space-y-2">
                    <InputLabel name={t('form.title')} />
                    <TextInput
                        disabled={!isCreating}
                        error={errors?.title}
                        fieldName={(fieldNamePrefix + 'title') as 'title'}
                        register={register}
                        required
                    />
                    <InputErrorMessage error={errors?.title} />
                </div>

                {(isCreating || !!description) && (
                    <div className="space-y-2">
                        <InputLabel name={t('form.descriptionOptional')} />
                        <TextAreaInput
                            disabled={!isCreating}
                            error={errors?.description}
                            fieldName={(fieldNamePrefix + 'description') as 'description'}
                            register={register}
                        />
                        <InputErrorMessage error={errors?.description} />
                    </div>
                )}
                <div className="space-y-2">
                    <InputLabel name={t('form.tokenToShitstrap')} />
                    <div className="flex min-w-0 flex-col flex-wrap gap-x-3 gap-y-2 sm:flex-row sm:items-stretch">
                        <TokenInput
                            amount={{
                                watch,
                                setValue,
                                register,
                                fieldName: (fieldNamePrefix + 'cutoff') as 'cutoff',
                                error: errors?.amount,
                                min: 0,
                                max: 999999999999999999,
                                step: convertMicroDenomToDenomWithDecimals(1, 6),
                                validations: [],
                            }}
                            onSelectToken={({ chainId, denomOrAddress }) => {
                                setValue((fieldNamePrefix + 'chainId') as 'chainId', chainId)
                                setValue(
                                    (fieldNamePrefix + 'denomOrAddress') as 'denomOrAddress',
                                    denomOrAddress
                                )
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
                        <div className="flex min-w-0 grow flex-row items-stretch gap-2 sm:gap-3">
                            <div className="flex flex-row items-center pl-1 sm:pl-0">
                                <ArrowRightAltRounded className="!hidden !h-6 !w-6 text-text-secondary sm:!block" />
                                <SubdirectoryArrowRightRounded className="!h-4 !w-4 text-text-secondary sm:!hidden" />
                            </div>
                        </div>

                        <AddressInput
                            containerClassName="grow"
                            disabled={!isCreating}
                            error={errors?.recipient}
                            fieldName={(fieldNamePrefix + 'owner') as 'owner'}
                            register={register}
                            validation={[
                                validateRequired,
                                makeValidateAddress(bech32Prefix),
                            ]}
                        />
                    </div>
                </div>
                {(errors?.amount || errors?.denomOrAddress || errors?.recipient) && (
                    <div className="space-y-1">
                        <InputErrorMessage error={errors?.amount} />
                        <InputErrorMessage error={errors?.denomOrAddress} />
                        <InputErrorMessage error={errors?.recipient} />
                    </div>
                )}
            </div>
            {/* Eligible Assets */}
            <div className="flex flex-col gap-3">
                <InputLabel name={t('form.eligibleAssets')} primary />

                {eligibleAssetFields.map(({ id }, index) => {
                    return (
                        <div
                            key={id}
                            className="flex flex-row flex-wrap items-center gap-2"
                        >
                            <div className="flex shrink-0 flex-col gap-1">
                                <div className="flex flex-row items-end justify-between gap-2">
                                    {/* <InputLabel name={'...' + t('form.eligibleAssets')} /> */}
                                </div>
                                <div className="flex flex-row gap-1">
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
                                            step: convertMicroDenomToDenomWithDecimals(1, 6),
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
                                    {isCreating && (
                                        <IconButton
                                            Icon={Close}
                                            className="mt-6"
                                            onClick={() => removeEligibleAsset(index)}
                                            size="sm"
                                            variant="ghost"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )

                })}

                {isCreating && (
                    <Button
                        className="self-start"
                        onClick={() =>
                            appendEligibleAsset({
                            })
                        }
                        variant="secondary"
                    >
                        {t('button.addEligibleAsset')}
                    </Button>
                )}
                <InputErrorMessage error={errors?.eligibleAssets} />
            </div>
        </ChainProvider>
    )
}