import { apiClient } from '@/lib/apiClient'
import { Role, Permission } from './types'

// Backend GET /admin/permissions currently returns:
//   { success: true, permissions: { items: Permission[], groupedByResource: Record<string, Permission[]> } }
// (see wpa_auth_api src/modules/admin/admin.service.ts `listPermissions`).
// This normalizer defensively unwraps whatever shape actually comes back
// (bare array, { items }, { permissions: { items } }, or { data }) so the UI
// never calls `.forEach`/`.map` on a non-array and crashes. It also fills in
// a `key` field (the frontend's stable identifier for grouping/labels) from
// the backend's `name` field when `key` isn't present, since backend
// permissions are named using the same `resource:action` / `resource.action`
// convention the UI expects for `key`.
function normalizePermissionsResponse(raw: unknown): Permission[] {
  let list: any[] = []

  if (Array.isArray(raw)) {
    list = raw
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, any>
    if (Array.isArray(obj.items)) {
      list = obj.items
    } else if (obj.permissions && Array.isArray(obj.permissions.items)) {
      list = obj.permissions.items
    } else if (Array.isArray(obj.permissions)) {
      list = obj.permissions
    } else if (Array.isArray(obj.data)) {
      list = obj.data
    }
  }

  if (!Array.isArray(list)) return []

  return list
    .filter((p) => p && typeof p === 'object')
    .map((p) => ({
      id: p.id,
      name: p.name ?? p.key ?? '',
      key: p.key ?? p.name ?? '',
      description: p.description,
      module: p.module ?? p.resource,
    }))
}

export const rolesPermissionsApi = {
  async listRoles(): Promise<{ success: boolean; roles: Role[] }> {
    return apiClient.get('/admin/roles')
  },

  async getRole(roleId: string): Promise<{ success: boolean; role: Role }> {
    return apiClient.get(`/admin/roles/${roleId}`)
  },

  async createRole(data: {
    name: string
    description?: string
    permissionIds?: string[]
    permissionKeys?: string[]
  }): Promise<{ success: boolean; role: Role }> {
    return apiClient.post('/admin/roles', data)
  },

  async updateRole(
    roleId: string,
    data: {
      name?: string
      description?: string
      permissionIds?: string[]
      permissionKeys?: string[]
    }
  ): Promise<{ success: boolean; role: Role }> {
    return apiClient.patch(`/admin/roles/${roleId}`, data)
  },

  async deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/admin/roles/${roleId}`)
  },

  async listPermissions(): Promise<{ success: boolean; permissions: Permission[] }> {
    const res = await apiClient.get<{ success: boolean; permissions: unknown }>('/admin/permissions')
    return {
      success: res.success,
      permissions: normalizePermissionsResponse(res.permissions),
    }
  },

  async addPermissionsToRole(
    roleId: string,
    data: { permissionIds?: string[]; permissionKeys?: string[] }
  ): Promise<{ success: boolean; role: Role }> {
    return apiClient.post(`/admin/roles/${roleId}/permissions`, data)
  },

  async replaceRolePermissions(
    roleId: string,
    data: { permissionIds?: string[]; permissionKeys?: string[] }
  ): Promise<{ success: boolean; role: Role }> {
    return apiClient.patch(`/admin/roles/${roleId}/permissions`, data)
  },

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<{ success: boolean; role: Role }> {
    return apiClient.delete(`/admin/roles/${roleId}/permissions/${permissionId}`)
  },
}
