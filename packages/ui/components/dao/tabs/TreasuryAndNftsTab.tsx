import { Image } from '@mui/icons-material'
import { ComponentType, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LoadingData, NftCardInfo, TokenCardInfo } from '@dao-dao/tstypes'

import { SortFn, useDropdownSorter } from '../../../hooks'
import { Dropdown, DropdownOption } from '../../Dropdown'
import { GridCardContainer } from '../../GridCardContainer'
import { Loader } from '../../Loader'
import { ModalProps } from '../../Modal'
import { NoContent } from '../../NoContent'

export interface TreasuryAndNftsTabProps<
  T extends TokenCardInfo,
  N extends NftCardInfo
> {
  tokens: LoadingData<T[]>
  TokenCard: ComponentType<T>
  nfts: LoadingData<N[]>
  NftCard: ComponentType<N>
  isMember: boolean
  addCollectionHref?: string
  StargazeNftImportModal: ComponentType<Pick<ModalProps, 'onClose'>>
}

export const TreasuryAndNftsTab = <
  T extends TokenCardInfo,
  N extends NftCardInfo
>({
  tokens,
  TokenCard,
  nfts,
  NftCard,
  isMember,
  addCollectionHref,
  StargazeNftImportModal,
}: TreasuryAndNftsTabProps<T, N>) => {
  const [showImportStargazeNftsModal, setShowImportStargazeNftsModal] =
    useState(false)

  const { t } = useTranslation()

  // Sort crowned tokens first.
  const sortedTokens = useMemo(
    () =>
      tokens.loading
        ? []
        : // `sort` mutates, so let's make a copy of the array first.
          // TODO: Figure out why data is undefined sometimes when not loading.
          // Probably useCachedLoadable's fault.
          [...(tokens.data || [])].sort((a, b) =>
            !!a.crown === !!b.crown ? 0 : a.crown ? -1 : 1
          ),
    [tokens]
  )

  const { sortedData: sortedNfts, dropdownProps: sortDropdownProps } =
    useDropdownSorter(nfts.loading ? [] : nfts.data, sortOptions)

  return (
    <>
      <p className="mb-6 text-text-body title-text">{t('title.treasury')}</p>

      <div className="mb-9">
        {tokens.loading || !tokens.data ? (
          <Loader fill={false} />
        ) : tokens.data.length ? (
          <GridCardContainer cardType="short">
            {sortedTokens.map((props, index) => (
              <TokenCard {...props} key={index} />
            ))}
          </GridCardContainer>
        ) : (
          <p className="secondary-text">{t('info.nothingFound')}</p>
        )}
      </div>

      {nfts.loading || nfts.data.length > 0 ? (
        <>
          <div className="flex flex-row justify-between mb-6">
            <p className="title-text">
              {nfts.loading
                ? t('title.nfts')
                : t('title.numNfts', { count: nfts.data.length })}
            </p>

            {!nfts.loading && nfts.data.length > 0 && (
              <div className="flex flex-row gap-6 justify-between items-center">
                <p className="text-text-body primary-text">
                  {t('title.sortBy')}
                </p>

                <Dropdown {...sortDropdownProps} />
              </div>
            )}
          </div>

          {nfts.loading ? (
            <Loader fill={false} />
          ) : (
            <GridCardContainer className="pb-6">
              {sortedNfts.map((props, index) => (
                <NftCard {...(props as N)} key={index} />
              ))}

              {/* TODO: Uncomment when ICS721 is ready. */}
              {/* <NoContent
                Icon={Image}
                body={t('info.depositFromStargazeQuestion')}
                buttonLabel={t('button.deposit')}
                className="justify-center min-h-[20rem]"
                onClick={() => setShowImportStargazeNftsModal(true)}
              /> */}
            </GridCardContainer>
          )}
        </>
      ) : (
        <NoContent
          Icon={Image}
          actionNudge={t('info.areTheyMissingQuestion')}
          body={t('info.noNftsYet')}
          buttonLabel={t('button.addCollection')}
          href={isMember ? addCollectionHref : undefined}
        />
      )}

      {showImportStargazeNftsModal && (
        <StargazeNftImportModal
          onClose={() => setShowImportStargazeNftsModal(false)}
        />
      )}
    </>
  )
}

const sortOptions: DropdownOption<
  SortFn<Pick<NftCardInfo, 'name' | 'floorPrice'>>
>[] = [
  {
    label: 'A → Z',
    value: (a, b) =>
      a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()),
  },
  {
    label: 'Z → A',
    value: (a, b) =>
      b.name.toLocaleLowerCase().localeCompare(a.name.toLocaleLowerCase()),
  },
  {
    label: 'Lowest floor',
    value: (a, b) =>
      !a.floorPrice
        ? 1
        : !b.floorPrice
        ? -1
        : a.floorPrice.amount - b.floorPrice.amount,
  },
  {
    label: 'Highest floor',
    value: (a, b) =>
      !a.floorPrice
        ? 1
        : !b.floorPrice
        ? -1
        : b.floorPrice.amount - a.floorPrice.amount,
  },
]
