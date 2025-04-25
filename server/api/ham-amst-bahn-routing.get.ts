import { defineEventHandler, getQuery, createError, setResponseHeaders } from 'h3';
import axios from 'axios';
// @ts-ignore
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const cookieJar = new CookieJar();
const client = wrapper(axios.create({ withCredentials: true })); // Enable sending cookies
client.defaults.jar = cookieJar; // Attach the cookie jar separately

export default defineEventHandler(async (event) => {
  const { date } = getQuery(event);

  if (!date) {
    throw createError({ statusCode: 400, statusMessage: 'Missing query parameters' });
  }

  try {
    // Attempt to get initial cookies (optional, but might help)
    // await client.get("https://int.bahn.de/");

    const response = await client.post("https://int.bahn.de/web/api/angebote/fahrplan", {
      abfahrtsHalt: "A=1@O=Hamburg Hbf@X=10006909@Y=53552733@U=80@L=8002549@B=1@p=1742845592@i=U×008001071@",
      anfrageZeitpunkt: `${date}`,
      ankunftsHalt: "A=1@O=AMSTERDAM@X=4881700@Y=52361653@U=80@L=8496058@B=1@p=1743636196@",
      ankunftSuche: "ABFAHRT",
      klasse: "KLASSE_2",
      produktgattungen: ["ICE", "EC_IC", "IR", "REGIONAL", "SBAHN", "BUS", "SCHIFF", "UBAHN", "TRAM", "ANRUFPFLICHTIG"],
      reisende: [{ typ: "ERWACHSENER", ermaessigungen: [{ art: "KEINE_ERMAESSIGUNG", klasse: "KLASSENLOS" }], alter: [], anzahl: 1 }],
      schnelleVerbindungen: true,
      sitzplatzOnly: false,
      bikeCarriage: false,
      reservierungsKontingenteVorhanden: false,
      nurDeutschlandTicketVerbindungen: false,
      deutschlandTicketVorhanden: false
    }, {
      headers: {
        "accept": "application/json",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json; charset=UTF-8",
        "priority": "u=1, i",
        "sec-ch-ua": '"Chromium";v="120", "Google Chrome";v="120", ";Not A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-correlation-id": "ed06b515-9c77-447f-8a3b-d51d51b22ded_6339a6fa-3be8-4db2-9c03-14a95c1cdd37", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.status.toString().startsWith('2')) {
      console.log('Response was not ok:', response.status, response.statusText, response.headers, response.data);
      throw createError({ statusCode: response.status, statusMessage: response.statusText });
    }

    return response.data;
  } catch (error) {
    console.error('Error during fetch or response parsing:', error);
    throw createError({ statusCode: 500, statusMessage: 'Error during fetch or response parsing' });
  }
});