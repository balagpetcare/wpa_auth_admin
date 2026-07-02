export interface Permission {
  id: string
  name: string
  key: string
  description?: string
  module?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  createdAt: string
  permissions: { permission: Permission }[] | Permission[]
  isSystem?: boolean
  _count?: {
    users?: number
  }
}
