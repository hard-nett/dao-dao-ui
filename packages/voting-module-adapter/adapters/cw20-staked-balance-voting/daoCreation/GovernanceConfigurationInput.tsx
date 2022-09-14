import { Add } from '@mui/icons-material'
import { useWallet } from '@noahsaso/cosmodal'
import clsx from 'clsx'
import cloneDeep from 'lodash.clonedeep'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { constSelector, useRecoilValueLoadable } from 'recoil'

import { Cw20BaseSelectors } from '@dao-dao/state'
import { DaoCreationGovernanceConfigInputProps } from '@dao-dao/tstypes'
import {
  Button,
  ChartDataEntry,
  DaoCreateVotingPowerDistributionBarChart,
  FormattedJSONDisplay,
  ImageSelector,
  InputErrorMessage,
  InputLabel,
  NumberInput,
  SegmentedControls,
  TextInput,
  VOTING_POWER_DISTRIBUTION_COLORS,
} from '@dao-dao/ui'
import {
  CHAIN_BECH32_PREFIX,
  NEW_DAO_CW20_DECIMALS,
  formatPercentOf100,
  isValidContractAddress,
  validateContractAddress,
  validatePercent,
  validatePositive,
  validateRequired,
  validateTokenSymbol,
} from '@dao-dao/utils'

import { Cw20StakedBalanceVotingAdapter } from '../index'
import { DaoCreationConfig, GovernanceTokenType } from '../types'
import { TierCard } from './TierCard'

export const GovernanceConfigurationInput = ({
  data,
  context: {
    form: {
      control,
      formState: { errors },
      register,
      setValue,
      setError,
      clearErrors,
      watch,
    },
  },
}: DaoCreationGovernanceConfigInputProps<DaoCreationConfig>) => {
  const { t } = useTranslation()
  const { address: walletAddress } = useWallet()

  const {
    fields: tierFields,
    append: appendTier,
    remove: removeTier,
  } = useFieldArray({
    control,
    name: 'votingModuleAdapter.data.tiers',
  })

  const addTierRef = useRef<HTMLButtonElement>(null)
  const addTier = useCallback(() => {
    appendTier(
      cloneDeep(
        Cw20StakedBalanceVotingAdapter.daoCreation!.defaultConfig.tiers[0]
      )
    )
    // Scroll button to bottom of screen.
    addTierRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [appendTier])

  // Fill in default first tier info if tiers not yet edited.
  const [loadedPage, setLoadedPage] = useState(false)
  useEffect(() => {
    if (loadedPage) return
    setLoadedPage(true)

    if (
      !(
        data.tiers.length === 1 &&
        data.tiers[0].name === '' &&
        data.tiers[0].members.length === 1 &&
        data.tiers[0].members[0].address === ''
      )
    )
      return

    setValue('votingModuleAdapter.data.tiers.0.name', t('form.defaultTierName'))
    if (walletAddress) {
      setValue(
        'votingModuleAdapter.data.tiers.0.members.0.address',
        walletAddress
      )
    }
  }, [data.tiers, loadedPage, setValue, t, walletAddress])

  //! Validate new governance token.

  const { initialTreasuryPercent, initialSupply } = data.newInfo
  const totalMemberPercent = data.tiers.reduce(
    (acc, { weight }) => acc + weight,
    0
  )
  const govTokenPercentsSumTo100 =
    initialTreasuryPercent + totalMemberPercent === 100

  //! Validate existing governance token.
  const existingGovernanceTokenAddress =
    data.tokenType === GovernanceTokenType.Existing
      ? data.existingGovernanceTokenAddress
      : undefined
  const existingGovernanceTokenInfoLoadable = useRecoilValueLoadable(
    existingGovernanceTokenAddress &&
      isValidContractAddress(
        existingGovernanceTokenAddress,
        CHAIN_BECH32_PREFIX
      )
      ? Cw20BaseSelectors.tokenInfoSelector({
          contractAddress: existingGovernanceTokenAddress,
          params: [],
        })
      : constSelector(undefined)
  )
  useEffect(() => {
    setValue(
      'votingModuleAdapter.data.existingGovernanceTokenInfo',
      existingGovernanceTokenInfoLoadable.state === 'hasValue'
        ? existingGovernanceTokenInfoLoadable.contents
        : undefined
    )

    if (existingGovernanceTokenInfoLoadable.state !== 'hasError') {
      if (errors?.votingModuleAdapter?.data?.existingGovernanceTokenInfo) {
        clearErrors(
          'votingModuleAdapter.data.existingGovernanceTokenInfo._error'
        )
      }
      return
    }

    if (!errors?.votingModuleAdapter?.data?.existingGovernanceTokenInfo) {
      setError('votingModuleAdapter.data.existingGovernanceTokenInfo._error', {
        type: 'manual',
        message: t('error.failedToGetTokenInfo'),
      })
    }
  }, [
    clearErrors,
    errors?.votingModuleAdapter?.data?.existingGovernanceTokenInfo,
    existingGovernanceTokenInfoLoadable,
    setError,
    setValue,
    t,
  ])

  //! Bar chart data

  const barData: ChartDataEntry[] =
    tierFields.length === 1
      ? // Displaying each member of the first tier as separate pie wedges.
        data.tiers[0].members.map(({ address }, memberIndex) => ({
          name: address.trim() || t('form.membersAddress'),
          // Governance token-based DAO tier weights are split amongst members.
          value: data.tiers[0].weight / data.tiers[0].members.length,
          color:
            VOTING_POWER_DISTRIBUTION_COLORS[
              memberIndex % VOTING_POWER_DISTRIBUTION_COLORS.length
            ],
        }))
      : // Displaying entire tier as one pie wedge.
        data.tiers.map(({ name, weight }, tierIndex) => ({
          name: name.trim() || t('title.tierNum', { tier: tierIndex + 1 }),
          // Governance token-based DAO tier weights are split amongst members.
          value: weight,
          color:
            VOTING_POWER_DISTRIBUTION_COLORS[
              tierIndex % VOTING_POWER_DISTRIBUTION_COLORS.length
            ],
        }))

  return (
    <>
      <SegmentedControls
        className="mt-8 mb-4 w-max"
        onSelect={(tokenType) =>
          setValue('votingModuleAdapter.data.tokenType', tokenType)
        }
        selected={data.tokenType}
        tabs={[
          {
            label: t('button.createAToken'),
            value: GovernanceTokenType.New,
          },
          {
            label: t('button.useExistingToken'),
            value: GovernanceTokenType.Existing,
          },
        ]}
      />

      {data.tokenType === GovernanceTokenType.New ? (
        <>
          <div className="mb-10 rounded-lg bg-background-tertiary">
            <div className="flex flex-row p-4 h-14 border-b border-border-base">
              <p className="primary-text text-text-body">
                {t('form.tokenDefinition')}
              </p>
            </div>

            <div className="flex flex-col items-stretch sm:flex-row">
              <div className="flex flex-col items-stretch sm:flex-row">
                <div className="flex flex-col gap-5 items-center py-6 px-10">
                  <InputLabel name={t('form.image')} />
                  <ImageSelector
                    error={errors.votingModuleAdapter?.data?.newInfo?.imageUrl}
                    fieldName="votingModuleAdapter.data.newInfo.imageUrl"
                    register={register}
                    size={40}
                    watch={watch}
                  />
                </div>
                <div className="flex flex-col gap-5 py-6 px-8 border-y sm:border-y-0 sm:border-x border-border-secondary">
                  <InputLabel name={t('form.symbol')} />
                  <div className="flex flex-col">
                    <div className="flex flex-row gap-2 items-center">
                      <p className="flex justify-center items-center text-base rounded-full text-text-tertiary">
                        $
                      </p>
                      <TextInput
                        error={
                          errors.votingModuleAdapter?.data?.newInfo?.symbol
                        }
                        fieldName="votingModuleAdapter.data.newInfo.symbol"
                        placeholder={t('form.governanceTokenSymbolPlaceholder')}
                        register={register}
                        validation={[validateRequired, validateTokenSymbol]}
                      />
                    </div>

                    <InputErrorMessage
                      error={errors.votingModuleAdapter?.data?.newInfo?.symbol}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col grow gap-5 py-6 px-8">
                <InputLabel name={t('form.name')} />
                <div className="flex flex-col">
                  <TextInput
                    error={errors.votingModuleAdapter?.data?.newInfo?.name}
                    fieldName="votingModuleAdapter.data.newInfo.name"
                    placeholder={t('form.governanceTokenNamePlaceholder')}
                    register={register}
                    validation={[validateRequired]}
                  />
                  <InputErrorMessage
                    error={errors.votingModuleAdapter?.data?.newInfo?.name}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-row gap-6 items-center py-7 px-6 border-y border-border-secondary">
              <p className="primary-text text-text-body">
                {t('form.initialSupply')}
              </p>

              <div className="flex flex-col grow">
                <div className="flex flex-row grow gap-2 items-center">
                  <NumberInput
                    className="font-mono leading-5 symbol-small-body-text text-text-secondary"
                    containerClassName="grow"
                    error={
                      errors.votingModuleAdapter?.data?.newInfo?.initialSupply
                    }
                    fieldName="votingModuleAdapter.data.newInfo.initialSupply"
                    ghost
                    register={register}
                    step={1 / 10 ** NEW_DAO_CW20_DECIMALS}
                    validation={[validatePositive, validateRequired]}
                  />
                  <p className="font-mono leading-5 symbol-small-body-text text-text-tertiary">
                    $
                    {data.newInfo.symbol.trim() ||
                      t('info.token').toLocaleUpperCase()}
                  </p>
                </div>

                <InputErrorMessage
                  className="self-end"
                  error={
                    errors.votingModuleAdapter?.data?.newInfo?.initialSupply
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-6 py-7 px-6">
              <div className="flex flex-row gap-6 items-center">
                <p className="primary-text text-text-body">
                  {t('info.treasuryPercent')}
                </p>

                <div className="flex flex-col grow">
                  <div className="flex flex-row grow gap-2 items-center">
                    <NumberInput
                      className="font-mono leading-5 symbol-small-body-text text-text-secondary"
                      containerClassName="grow"
                      error={
                        errors.votingModuleAdapter?.data?.newInfo
                          ?.initialTreasuryPercent
                      }
                      fieldName="votingModuleAdapter.data.newInfo.initialTreasuryPercent"
                      ghost
                      register={register}
                      step={0.0001}
                      validation={[
                        validatePercent,
                        validateRequired,
                        // Error displayed in place of description.
                        () => govTokenPercentsSumTo100,
                      ]}
                    />

                    <p className="font-mono leading-5 symbol-small-body-text text-text-tertiary">
                      %
                    </p>
                  </div>

                  <InputErrorMessage
                    className="self-end"
                    error={
                      errors.votingModuleAdapter?.data?.newInfo?.initialSupply
                    }
                  />
                </div>
              </div>

              <p
                className={clsx(
                  'secondary-text',
                  !govTokenPercentsSumTo100 && 'text-text-interactive-error'
                )}
              >
                {govTokenPercentsSumTo100
                  ? t('info.treasuryBalanceDescription', {
                      numberOfTokensMinted: initialSupply,
                      memberPercent: formatPercentOf100(totalMemberPercent),
                      treasuryPercent: formatPercentOf100(
                        initialTreasuryPercent
                      ),
                    })
                  : t('error.govTokenBalancesDoNotSumTo100', {
                      totalPercent: formatPercentOf100(
                        initialTreasuryPercent + totalMemberPercent
                      ),
                    })}
              </p>
            </div>
          </div>

          <div style={{ height: (tierFields.length + 2) * 50 }}>
            <DaoCreateVotingPowerDistributionBarChart data={barData} />
          </div>

          <div className="flex flex-col gap-4 items-stretch mt-4">
            {tierFields.map(({ id }, idx) => (
              <TierCard
                key={id}
                control={control}
                data={data}
                errors={errors}
                register={register}
                remove={
                  tierFields.length === 1 ? undefined : () => removeTier(idx)
                }
                setValue={setValue}
                showColorDotOnMember={tierFields.length === 1}
                tierIndex={idx}
              />
            ))}

            <div className="flex flex-col">
              <Button
                className="self-start"
                onClick={addTier}
                ref={addTierRef}
                variant="secondary"
              >
                <Add className="!w-6 !h-6 text-icon-primary" />
                <p>{t('button.addTier')}</p>
              </Button>

              <InputErrorMessage
                error={errors.votingModuleAdapter?.data?._tiersError}
              />
            </div>
          </div>
        </>
      ) : data.tokenType === GovernanceTokenType.Existing ? (
        <div className="rounded-lg bg-background-tertiary">
          <div className="flex flex-row p-4 h-14 border-b border-border-base">
            <p className="primary-text text-text-body">
              {t('form.tokenContractAddressTitle')}
            </p>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <TextInput
                className="font-mono symbol-small-body-text text-text-secondary"
                error={
                  errors.votingModuleAdapter?.data
                    ?.existingGovernanceTokenAddress
                }
                fieldName="votingModuleAdapter.data.existingGovernanceTokenAddress"
                ghost
                placeholder={CHAIN_BECH32_PREFIX + '...'}
                register={register}
                validation={[
                  validateContractAddress,
                  validateRequired,
                  () =>
                    existingGovernanceTokenInfoLoadable.state !== 'loading' ||
                    !!data.existingGovernanceTokenInfo ||
                    t('info.verifyingGovernanceToken'),
                ]}
              />
              <InputErrorMessage
                error={
                  errors.votingModuleAdapter?.data
                    ?.existingGovernanceTokenAddress ||
                  errors.votingModuleAdapter?.data?.existingGovernanceTokenInfo
                    ?._error
                }
              />
            </div>

            <FormattedJSONDisplay
              jsonLoadable={existingGovernanceTokenInfoLoadable}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
