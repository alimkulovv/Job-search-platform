<script setup>
defineProps({ message: String })
const emit = defineEmits(['retry'])
</script>

<template>
  <div class="error">
    <p>{{ message }}</p>
    <button @click="emit('retry')">Повторить</button>
  </div>
</template>