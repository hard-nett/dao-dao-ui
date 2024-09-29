import { ActionComponent, ActionContextType, ActionKey, ButtonLinkProps, ButtonPopupSection, Entity, EntityType, GenericToken, GenericTokenBalanceWithOwner, LoadingData, NewDao, ShitstrapPaymentMode, StatefulEntityDisplayProps, TokenCardLazyInfo } from "@dao-dao/types"
import { ComponentType, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { DepositEmoji } from "../emoji"
import { abbreviateString, convertMicroDenomToDenomWithDecimals } from "@dao-dao/utils"
import { ButtonPopup } from "../popup"
import { Button, ButtonLink } from "../buttons"
import { ExpandCircleDownOutlined } from "@mui/icons-material"
import { useTranslatedTimeDeltaFormatter } from "../../hooks"
import {
    NativeCoinSelector,
    SegmentedControls,
    TokenAmountDisplay,
    TokenInput,
    useChain,
} from '@dao-dao/stateless'
import clsx from "clsx"
import { AssetUnchecked, PossibleShit, ShitstrapInfo } from "@dao-dao/types/contracts/ShitStrap"
import { Tooltip } from "../tooltip"
import { MakeShitstrapPaymentData, MakeShitstrapPaymentOptions } from "@dao-dao/stateful/actions/core/treasury/ManageShitstrap/MakeShitstrapPayment"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { useActionForKey, useActionOptions } from "@dao-dao/stateful/actions"


export type ShitstrapPaymentCardProps = {
    shitstrapInfo: ShitstrapInfo
    owner: string
    ownerEntity: LoadingData<Entity>
    eligibleAssets: PossibleShit[]
    ButtonLink: ComponentType<ButtonLinkProps>
    EntityDisplay: ComponentType<StatefulEntityDisplayProps>
    tokens: GenericTokenBalanceWithOwner[]
    /**
     * Whether or not a wallet is connected.
     */
    isWalletConnected: boolean
    transparentBackground?: boolean
    shitting?: boolean
    onShitstrapPayment?: () => void
    onFlush?: () => void
    onAddToken?: () => void
    onClose?: () => void
}

export const ShitstrapPaymentCard = ({
    tokens, // balance of connected wallet or dao
    shitstrapInfo, // shitstrap info
    onShitstrapPayment,
    onClose,
    shitting,
    isWalletConnected,
    EntityDisplay,
    eligibleAssets,
    ownerEntity,
    ButtonLink,
    transparentBackground,
}: ShitstrapPaymentCardProps) => {

    const { t } = useTranslation()
    const { chain_id: chainId } = useChain()
    const { context } = useActionOptions()
    const [copied, setCopied] = useState(false)
    const [mode, setMode] = useState(ShitstrapPaymentMode.Payment)
    // Debounce clearing copied.
    useEffect(() => {
        const timeout = setTimeout(() => setCopied(false), 2000)
        return () => clearTimeout(timeout)
    }, [copied])

    const ownerIsDao =
        !ownerEntity.loading && ownerEntity.data.type === EntityType.Dao

    // Truncate IBC denominations to prevent overflow.
    if (shitstrapInfo.shit.symbol.toLowerCase().startsWith('ibc')) {
        shitstrapInfo.shit.symbol = abbreviateString(shitstrapInfo.shit.symbol, 3, 2)
    }

    // create form for selecting token and amount 
    const { register, control, watch, setValue, setError, clearErrors } = useFormContext()

    const watchShitmosDenomOrAddress = watch(
        ('payment.' + 'denomOrAddress') as 'denomOrAddress'
    )
    const watchAmount = watch(
        ('payment.' + 'amount') as 'amount'
    )

    const selectedToken = tokens.find(
        ({ token: { denomOrAddress } }) => denomOrAddress === watchShitmosDenomOrAddress
    )

    const selectedDecimals = selectedToken?.token.decimals ?? 0
    const selectedMicroBalance = selectedToken?.balance ?? 0
    const selectedBalance = convertMicroDenomToDenomWithDecimals(
        selectedMicroBalance,
        selectedDecimals
    )

    const insufficientBalanceI18nKey =
        context.type === ActionContextType.Wallet
            ? 'error.insufficientWalletBalance'
            : 'error.cantSpendMoreThanTreasury'


    const configureCreateShitStrapActionDefaults = useActionForKey(
        ActionKey.MakeShitstrapPayment
    )?.useDefaults()



    return (

        <div className="rounded-lg bg-background-tertiary">

            {/* Description */}
            <div className="flex flex-col gap-3 border-t border-border-secondary py-4 px-6">
                <div className="flex flex-row items-start justify-between gap-8">
                    <p className="link-text">
                        {t('info.shitstrapPaymentTitle')}
                    </p>
                </div>
                <p className="link-text">
                    {t('info.shitstrapPaymentDescription')}
                </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-border-secondary py-4 px-6">
                <Tooltip title={"test"}>
                    <p className="caption-text leading-5 text-text-body">
                        Eligible Assets
                    </p>
                </Tooltip>
                <div className="flex flex-row items-start justify-between gap-8">
                    {/* leading-5 to match link-text's line-height. */}
                    {eligibleAssets && eligibleAssets.length > 0 ? (
                        eligibleAssets.map((asset, index) => (
                            <div className={clsx(
                                'b h-8 cursor-pointer grid-cols-2 items-center gap-3 rounded-lg py-2 px-3 transition hover:bg-background-interactive-hover active:bg-background-interactive-pressed',
                                !transparentBackground && 'bg-background-tertiary'
                            )} key={index}>
                                {'native' in asset.token ? (
                                    <TokenAmountDisplay
                                        prefix="ratio: "
                                        suffix={`, for every 1 ${shitstrapInfo.shit.denomOrAddress}`}
                                        amount={convertMicroDenomToDenomWithDecimals(
                                            asset.shit_rate,
                                            0
                                        )}
                                        className="body-text truncate font-mono"
                                        decimals={0}
                                        symbol={asset.token.native}
                                    />
                                ) : 'cw20' in asset.token ? (
                                    <TokenAmountDisplay
                                        amount={convertMicroDenomToDenomWithDecimals(
                                            asset.shit_rate,
                                            // assuming you have a function to get the decimals for a cw20 token
                                            6
                                        )}
                                        className="body-text truncate font-mono"
                                        decimals={6}
                                        symbol={asset.token.cw20}
                                    />
                                ) : null}
                            </div>
                        ))
                    ) : (
                        <p>{t('info.unknown')}</p>
                    )}

                </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-border-secondary py-4 px-6">

                {t(`title.shitstrapAction`)}
                <Tooltip title={"Select the shit action you wish to perform. Only the owner of the shit may flush. You shit, you flush."}>
                    <div className="mt-5 flex w-full flex-col gap-4">
                        <SegmentedControls
                            onSelect={setMode}
                            selected={mode}
                            tabs={[
                                {
                                    label: t('button.shitstrapPaymentMode.payment'),
                                    value: ShitstrapPaymentMode.Payment,
                                },
                                {
                                    label: t('button.shitstrapPaymentMode.flush'),
                                    value: ShitstrapPaymentMode.Flush,
                                },
                            ]}
                        />

                    </div>
                </Tooltip>

                {mode === ShitstrapPaymentMode.Payment ? (
                    <TokenInput
                        allowCustomToken={false}
                        amount={{
                            watch,
                            setValue,
                            register,
                            fieldName: ('payment.' + 'amount') as 'amount',
                            error: undefined,
                            min: 0,
                            max: 999999999999999999,
                            step: convertMicroDenomToDenomWithDecimals(1, 6),
                            validations: [
                                (amount) =>
                                    amount <= selectedBalance ||
                                    t(insufficientBalanceI18nKey, {
                                        amount: selectedBalance.toLocaleString(undefined, {
                                            maximumFractionDigits: selectedDecimals,
                                        }),
                                        tokenSymbol:
                                            selectedToken?.token.symbol ??
                                            t('info.token').toLocaleUpperCase(),
                                    }),
                            ],
                        }}
                        onSelectToken={(token) => {
                            setValue(('payment.' + 'denomOrAddress') as 'denomOrAddress', `${token?.denomOrAddress}`);
                        }}
                        readOnly={shitting}
                        selectedToken={selectedToken?.token}

                        showChainImage
                        tokens={
                            {
                                loading: false,
                                data: tokens.map(({ owner, balance, token }) => ({
                                    ...token,
                                    owner,
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
                            }
                        }
                    />



                ) : null}
                {mode === ShitstrapPaymentMode.Flush ? (<></>
                ) : null}
                {mode === ShitstrapPaymentMode.Refund ? (<></>
                ) : null}
            </div>

            {!ownerEntity.loading && (
                <div className="flex flex-col gap-2 border-t border-border-secondary px-6 py-4">
                    <p className="link-text mb-1">{t('info.previewShitstrapPayment')}</p>

                    <div className="flex flex-row items-center justify-between gap-8">
                        {/* <p className="secondary-text">{t('title.staked')}</p> */}
                        {/* <TokenAmountDisplay
                                    amount={lazyInfo.loading ? { loading: true } : totalStaked}
                                    className="caption-text text-right font-mono text-text-body"
                                    decimals={token.decimals}
                                    symbol={token.symbol}
                                /> */}
                    </div>

                    <div className="flex flex-row items-center justify-between gap-8">
                        {/* <p className="secondary-text">{t('title.stakedTo')}</p> */}

                    </div>

                    <div className="flex flex-row items-center justify-between gap-8">
                        {/* <p className="secondary-text">{t('title.unstakingTokens')}</p>


                        </div>

                        <div className="flex flex-row items-center justify-between gap-8">
                            {/* <p className="secondary-text">{t('info.pendingRewards')}</p> */}
                    </div>

                    {onShitstrapPayment && (
                        <Button
                            center
                            className="mt-2"
                            loading={shitting}
                            onClick={onShitstrapPayment}
                            variant="brand"
                        >
                            {t('button.makeShitStrapPayment')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}