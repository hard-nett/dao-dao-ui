import { ActionKey, WidgetRendererProps } from "@dao-dao/types";

import { ButtonLink, useDaoInfoContext, useDaoNavHelpers } from "@dao-dao/stateless";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import { ShitstrapPaymentWidgetData } from "../../types";
import { getDaoProposalSinglePrefill, makeCombineQueryResultsIntoLoadingDataWithError } from "@dao-dao/utils";
import { useMembership } from "../../../../../hooks";
import { TabRenderer as StatelessTabRenderer } from './TabRenderer'
import { Trans } from "react-i18next";
import { ShitstrapPaymentLine, ShitstrapPaymentCard } from "../../../../../components";
import { useActionForKey } from "../../../../../actions";

import { shitStrapFactoryQueries, shitStrapFactoryQueryKeys } from "@dao-dao/state/query/queries/contracts/ShitStrapFactory"
import { cwShitstrapExtraQueries, cwShitstrapFactoriesExtraQuery, } from "@dao-dao/state/query";

export const TabRenderer = ({
  variables: { factories },
}: WidgetRendererProps<ShitstrapPaymentWidgetData>) => {
  const { chainId: defaultChainId, coreAddress } = useDaoInfoContext()
  const { getDaoProposalPath } = useDaoNavHelpers()
  const { isMember = false } = useMembership()

  const queryClient = useQueryClient()
  
  const shitstrapsContractsLoading = useQueries({
    queries: [
      // Factory or factory list depending on version.
      ...(factories
        ? Object.entries(factories).map(([chainId, { address }]) => ({
          chainId,
          address,
        })) : []
      ).map(({ chainId, address }) =>
        cwShitstrapFactoriesExtraQuery.listAllShitstrapContracts(queryClient, {
          chainId,
          address,
        })
      ),
    ],
    combine: makeCombineQueryResultsIntoLoadingDataWithError({
      firstLoad: 'one',
    }),
  })

  // Fetch infos individually so they refresh when data is updated elsewhere.
  const shitstrapInfosLoading = useQueries({
    queries:
      shitstrapsContractsLoading.loading || shitstrapsContractsLoading.errored
        ? []
        : shitstrapsContractsLoading.data.flatMap(({ chainId, contracts }) =>
          contracts.map(({ contract }) =>
            cwShitstrapExtraQueries.info(queryClient, {
              chainId,
              address: contract,
            })
          )
        ),
    combine: makeCombineQueryResultsIntoLoadingDataWithError({
      firstLoad: 'one',
    }),
  })

  const shitAction = useActionForKey(ActionKey.ManageShitstrap)
  const shitActionDefaults = shitAction?.useDefaults()

  return (
    <StatelessTabRenderer
      ButtonLink={ButtonLink}
      Trans={Trans}
      ShitStrapCard={ShitstrapPaymentCard}
      ShitStrapLine={ShitstrapPaymentLine}
      createShitStrapHref={
        shitAction
          ? getDaoProposalPath(coreAddress, 'create', {
            prefill: getDaoProposalSinglePrefill({
              actions: [
                {
                  actionKey: shitAction.key,
                  data: shitActionDefaults,
                },
              ],
            }),
          })
          : undefined
      }
      isMember={isMember}
      shitStrapsLoading={shitstrapInfosLoading}
    />
  )
}