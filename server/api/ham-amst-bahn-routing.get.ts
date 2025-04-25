import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { date } = getQuery(event)

  if (!date) {
    throw createError({ statusCode: 400, statusMessage: 'Missing query parameters' })
  }

  try {
    const response = await fetch("https://int.bahn.de/web/api/angebote/fahrplan", {
      "headers": {
        "accept": "application/json",
        "accept-language": "en",
        "content-type": "application/json; charset=UTF-8",
        "priority": "u=1, i",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-correlation-id": "ed06b515-9c77-447f-8a3b-d51d51b22ded_6339a6fa-3be8-4db2-9c03-14a95c1cdd37",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": `{\"abfahrtsHalt\":\"A=1@O=Hamburg Hbf@X=10006909@Y=53552733@U=80@L=8002549@B=1@p=1742845592@i=U×008001071@\",\"anfrageZeitpunkt\":\"${date}\",\"ankunftsHalt\":\"A=1@O=AMSTERDAM@X=4881700@Y=52361653@U=80@L=8496058@B=1@p=1743636196@\",\"ankunftSuche\":\"ABFAHRT\",\"klasse\":\"KLASSE_2\",\"produktgattungen\":[\"ICE\",\"EC_IC\",\"IR\",\"REGIONAL\",\"SBAHN\",\"BUS\",\"SCHIFF\",\"UBAHN\",\"TRAM\",\"ANRUFPFLICHTIG\"],\"reisende\":[{\"typ\":\"ERWACHSENER\",\"ermaessigungen\":[{\"art\":\"KEINE_ERMAESSIGUNG\",\"klasse\":\"KLASSENLOS\"}],\"alter\":[],\"anzahl\":1}],\"schnelleVerbindungen\":true,\"sitzplatzOnly\":false,\"bikeCarriage\":false,\"reservierungsKontingenteVorhanden\":false,\"nurDeutschlandTicketVerbindungen\":false,\"deutschlandTicketVorhanden\":false}`,
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    });

    if (!response.ok) {
      console.log('Response was not ok:', response)
      throw createError({ statusCode: response.status, statusMessage: response.statusText })
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error) {
    console.error('Error during fetch or response parsing:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error during fetch or response parsing' })
  }
})
