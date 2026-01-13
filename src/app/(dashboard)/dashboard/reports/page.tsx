import { getReportSummary } from '@/actions/reports.actions'
import { getCurrentOrganization } from '@/actions/onboarding.actions'
import { ReportsClient } from './reports-client'

export const metadata = {
  title: 'Reportes | GymGo',
}

export default async function ReportsPage() {
  const [reportResult, orgResult] = await Promise.all([
    getReportSummary('month'),
    getCurrentOrganization(),
  ])

  return (
    <ReportsClient
      initialData={reportResult.data ?? undefined}
      currency={orgResult.data?.currency || 'MXN'}
    />
  )
}
