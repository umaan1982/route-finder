export const useAmadeus = () => {
    const authUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token'
    const clientId = useRuntimeConfig().public.amadeusClientId
    const clientSecret = useRuntimeConfig().public.amadeusClientSecret
  
    const getAccessToken = async (): Promise<string> => {
      const response = await $fetch<{ access_token: string }>(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      })
  
      return response.access_token
    }
  
    return { getAccessToken }
  }