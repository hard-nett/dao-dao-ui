import { ArrowOutwardRounded } from '@mui/icons-material'
import clsx from 'clsx'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { HugeDecimal } from '@dao-dao/math'
import {
  PopupTriggerCustomComponent,
  ValidatorPickerProps,
} from '@dao-dao/types'
import {
  convertMicroDenomToDenomWithDecimals,
  formatPercentOf100,
} from '@dao-dao/utils'

import { Button } from './buttons'
import { CopyToClipboard } from './CopyToClipboard'
import { IconButtonLink } from './icon_buttons'
import { InputThemedText } from './inputs'
import { FilterableItemPopup } from './popup'
import { TokenAmountDisplay } from './token'
import { Tooltip } from './tooltip'

export const ValidatorPicker = ({
  validators,
  stakes,
  selectedAddress,
  readOnly = false,
  onSelect,
  token,
  displayClassName,
}: ValidatorPickerProps) => {
  const { t } = useTranslation()

  const selectedValidator = validators.find(
    (validator) => validator.address === selectedAddress
  )

  // Map validator address to staked amount.
  const validatorStakedAmountMap = stakes?.reduce(
    (acc, stake) => ({
      ...acc,
      [stake.validator.address]: stake.amount,
    }),
    {} as Record<string, HugeDecimal | undefined>
  )

  // Sort staked first, then by total staked tokens (i.e. voting power and
  // popularity).
  const sortedValidators = [...validators].sort((a, b) => {
    // Get the staked amount for each validator address.
    const aStake = validatorStakedAmountMap?.[a.address]
    const bStake = validatorStakedAmountMap?.[b.address]

    // If both validators have a stake, sort by stake.
    if (aStake && bStake) {
      return bStake.minus(aStake).toNumber()
    }
    // If only one validator has a stake, sort that one first.
    else if (aStake) {
      return -1
    } else if (bStake) {
      return 1
    }

    // If neither validator has a stake, sort by total tokens staked (i.e.
    // popularity).
    return b.tokens - a.tokens
  })

  const TriggerRenderer: PopupTriggerCustomComponent = useCallback(
    ({ open, ...props }) => (
      <div className={clsx('flex', displayClassName)}>
        {selectedAddress ? (
          <InputThemedText className="min-w-0 grow">
            <CopyToClipboard
              label={selectedValidator?.moniker}
              tooltip={t('button.clickToCopyAddress')}
              value={selectedAddress}
            />

            {!readOnly && (
              <Button pressed={open} variant="ghost" {...props}>
                {t('button.change')}
              </Button>
            )}
          </InputThemedText>
        ) : !readOnly ? (
          <Button
            center
            className="grow"
            pressed={open}
            size="lg"
            variant="primary"
            {...props}
          >
            {t('button.selectValidator')}
          </Button>
        ) : null}
      </div>
    ),
    [displayClassName, readOnly, selectedAddress, selectedValidator?.moniker, t]
  )

  return (
    <FilterableItemPopup
      filterableItemKeys={FILTERABLE_KEYS}
      items={sortedValidators.map((validator) => {
        const {
          address,
          moniker,
          details,
          website,
          commission,
          tokens,
          status,
        } = validator

        const existingStake = stakes?.find(
          (stake) => stake.validator.address === address
        )

        return {
          validator,
          key: address,
          label: moniker,
          description: (
            <div className="flex flex-col gap-1">
              <p>
                <span className="font-semibold">{t('title.commission')}:</span>{' '}
                {formatPercentOf100(commission * 100)}
              </p>

              <TokenAmountDisplay
                amount={convertMicroDenomToDenomWithDecimals(
                  tokens,
                  token.decimals
                )}
                className="inline-block"
                decimals={token.decimals}
                prefix={t('title.totalStaked') + ': '}
                prefixClassName="font-semibold"
                symbol={token.symbol}
              />

              {details && <p>{details}</p>}

              {existingStake && (
                <>
                  <div className="mt-1 flex flex-row items-center gap-3">
                    <p className="font-semibold text-text-interactive-valid">
                      {t('title.staked')}:
                    </p>

                    <TokenAmountDisplay
                      amount={convertMicroDenomToDenomWithDecimals(
                        existingStake.amount,
                        existingStake.token.decimals
                      )}
                      decimals={existingStake.token.decimals}
                      iconUrl={existingStake.token.imageUrl}
                      symbol={existingStake.token.symbol}
                    />
                  </div>

                  <div className="flex flex-row items-center gap-3">
                    <p className="font-semibold text-text-interactive-valid">
                      {t('info.pendingRewards')}:
                    </p>

                    <TokenAmountDisplay
                      amount={convertMicroDenomToDenomWithDecimals(
                        existingStake.rewards,
                        existingStake.token.decimals
                      )}
                      decimals={existingStake.token.decimals}
                      iconUrl={existingStake.token.imageUrl}
                      symbol={existingStake.token.symbol}
                    />
                  </div>
                </>
              )}

              {status !== 'BOND_STATUS_BONDED' && (
                <p className="text-xs italic text-text-interactive-error">
                  {t('error.notInActiveSet')}
                </p>
              )}
            </div>
          ),
          searchableDescription: commission + details,
          rightNode: website ? (
            <Tooltip title={website}>
              <IconButtonLink
                Icon={ArrowOutwardRounded}
                href={website}
                onClick={(event) => {
                  // Don't click on item button.
                  event.stopPropagation()
                }}
                variant="ghost"
              />
            </Tooltip>
          ) : undefined,
          selected: address === selectedAddress,
        }
      })}
      onSelect={({ validator }) => onSelect(validator)}
      searchPlaceholder={t('info.searchValidatorsPlaceholder')}
      trigger={{
        type: 'custom',
        Renderer: TriggerRenderer,
      }}
    />
  )
}

const FILTERABLE_KEYS = ['label', 'searchableDescription']
