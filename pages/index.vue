<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const tripType = ref('one-way')
const departureDate = ref('')
const returnDate = ref('')
const returnInputType = ref<'date' | 'overnight'>('date')
const overnightStays = ref(1)
const router = useRouter()
const today = new Date().toISOString().split('T')[0]

const outboundResults = useState<any[]>('outboundResults')
const returnResults = useState<any[]>('returnResults')

async function searchRoutes() {
  if (!departureDate.value) {
    alert('Please select a departure date')
    return
  }

  const outbound = await $fetch('/api/trainline/scrape', {
    query: { departure: departureDate.value }
  })

  if ('results' in outbound && outbound.success) {
    outboundResults.value = outbound.results
  } else {
    console.error('Outbound scrape failed:', outbound)
    outboundResults.value = []
  }

  let returnQuery = {}

  if (tripType.value === 'roundtrip') {
    const returnDateToUse = returnInputType.value === 'date'
      ? returnDate.value
      : new Date(new Date(departureDate.value).setDate(new Date(departureDate.value).getDate() + Number(overnightStays.value)))
          .toISOString().split('T')[0]

    const returnRes = await $fetch('/api/trainline/scrape', {
      query: { departure: returnDateToUse }
    })

    if ('results' in returnRes && returnRes.success) {
      returnResults.value = returnRes.results
    } else {
      console.error('Return scrape failed:', returnRes)
      returnResults.value = []
    }

    returnQuery = returnInputType.value === 'date'
      ? { return: returnDate.value }
      : { overnight: overnightStays.value.toString() }
  }

  const query: Record<string, string> = {
    tripType: tripType.value,
    departure: departureDate.value,
    ...returnQuery
  }

  router.push({ path: '/results', query })
}

const returnPreview = computed(() => {
  if (
    tripType.value === 'roundtrip' &&
    returnInputType.value === 'overnight' &&
    departureDate.value &&
    overnightStays.value
  ) {
    const dep = new Date(departureDate.value)
    dep.setDate(dep.getDate() + overnightStays.value)
    return dep.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  return null
})
</script>

<template>
  <div class="min-h-screen grid place-items-center bg-gray-50 px-4 overflow-y-auto">
    <div class="w-full max-w-xl border border-gray-200 rounded-2xl shadow-lg bg-white p-6 space-y-6 my-8">
      <div class="text-center space-y-1">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <span>🚄</span>
          Plan Your Train Journey
        </h2>
        <p class="text-sm text-gray-500">Find the perfect connection between Hamburg & Amsterdam</p>
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium text-gray-600">Trip Type</label>
        <select
          v-model="tripType"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="one-way">One-way</option>
          <option value="roundtrip">Roundtrip</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium text-gray-600">Departure Date</label>
        <input
          type="date"
          v-model="departureDate"
          :min="today"
          class="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div v-if="tripType === 'roundtrip'" class="space-y-4">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-600">Return Mode</label>
          <select
            v-model="returnInputType"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Pick a return date</option>
            <option value="overnight">Stay X nights</option>
          </select>
        </div>

        <div v-if="returnInputType === 'date'" class="space-y-1">
          <label class="block text-sm font-medium text-gray-600">Return Date</label>
          <input
            type="date"
            v-model="returnDate"
            :min="departureDate || today"
            class="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div v-else class="space-y-1">
          <label class="block text-sm font-medium text-gray-600">Nights in Amsterdam</label>
          <input
            type="number"
            min="1"
            v-model="overnightStays"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p v-if="returnPreview" class="text-sm text-gray-500">
            You'll return on: <strong>{{ returnPreview }}</strong>
          </p>
        </div>
      </div>

      <button
        @click="searchRoutes"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition flex items-center justify-center gap-2"
      >
        <span>🔍</span>
        <span>Find Connections</span>
      </button>
    </div>
  </div>
</template>
