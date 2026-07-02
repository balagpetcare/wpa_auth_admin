export const serviceTokensApi = {
  async listTokens(): Promise<{ success: boolean; items: never[]; isSimulated: boolean }> {
    return {
      success: false,
      items: [],
      isSimulated: false,
    }
  },

  async createToken(): Promise<{ success: boolean; item?: never; tokenSecret?: string; isSimulated: boolean }> {
    return {
      success: false,
      isSimulated: false,
    }
  },

  async revokeToken(): Promise<{ success: boolean; isSimulated: boolean }> {
    return {
      success: false,
      isSimulated: false,
    }
  },
}
