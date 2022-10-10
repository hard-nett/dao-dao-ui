// Inspired by https://storybook.js.org/addons/storybook-dark-mode README

import { DecoratorFn } from '@storybook/react'
import { useMemo } from 'react'

import { DaoPageWrapper } from '@dao-dao/common'
import { ContractVersion, DaoInfoSerializable } from '@dao-dao/tstypes'

export const DaoPageWrapperDecorator: DecoratorFn = (Story) => {
  const serializedInfo: DaoInfoSerializable = useMemo(
    () => ({
      coreAddress: 'daoCoreAddress',
      coreVersion: ContractVersion.V0_2_0,
      votingModuleAddress: 'votingModuleAddress',
      votingModuleContractName: 'crates.io:cw20-staked-balance-voting',
      proposalModules: [
        {
          contractName: 'crates.io:cw-govmod-single',
          version: ContractVersion.V0_2_0,
          address: 'proposalModuleAddress',
          prefix: 'A',
          preProposeAddress: 'preProposeModuleAddress',
        },
      ],
      name: 'DAO Name',
      description: 'DAO Description',
      imageUrl: 'https://moonphase.is/image.svg',
      // Random date in the past 12 months.
      created: new Date(
        Date.now() - Math.floor(Math.random() * 12 * 30 * 24 * 60 * 60 * 1000)
      ).toJSON(),
      parentDao: null,
    }),
    []
  )

  return (
    <DaoPageWrapper
      description={serializedInfo.description}
      serializedInfo={serializedInfo}
      title={serializedInfo.name}
    >
      <Story />
    </DaoPageWrapper>
  )
}
