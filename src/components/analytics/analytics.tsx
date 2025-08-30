
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from "react";
import * as gtag from '@/lib/gtag';

export default function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (gtag.GA_TRACKING_ID) {
      const url = pathname + searchParams.toString()
      gtag.pageview(new URL(url, window.location.origin));
    }
  }, [pathname, searchParams]);


  return <></>
}
