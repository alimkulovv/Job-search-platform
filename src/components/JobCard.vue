<template>
  <div class="card">
    <h3>{{ job.title }}</h3>
    <p>{{ job.company }} · {{ job.location }}</p>
    <p>{{ job.type }} · {{ job.salary }} ₸</p>
    <button @click="$emit('open', job.id)">Подробнее</button>
  </div>
</template>

<script>
export default {
  props: { job: Object },
  emits: ['open']
}
</script>