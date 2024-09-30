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

  type MakePaymentCard = {
    toShit: string,
    amount: string,
  }
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



  const shitstrapPayment = useMakeShitstrapPayment({
    contractAddress: shitstrapContractAddr,
    sender: walletAddress
  })


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
          shitstrapInfo={shitstrapInfo}
          ButtonLink={ButtonLink}
          EntityDisplay={EntityDisplay}
          isWalletConnected={isWalletConnected}
          tokens={tokenBalances.loading ? [] : tokenBalances.data} />
      </FormProvider >
    </>
  )
}