<template>
  <!-- Клик отправляет событие родителю, а .stop останавливает всплытие клика. -->
  <button
    type="button"
    class="favorite-button"
    :class="{ 'is-active': active }"
    :disabled="disabled"
    :aria-pressed="active"
    :aria-label="active ? 'Удалить из избранного' : 'Добавить в избранное'"
    :title="active ? 'Удалить из избранного' : 'Добавить в избранное'"
    @click.stop="$emit('toggle')"
  >
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"
        :fill="active ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<script>
export default {
  // Родитель задаёт, активно ли сердечко и доступна ли кнопка.
  props: {
    active: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  },
  // Объявляем событие, которое родитель слушает через @toggle.
  emits: ['toggle']
}
</script>

<style scoped>
.favorite-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  padding: 10px;
  margin-top: 0;
  background: #f5f3ff;
  color: var(--primary);
  border: 1px solid var(--border);
}
.favorite-button:hover { background: #ede9fe; }
.favorite-button.is-active { color: #be185d; background: #fdf2f8; }
.favorite-button.is-active:hover { background: #fce7f3; }
.favorite-button:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }
</style>
