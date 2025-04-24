<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'

const router = useRouter()
const route = useRoute()
const goBack = () => router.back()

const tripType = route.query.tripType || 'one-way'
const departure = (route.query.departure as string) || ''
const returnDateFromQuery = route.query.return || ''
const overnight = route.query.overnight || ''
const sortBy = ref('price')

const calculatedReturnDate = overnight ? calculateReturnDate() : returnDateFromQuery

function calculateReturnDate(): string | null {
  if (!departure || !overnight) return null
  const depDate = new Date(departure)
  depDate.setDate(depDate.getDate() + parseInt(overnight as string))
  return depDate.toISOString().split('T')[0]
}

function formatDateWithDay(dateStr: string | null): string {
  if (!dateStr) return 'Not specified'
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const outboundOptions = ref<any[]>([])
const returnOptions = ref<any[]>([])

onMounted(() => {
  const outboundRaw = localStorage.getItem('train-outbound')
  if (outboundRaw) {
    const parsed = JSON.parse(outboundRaw)
    outboundOptions.value = parsed.journeys || []
  }

  const returnRaw = localStorage.getItem('train-return')
  if (returnRaw) {
    const parsed = JSON.parse(returnRaw)
    returnOptions.value = parsed.journeys || []
  }
})

function getPrice(journey: any) {
  return journey?.price?.amount || 0
}

function getDuration(journey: any) {
  return journey?.duration || 0
}

function getChanges(journey: any) {
  return journey?.legs?.length > 0 ? journey.legs.length - 1 : 0
}

// Sorting
const sortedOutbound = computed(() => {
  return [...outboundOptions.value].sort((a, b) => {
    if (sortBy.value === 'price') return getPrice(a) - getPrice(b)
    if (sortBy.value === 'duration') return getDuration(a) - getDuration(b)
    if (sortBy.value === 'changes') return getChanges(a) - getChanges(b)
    return 0
  })
})

const sortedReturn = computed(() => {
  return [...returnOptions.value].sort((a, b) => {
    if (sortBy.value === 'price') return getPrice(a) - getPrice(b)
    if (sortBy.value === 'duration') return getDuration(a) - getDuration(b)
    if (sortBy.value === 'changes') return getChanges(a) - getChanges(b)
    return 0
  })
})

function formatTimeRange(journey: any) {
  const dep = journey.departureDateTime?.slice(11, 16) || '--:--'
  const arr = journey.arrivalDateTime?.slice(11, 16) || '--:--'
  return `${dep} → ${arr}`
}

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h ${m}m`
}
</script>


<template>
  <div class="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
    <div class="w-full max-w-4xl space-y-10 bg-white shadow-lg rounded-2xl p-6 border border-gray-200">

      <!-- Header -->
      <div class="space-y-2">
        <h2 class="text-3xl font-bold text-gray-800">
          🚆 Train Options:
          <span class="text-blue-600">
            {{ tripType === 'roundtrip' ? 'Roundtrip' : 'One-way' }}
          </span>
        </h2>

        <p class="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
          <span>
            <span class="font-medium text-gray-800">Departure:</span>
            <strong>{{ formatDateWithDay(departure as string) }}</strong>
          </span>
          <br v-if="tripType === 'roundtrip'" />
          <span v-if="tripType === 'roundtrip'">
            <span class="font-medium text-gray-800">Return:</span>
            <strong>{{ formatDateWithDay(calculatedReturnDate as string | null) }}</strong>
          </span>
        </p>
      </div>

      <!-- Go Back Button -->
      <div>
        <button
          @click="goBack"
          class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 hover:bg-blue-100 hover:text-blue-700 transition"
        >
          ← Go Back
        </button>
      </div>

      <!-- Sorting -->
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium text-gray-700">Sort by:</label>
        <select
          v-model="sortBy"
          class="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="price">Cheapest</option>
          <option value="duration">Fastest</option>
          <option value="changes">Least changes</option>
        </select>
      </div>

      <!-- Outbound Trip -->
      <div class="space-y-3">
        <h3 class="text-xl font-semibold text-gray-800">Outbound Trip</h3>
        <p class="text-sm text-gray-500">From Hamburg to Amsterdam</p>

        <div class="grid gap-4">
          <div
            v-for="(option, index) in sortedOutbound"
            :key="'outbound-' + index"
            class="p-4 border rounded-xl shadow-sm bg-white hover:shadow-md transition"
          >
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium text-gray-800">Option #{{ index + 1 }}</p>
                <p class="text-sm text-gray-600">
                  {{ option.legs[0]?.transportation?.mode || 'Train' }} |
                  {{ option.legs.length - 1 }} changes
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-blue-700">€{{ getPrice(option) }}</p>
                <p class="text-sm text-gray-600">{{ formatDuration(option.duration) }}</p>
              </div>
            </div>
            <div class="mt-2 text-sm text-gray-500">
              {{ formatTimeRange(option) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Return Trip -->
      <div v-if="tripType === 'roundtrip'" class="space-y-3">
        <h3 class="text-xl font-semibold text-gray-800">Return Trip</h3>
        <p class="text-sm text-gray-500">From Amsterdam to Hamburg</p>

        <div class="grid gap-4">
          <div
            v-for="(option, index) in sortedReturn"
            :key="'return-' + index"
            class="p-4 border rounded-xl shadow-sm bg-white hover:shadow-md transition"
          >
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium text-gray-800">Option #{{ index + 1 }}</p>
                <p class="text-sm text-gray-600">
                  {{ option.legs[0]?.transportation?.mode || 'Train' }} |
                  {{ option.legs.length - 1 }} changes
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-blue-700">€{{ getPrice(option) }}</p>
                <p class="text-sm text-gray-600">{{ formatDuration(option.duration) }}</p>
              </div>
            </div>
            <div class="mt-2 text-sm text-gray-500">
              {{ formatTimeRange(option) }}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

