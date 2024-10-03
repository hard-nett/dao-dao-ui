import { createContext, useContext } from 'react'

import {
  IVotingModuleAdapter,
  IVotingModuleAdapterContext,
} from '@dao-dao/types'

// External API

export const VotingModuleAdapterContext =
  createContext<IVotingModuleAdapterContext | null>(null)

export const useVotingModuleAdapterContext =
  (): IVotingModuleAdapterContext => {
    const context = useContext(VotingModuleAdapterContext)

    if (!context) {
      throw new Error(
        'useVotingModuleAdapter can only be used in a descendant of VotingModuleAdapterProvider.'
      )
    }

    return context
  }

export const useVotingModuleAdapterContextIfAvailable = ():
  | IVotingModuleAdapterContext
  | undefined => useContext(VotingModuleAdapterContext) ?? undefined

export const useVotingModuleAdapter = (): IVotingModuleAdapter =>
  useVotingModuleAdapterContext().adapter
