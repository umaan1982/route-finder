<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, computed } from 'vue'

const router = useRouter()
const route = useRoute()
const goBack = () => router.back()

const sortBy = ref('price')
const tripType = ref(route.query.tripType || 'one-way')

const departureDate = ref<string | null>(route.query.departure as string || null)
const returnDate = ref<string | null>(
  tripType.value === 'roundtrip' && 'return' in route.query
    ? (route.query.return as string)
    : null
)

const outboundTrips = ref<any[]>([])
const returnTrips = ref<any[]>([])

const showMoreOutbound = ref(false)
const showMoreReturn = ref(false)

const limitedOutbound = computed(() =>
  showMoreOutbound.value ? sortedOutbound.value : sortedOutbound.value.slice(0, 3)
)

const limitedReturn = computed(() =>
  showMoreReturn.value ? sortedReturn.value : sortedReturn.value.slice(0, 3)
)

onMounted(() => {
  const outboundRaw = localStorage.getItem('train-outbound')
  if (outboundRaw) {
    try {
      outboundTrips.value = JSON.parse(outboundRaw)
    } catch (e) {
      console.error('Failed to parse outbound:', e)
    }
  }

  if (tripType.value === 'roundtrip') {
    const returnRaw = localStorage.getItem('train-return')
    if (returnRaw) {
      try {
        returnTrips.value = JSON.parse(returnRaw)
      } catch (e) {
        console.error('Failed to parse return:', e)
      }
    }
  }
})

function sortTrips(trips: any[]) {
  return [...trips].sort((a, b) => {
    if (sortBy.value === 'price') {
      const priceA = a.angebotsPreis?.betrag ?? Infinity
      const priceB = b.angebotsPreis?.betrag ?? Infinity
      return priceA - priceB
    }
    if (sortBy.value === 'duration') {
      return a.verbindungsDauerInSeconds - b.verbindungsDauerInSeconds
    }
    if (sortBy.value === 'changes') {
      return a.umstiegsAnzahl - b.umstiegsAnzahl
    }
    return 0
  })
}

const sortedOutbound = computed(() => sortTrips(outboundTrips.value))
const sortedReturn = computed(() => sortTrips(returnTrips.value))

function getTrainPath(trip: any) {
  const sections = trip.verbindungsAbschnitte
  if (!sections?.length) return '—'

  const start = sections[0].abfahrtsOrt
  const middle = sections.slice(1).map((s: any) => s.abfahrtsOrt)
  const end = sections.at(-1)?.ankunftsOrt

  return [start, ...middle, end].join(' → ')
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function formatTimeRange(trip: any) {
  const first = trip.verbindungsAbschnitte?.[0]
  const last = trip.verbindungsAbschnitte?.at(-1)
  if (!first || !last) return '--:-- → --:--'

  const dep = first.abfahrtsZeitpunkt?.slice(11, 16)
  const arr = last.ankunftsZeitpunkt?.slice(11, 16)
  return `${dep} → ${arr}`
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
    <div class="w-full max-w-4xl space-y-10 bg-white shadow-lg rounded-2xl p-6 border border-gray-200">
      <!-- Dates Info -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-100 p-4 rounded-lg text-gray-700">
        <div v-if="departureDate" class="flex items-center gap-2">
          <span class="font-semibold text-blue-700">🚉 Departure:</span>
          <span class="text-gray-800">
            {{ new Date(departureDate).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) }}
          </span>
        </div>
        <div v-if="tripType === 'roundtrip' && returnDate" class="flex items-center gap-2 mt-2 sm:mt-0">
          <span class="font-semibold text-green-700">🏠 Return:</span>
          <span class="text-gray-800">
            {{ new Date(returnDate).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) }}
          </span>
        </div>
      </div>
      <!-- Header + Go Back -->
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">🚆 Available Train Routes</h2>
        <button
          @click="goBack"
          class="text-sm text-blue-600 hover:underline"
        >
          ← Go Back
        </button>
      </div>

      <!-- Sort -->
      <div class="flex items-center gap-3">
        <label class="text-sm text-gray-700">Sort by:</label>
        <select v-model="sortBy" class="border px-2 py-1 rounded text-sm">
          <option value="price">Price</option>
          <option value="duration">Duration</option>
          <option value="changes">Changes</option>
        </select>
      </div>

      <!-- Outbound Trips -->
      <div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">Outbound Trip (Hamburg → Amsterdam)</h3>

        <div v-if="sortedOutbound.length === 0" class="text-sm text-red-500">No outbound trips found.</div>

        <div v-else class="space-y-4">
          <div
            v-for="(trip, index) in limitedOutbound"
            :key="'outbound-' + index"
            class="p-4 border rounded-lg bg-gray-50 hover:shadow transition"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold text-gray-800">Option #{{ index + 1 }}</p>
                <p class="text-sm text-gray-600">{{ trip.umstiegsAnzahl }} changes</p>
                <p class="text-xs text-gray-500 mt-1">{{ getTrainPath(trip) }}</p>
              </div>
              <div class="text-right">
                <p class="text-blue-700 font-bold text-lg">
                  €{{ trip.angebotsPreis?.betrag?.toFixed(2) || '—' }}
                </p>
                <p class="text-sm text-gray-600">{{ formatDuration(trip.verbindungsDauerInSeconds || 0) }}</p>
              </div>
            </div>
            <div class="mt-1 text-sm text-gray-500">
              {{ formatTimeRange(trip) }}
            </div>
          </div>
        </div>

        <div v-if="sortedOutbound.length > 3" class="text-center mt-2">
          <button
            @click="showMoreOutbound = !showMoreOutbound"
            class="text-blue-600 text-sm hover:underline"
          >
          {{ showMoreOutbound ? 'Show less' : 'Show more' }}
          </button>
        </div>
      </div>

      <!-- Return Trips -->
      <div v-if="tripType === 'roundtrip'">
        <h3 class="text-xl font-semibold text-gray-800 mt-10 mb-2">Return Trip (Amsterdam → Hamburg)</h3>

        <div v-if="sortedReturn.length === 0" class="text-sm text-red-500">No return trips found.</div>

        <div v-else class="space-y-4">
          <div
            v-for="(trip, index) in limitedReturn"
            :key="'return-' + index"
            class="p-4 border rounded-lg bg-gray-50 hover:shadow transition"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold text-gray-800">Option #{{ index + 1 }}</p>
                <p class="text-sm text-gray-600">{{ trip.umstiegsAnzahl }} changes</p>
                <p class="text-xs text-gray-500 mt-1">{{ getTrainPath(trip) }}</p>
              </div>
              <div class="text-right">
                <p class="text-blue-700 font-bold text-lg">
                  €{{ trip.angebotsPreis?.betrag?.toFixed(2) || '—' }}
                </p>
                <p class="text-sm text-gray-600">{{ formatDuration(trip.verbindungsDauerInSeconds || 0) }}</p>
              </div>
            </div>
            <div class="mt-1 text-sm text-gray-500">
              {{ formatTimeRange(trip) }}
            </div>
          </div>
        </div>

        <div v-if="sortedReturn.length > 3" class="text-center mt-2">
          <button
            @click="showMoreReturn = !showMoreReturn"
            class="text-blue-600 text-sm hover:underline"
          >
          {{ showMoreReturn ? 'Show less' : 'Show more' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>





