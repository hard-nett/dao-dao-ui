import * as React from 'react'
import { SVGProps } from 'react'

const SvgTwitter = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Zm9-16.461Zm-2.003.517A7.315 7.315 0 0 0 21 7.539a6.869 6.869 0 0 1-1.74 1.699c.006.14.01.282.01.424C19.27 14 15.762 19 9.346 19c-1.97 0-3.802-.543-5.346-1.475.273.03.55.046.832.046a7.28 7.28 0 0 0 4.332-1.405c-1.527-.026-2.815-.975-3.259-2.279a3.699 3.699 0 0 0 1.575-.056c-1.595-.302-2.797-1.628-2.797-3.218v-.041a3.64 3.64 0 0 0 1.58.41C5.327 10.394 4.71 9.39 4.71 8.251c0-.602.172-1.166.473-1.65 1.72 1.985 4.29 3.292 7.188 3.429-.06-.24-.09-.491-.09-.748C12.282 7.469 13.844 6 15.77 6c1.003 0 1.91.398 2.546 1.036a7.253 7.253 0 0 0 2.214-.796 3.336 3.336 0 0 1-1.533 1.816Z"
      fill={props.color}
      fillRule="evenodd"
    />
  </svg>
)

export default SvgTwitter
