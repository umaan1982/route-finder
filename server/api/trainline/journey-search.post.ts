export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const response = await $fetch('https://www.thetrainline.com/api/journey-search-variant-1/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      ...body,
      passengers: [
        { id: "1", type: "adult" }
      ]
    }
  })

  return response
})