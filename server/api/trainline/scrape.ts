/// <reference lib="dom" />

import puppeteer from 'puppeteer'

export default defineEventHandler(async (event) => {
  const departure = String(getQuery(event).departure)

  if (!departure) {
    return {
      error: true,
      message: 'Missing departure date'
    }
  }
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('https://www.thetrainline.com/', {
      waitUntil: 'networkidle2'
    })

    await page.waitForSelector('[data-testid="jsf-origin"]', { visible: true })
    await page.click('[data-testid="jsf-origin"]', { clickCount: 3 })
    await page.keyboard.type('Hamburg Hbf')
    await new Promise(resolve => setTimeout(resolve, 500))
    await page.keyboard.press('Enter')

    await page.waitForSelector('[data-testid="jsf-destination"]', { visible: true })
    await page.click('[data-testid="jsf-destination"]', { clickCount: 3 })
    await page.keyboard.type('Amsterdam Centraal')
    await new Promise(resolve => setTimeout(resolve, 500))
    await page.keyboard.press('Enter')

    await page.waitForSelector('[data-testid="jsf-outbound-time"]', { visible: true })
    await page.click('[data-testid="jsf-outbound-time"]')
    await new Promise(resolve => setTimeout(resolve, 500))
    await page.keyboard.press('Tab')
    await page.keyboard.type(departure)
    await page.keyboard.press('Enter')

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('[data-testid="jsf-submit"]')
    ])
    
    await page.waitForSelector('[data-testid="outbound-journey-summary"]', { timeout: 15000 })

    const results = await page.evaluate(() => {
      const journeys = Array.from(document.querySelectorAll('[data-testid="outbound-journey-summary"]'))

      return journeys.map(journey => {
        const departure = journey.querySelector('[data-testid="departure-time"]')?.textContent?.trim() || ''
        const arrival = journey.querySelector('[data-testid="arrival-time"]')?.textContent?.trim() || ''
        const duration = journey.querySelector('[data-testid="duration"]')?.textContent?.trim() || ''
        const price = journey.querySelector('[data-testid="fare-button-price"]')?.textContent?.trim() || ''

        return { departure, arrival, duration, price }
      })
    })

    return {
      success: true,
      results
    }
  } catch (error) {
    return {
      error: true,
      message: 'Failed to scrape Trainline',
      details: (error instanceof Error) ? error.message : 'Unknown error'
    }
  } finally {
    await browser.close()
  }
})
