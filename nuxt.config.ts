// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      amadeusClientId: process.env.AMADEUS_CLIENT_ID,
      amadeusClientSecret: process.env.AMADEUS_CLIENT_SECRET,
    },
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
})