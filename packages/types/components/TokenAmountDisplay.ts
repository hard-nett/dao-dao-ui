import { ComponentPropsWithoutRef } from 'react'

import { HugeDecimal } from '@dao-dao/math'

import { Coin } from '../contracts'
import { LoadingData } from '../misc'

export type TokenAmountDisplayProps = Omit<
  ComponentPropsWithoutRef<'p'>,
  'children'
> & {
  /**
   * The amount to display. If a HugeDecimal instance is passed, it is assumed
   * to be a raw number and will be converted to a human-readable number using
   * the decimals passed. If a number is passed, it must be a human-readable
   * number (with decimals).
   */
  amount: number | HugeDecimal | LoadingData<number | HugeDecimal>
  prefix?: string
  prefixClassName?: string
  suffix?: string
  suffixClassName?: string
  /**
   * Max decimals to display.
   */
  maxDecimals?: number
  /**
   * Min decimals to display.
   */
  minDecimals?: number
  /**
   * Don't show approximation indication (like a tilde).
   */
  hideApprox?: boolean
  /**
   * Add to tooltip if present.
   */
  dateFetched?: Date
  /**
   * Show full amount if true.
   */
  showFullAmount?: boolean
  /**
   * If present, will add a rounded icon to the left.
   */
  iconUrl?: string | null
  /**
   * If defined, apply a class name to the icon.
   */
  iconClassName?: string
  /**
   * Overlay the chain logo over the bottom right corner of the token icon and
   * add a tooltip.
   */
  showChainId?: string
  /**
   * Optionally specify a callback when clicked and make the pointer a cursor.
   */
  onClick?: () => void
  /**
   * Optionally apply a class name to the div wrapper.
   */
  wrapperClassName?: string
} & ( // If not USD estimate, require symbol and decimals, and allow minAmount.
    | {
        symbol: string
        hideSymbol?: never
        /**
         * Full decimal precision of the value.
         */
        decimals: number
        /**
         * Minimum amount to show. If less than this, will add `< ` to the
         * prefix and display this value.
         */
        minAmount?: number
        estimatedUsdValue?: false
      }
    // Alow hiding symbol.
    | {
        symbol?: string
        hideSymbol: boolean
        /**
         * Full decimal precision of the value.
         */
        decimals: number
        /**
         * Minimum amount to show. If less than this, will add `< ` to the
         * prefix and display this value.
         */
        minAmount?: number
        estimatedUsdValue?: false
      }
    // If USD estimate, disallow symbol, decimals, and minAmount.
    | {
        symbol?: never
        hideSymbol?: boolean
        decimals?: never
        minAmount?: never
        estimatedUsdValue: true
      }
  )

export type StatefulTokenAmountDisplayProps = Pick<
  TokenAmountDisplayProps,
  | 'prefix'
  | 'prefixClassName'
  | 'suffix'
  | 'suffixClassName'
  | 'maxDecimals'
  | 'hideApprox'
  | 'showFullAmount'
  | 'iconClassName'
  | 'onClick'
> & {
  coin: Coin
}
