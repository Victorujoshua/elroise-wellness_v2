'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

export default function ServiceViewTracker({
  serviceName,
  serviceCategory,
  serviceSlug,
}: {
  serviceName: string
  serviceCategory: string
  serviceSlug: string
}) {
  useEffect(() => {
    trackEvent('service_view', {
      service_name: serviceName,
      service_category: serviceCategory,
      service_slug: serviceSlug,
    })
  }, [serviceName, serviceCategory, serviceSlug])

  return null
}
