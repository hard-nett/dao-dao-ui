import { PaidOutlined, PaidRounded } from '@mui/icons-material'

import {
  LATEST_VESTING_CONTRACT_VERSION,
  VestingPaymentsWidgetData,
  Widget,
  WidgetId,
  WidgetLocation,
  WidgetVisibilityContext,
} from '@dao-dao/types'

import { Renderer } from './Renderer'
import { ShitStrapEditor as Editor } from './ShitStrapEditor'
import { ShitstrapPaymentWidgetData } from './types'

export const ShitStrapWidget: Widget<ShitstrapPaymentWidgetData> = {
  id: WidgetId.ShitStrap,
  Icon: PaidOutlined,
  IconFilled: PaidRounded,
  location: WidgetLocation.Tab,
  visibilityContext: WidgetVisibilityContext.Always,
  defaultValues: {
    factories: {},
  },
  Renderer,
  Editor,
}
