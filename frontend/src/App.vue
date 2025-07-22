<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold">Football Analyzer</h1>
    <input type="file" @change="uploadFile" />
    <pre>{{ analysis }}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const analysis = ref('')
    const uploadFile = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('http://localhost:3001/api/upload-tcx', {
          method: 'POST',
          body: formData
        })
        analysis.value = JSON.stringify(await res.json(), null, 2)
      }
    }
    return { uploadFile, analysis }
  }
})
</script>