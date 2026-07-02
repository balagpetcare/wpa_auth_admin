'use client'

import ApiRequiredState from '@/components/common/ApiRequiredState'

export default function ServiceTokensPage() {
  return (
    <div className="container-fluid py-4">
      <ApiRequiredState
        title="Service Tokens API Required"
        description="This UI is ready, but the backend endpoint for listing and managing service tokens is not available yet."
        requiredEndpoints={[
          'GET /api/v1/admin/service-tokens',
          'POST /api/v1/admin/service-tokens',
          'DELETE /api/v1/admin/service-tokens/:id',
        ]}
        docsPath="docs/missing-admin-api-endpoints.md"
      />
    </div>
  )
}
