<template>
  <button @click="downloadExcel">Download Excel</button>
</template>

<script>
export default {
  methods: {
    async downloadExcel() {
      const url = '/api/stream';
      window.location.href = url; // Trigger download from server-side route
    }
  }
}
</script>