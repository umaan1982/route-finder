<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const tripType = ref('one-way')
const departureDate = ref('')
const returnDate = ref('')
const returnInputType = ref<'date' | 'overnight'>('date')
const overnightStays = ref(1)
const router = useRouter()
const today = new Date().toISOString().slice(0, 16)
const isLoading = ref(false)

const outboundResults = useState<any[]>('outboundResults')
const returnResults = useState<any[]>('returnResults')

function getCacheKey(from: string, to: string, datetime: string) {
  return `${from}-${to}-${normalizeDatetime(datetime)}`;
}

function normalizeDatetime(input: string) {
  if (input.length === 19) return input;
  return input + ":00";
}

function addDaysKeepingLocalTime(datetimeString: string, days: number) {
  const [datePart, timePart] = datetimeString.split('T');
  const date = new Date(datePart + 'T00:00');
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T${timePart}`;
}

async function searchRoutes() {
  if (!departureDate.value) {
    alert('Please select a departure date')
    return
  }

  isLoading.value = true

  try {
    const outboundCacheKey = getCacheKey('ham', 'amst', departureDate.value);
    const cachedOutbound = localStorage.getItem(outboundCacheKey);

    if (cachedOutbound) {
      outboundResults.value = JSON.parse(cachedOutbound);
    } else {
      const outbound = await $fetch('/api/ham-amst-bahn-routing', {
      params: {
        date: normalizeDatetime(departureDate.value),
      }
    });
      outboundResults.value = (outbound as any)?.verbindungen || [];
      localStorage.setItem(outboundCacheKey, JSON.stringify(outboundResults.value));
    }

    let returnDateToUse = ''

    if (tripType.value === 'roundtrip') {
        returnDateToUse =
          returnInputType.value === 'date'
          ? returnDate.value
          : addDaysKeepingLocalTime(departureDate.value, Number(overnightStays.value));

        const returnCacheKey = getCacheKey('amst', 'ham', returnDateToUse);
        const cachedReturn = localStorage.getItem(returnCacheKey);

      if (cachedReturn) {
        returnResults.value = JSON.parse(cachedReturn);
      } else {
        const returnRes = await $fetch('/api/amst-ham-bahn-routing', {
        params: {
        date: normalizeDatetime(returnDateToUse),
      }
      });
        returnResults.value = (returnRes as any)?.verbindungen || [];
        localStorage.setItem(returnCacheKey, JSON.stringify(returnResults.value));
      }
    }
    const query: Record<string, string> = {
      tripType: tripType.value,
      departure: departureDate.value,
      ...(returnDateToUse ? { return: returnDateToUse } : {}),
      ...(returnInputType.value === 'overnight' ? { overnight: overnightStays.value.toString() } : {})
    }

    router.push({ path: '/results', query })
  } catch (error) {
    console.error('Error fetching Bahn data:', error)
    alert('Failed to retrieve train data. Please try again.')
  } finally {
    isLoading.value = false
  }
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
    return dep.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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
          type="datetime-local"
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
            type="datetime-local"
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
        :disabled="isLoading"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-md transition flex items-center justify-center gap-2"
      >
      <span v-if="isLoading" class="animate-spin rounded-full h-5 w-5 border-t-2 border-white border-opacity-75"></span>
      <span v-else>🔍</span>
      <span>{{ isLoading ? 'Searching...' : 'Find Connections' }}</span>
      </button>
    </div>
  </div>
</template>
