import { ButtonLink, useCachedLoadable, useChain, useDaoNavHelpers } from "@dao-dao/stateless";
import { ActionKey, EntityType, ShitstrapPaymentMode, StatefulShitStrapPaymentCardProps, StatefulShitStrapPaymentLineProps, TokenType } from "@dao-dao/types";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAwaitNextBlock, useEntity, useQueryLoadingDataWithError, useWallet } from "../../hooks";
import { cwShitstrapExtraQueries } from "@dao-dao/state/query";
import { getDaoProposalSinglePrefill, loadableToLoadingData, processError } from "@dao-dao/utils";
// import { tokenCardLazyInfoSelector } from "@dao-dao/state/recoil";
import { useMakeShitstrapPayment, } from "../../hooks/contracts/CwShitstrap";
import { useState } from "react";
import toast from "react-hot-toast";

import { ShitstrapPaymentCard as StatelessShitstrapPaymentCard } from "@dao-dao/stateless"
import { EntityDisplay } from "../EntityDisplay";
import { MakeShitstrapPayment } from "../../actions/core/treasury/ManageShitstrap/MakeShitstrapPayment";
import {
  convertDenomToMicroDenomStringWithDecimals,

} from '@dao-dao/utils';
import { AssetUnchecked } from "@dao-dao/types/contracts/ShitStrap";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useTokenBalances } from "../../actions";

export const ShitstrapPaymentCard = ({
  shitstrapInfo: fallbackInfo,
}: StatefulShitStrapPaymentCardProps) => {

  const { t } = useTranslation()
  const { chain_id: chainId } = useChain()
  const { goToDaoProposal } = useDaoNavHelpers()

  const {
    address: walletAddress = '',
    isWalletConnected,
    refreshBalances,
  } = useWallet({
    attemptConnection: true,
  })

  const tokenBalances = useTokenBalances()

  const queryClient = useQueryClient()
  // Use info passed into props as fallback, since it came from the list query;
  // the individual query updates more frequently.
  const freshInfo = useQueryLoadingDataWithError(
    cwShitstrapExtraQueries.info(queryClient, {
      chainId,
      address: fallbackInfo.shitstrapContractAddr,
    })
  )

  const shitstrapInfo =
    freshInfo.loading || freshInfo.errored ? fallbackInfo : freshInfo.data
  const {
    full,
    cutoff,
    chainId: shitChainId,
    shit,
    owner,
    title,
    description,
    eligibleAssets,
    shitstrapContractAddr,
  } = shitstrapInfo

  const { entity: ownerEntity } = useEntity(owner)
  const ownerisDao =
    !ownerEntity.loading && ownerEntity.data.type === EntityType.Dao

  const shitstrapPayment = useMakeShitstrapPayment({
    contractAddress: shitstrapContractAddr,
    sender: walletAddress
  })


  const [makingShitstrapPayment, setMakingShitstrapPayment] = useState(false)
  const [flushingShitstrap, setFlushingShitstrap] = useState(false)


  const onShitstrapPayment = async () => {
    // Should never happen. 
    try {
      if (ownerisDao) {
        setMakingShitstrapPayment(true)
        await goToDaoProposal(ownerEntity.data.address, 'makeShistrapPayment', {
          prefill: getDaoProposalSinglePrefill({
            actions: [
              {
                actionKey: ActionKey.Execute,
                data: {
                  chainId,
                  address: shitstrapContractAddr,
                  message: JSON.stringify(
                    {
                      shistrap: {
                        shit: []
                      },
                    },
                    null,
                    2
                  ),
                  funds: [],
                  cw20: false,
                },
              },
            ],
          }),
        })
      }

    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    } finally {
      setMakingShitstrapPayment(false)
    }
  }
  const [showShitstrapPaymentModal, setShowShitstrapPaymentModal] = useState(false)

  type MakePaymentCard = {
    toShit: string,
    amount: string,
  }

  const form = useForm<MakePaymentCard>({
    defaultValues: {
      toShit: '',
      amount: '',
    },
    mode: 'onChange',
  })


  return (
    // a. add one token select to select to to pay for a shitstrap. only should be one of eligiibleAssets from selected shitstrap
    <>
      <FormProvider{...form}>
        <StatelessShitstrapPaymentCard
          owner={owner}
          ownerEntity={ownerEntity}
          shitstrapInfo={shitstrapInfo}
          eligibleAssets={eligibleAssets}
          ButtonLink={ButtonLink}
          EntityDisplay={EntityDisplay}
          isWalletConnected={isWalletConnected}
          onShitstrapPayment={onShitstrapPayment}
          tokens={tokenBalances.loading ? [] : tokenBalances.data} />
      </FormProvider >
    </>
  )
}