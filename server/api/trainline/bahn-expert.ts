// /server/api/trainline/bahn-expert.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import puppeteer from 'puppeteer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const departure = typeof query.departure === 'string' ? query.departure : ''
  const from = typeof query.from === 'string' ? query.from : 'Hamburg'
  const to = typeof query.to === 'string' ? query.to : 'Amsterdam'

  if (!departure || !from || !to) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters: departure, from, or to',
    })
  }

  const browser = await puppeteer.launch({ headless: true, timeout: 0 })
const page = await browser.newPage()

await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

await page.goto('https://bahn.expert/routing', { waitUntil: 'domcontentloaded', timeout: 60000 })

  const formattedDate =
    new Date(departure).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' 00:00'

await page.waitForSelector('#routingStartSearch-input', { timeout: 10000 })
await page.waitForSelector('#routingDestinationSearch-input', { timeout: 10000 })
await page.waitForSelector('[data-testid="routingDatePicker"]', { timeout: 10000 })

await page.type('#routingStartSearch-input', from)
await page.type('#routingDestinationSearch-input', to)
await page.type('[data-testid="routingDatePicker"]', formattedDate)

await page.waitForSelector('[data-testid="search"]', { timeout: 10000 })
await page.click('[data-testid="search"]')

await page.waitForSelector('[data-testid^="Route-"]', { timeout: 20000 })

  const results = await page.$$eval('[data-testid^="Route-"]', (routes) =>
    routes.map((route) => {
      const times = route.querySelectorAll('[data-testid="timeToDisplay"]')
      const duration = route.querySelector('span:nth-of-type(3)')?.textContent?.trim()
      const changes = route.querySelector('span:nth-of-type(4)')?.textContent?.trim()
      const trainTypes = route.querySelector('span.css-1skz62b')?.textContent?.trim()

      return {
        departure: times[0]?.textContent,
        arrival: times[1]?.textContent,
        duration,
        changes,
        trainTypes,
      }
    })
  )

  await browser.close()

  return {
    success: true,
    results,
  }
})
