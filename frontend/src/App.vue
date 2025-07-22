<template>
  <div class="p-4 space-y-4">
    <h1 class="text-xl font-bold">Interval Explorer</h1>

    <input type="file" @change="upload" />

    <div v-if="overview">
      <h3 class="font-semibold mt-4">Zonen Überblick</h3>
      <pre>{{ overview }}</pre>

      <label class="mr-2">Zone:</label>
      <select v-model="zone">
        <option disabled value="">-- wählen --</option>
        <option v-for="z in JSON.parse(overview).zones" :key="z.name" :value="z.name">
          {{ z.name }} ( {{ z.count }} )
        </option>
      </select>
    </div>

    <table v-if="intervals.length" class="text-sm">
      <thead>
        <tr>
          <th>Dauer</th><th>Dist (m)</th><th>Top (km/h)</th><th>Split</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="I in intervals" :key="I.startTs">
          <td>{{ I.duration }}</td><td>{{ Math.round(I.distance) }}</td>
          <td>{{ I.top.toFixed(1) }}</td><td>{{ I.split }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const overview = ref('')
const zone      = ref('')
const intervals = ref<any[]>([])

async function upload (e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const fd = new FormData()
  fd.append('file', f)
  const res = await fetch('http://localhost:3001/api/upload-tcx', { method: 'POST', body: fd })
  overview.value = await res.text()
}

watch(zone, async z => {
  if (!z) { intervals.value = []; return }
  const r = await fetch('http://localhost:3001/api/intervals?zone=' + encodeURIComponent(z))
  intervals.value = await r.json()
})
</script>
