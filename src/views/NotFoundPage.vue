<template>
  <div class="card not-found">
    <h1>404</h1>
    <p>Такой страницы не существует.</p>
    <RouterLink to="/jobs">Вернуться к вакансиям</RouterLink>
  </div>
</template>

<style scoped>
.not-found { max-width: 420px; margin: 60px auto; text-align: center; }
h1 { font-size: 72px; margin: 0; color: var(--primary); }
</style>