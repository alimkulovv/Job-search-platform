<template>
  <section class="apply-panel" :aria-labelledby="fieldId('heading')">
    <p class="eyebrow">СЛЕДУЮЩИЙ ШАГ</p>
    <h2 :id="fieldId('heading')">Откликнуться на вакансию</h2>
    <p class="intro">Расскажите о себе и почему вам интересна эта работа.</p>
    <!-- @submit.prevent запускает наш метод без перезагрузки страницы. -->
    <form novalidate :aria-busy="submitting" @submit.prevent="submit">
      <!-- Двоеточие связывает disabled с состоянием отправки из Vuex. -->
      <fieldset :disabled="submitting">
        <div class="form-row">
          <div class="field">
            <label :for="fieldId('name')">Ваше имя *</label>
            <!-- v-model.trim связывает поле с form.name и убирает пробелы по краям. -->
            <input :id="fieldId('name')" v-model.trim="form.name" name="name" type="text" autocomplete="name"
              placeholder="Имя и фамилия" required minlength="2" maxlength="100"
              :aria-invalid="Boolean(errors.name)" :aria-describedby="errors.name ? fieldId('name-error') : undefined"
              @input="clearFeedback('name')" />
            <p v-if="errors.name" :id="fieldId('name-error')" class="field-error">{{ errors.name }}</p>
          </div>
          <div class="field">
            <label :for="fieldId('email')">Email *</label>
            <input :id="fieldId('email')" v-model.trim="form.email" name="email" type="email" autocomplete="email"
              placeholder="you@example.com" required maxlength="254"
              :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? fieldId('email-error') : undefined"
              @input="clearFeedback('email')" />
            <p v-if="errors.email" :id="fieldId('email-error')" class="field-error">{{ errors.email }}</p>
          </div>
        </div>
        <!-- Письмо хранится в form.letter, а ошибки показываются через v-if. -->
        <div class="field letter-field">
          <label :for="fieldId('letter')">Сопроводительное письмо *</label>
          <textarea :id="fieldId('letter')" v-model.trim="form.letter" name="letter" rows="6"
            placeholder="Какие ваши навыки и опыт помогут команде?" required minlength="20" maxlength="5000"
            :aria-invalid="Boolean(errors.letter)"
            :aria-describedby="[fieldId('letter-hint'), errors.letter ? fieldId('letter-error') : ''].filter(Boolean).join(' ')"
            @input="clearFeedback('letter')"></textarea>
          <div :id="fieldId('letter-hint')" class="field-hint"><span>От 20 до 5000 символов</span><span>{{ form.letter.length }} / 5000</span></div>
          <p v-if="errors.letter" :id="fieldId('letter-error')" class="field-error">{{ errors.letter }}</p>
        </div>
        <!-- Кнопка блокирует повторный клик во время отправки и после успеха. -->
        <button class="submit-button" type="submit" :disabled="submitting || success">
          {{ submitting ? 'Отправляем…' : success ? 'Отклик отправлен' : 'Отправить отклик' }}
          <span v-if="!submitting && !success" aria-hidden="true">→</span>
        </button>
      </fieldset>
      <!-- v-if показывает только актуальные ошибки или подтверждение отправки. -->
      <p v-if="hasFieldErrors" class="form-message error-message" role="alert">Проверьте отмеченные поля.</p>
      <p v-if="submitError" class="form-message error-message" role="alert">{{ submitError }}</p>
      <p v-if="success" class="form-message success-message" role="status">
        Отклик успешно отправлен. <RouterLink to="/applications">Посмотреть мои отклики →</RouterLink>
      </p>
    </form>
  </section>
</template>

<script>
export default {
  // Родитель передаёт вакансию в форму через prop job.
  props: {
    job: {
      type: Object,
      required: true
    }
  },
  // Поля, ошибки валидации и успех принадлежат только этой форме.
  data() {
    return {
      form: {
        name: '',
        email: '',
        letter: ''
      },
      errors: {},
      success: false
    }
  },
  // computed получает общие данные Vuex и автоматически обновляет шаблон.
  computed: {
    submitting() {
      return this.$store.state.applications.submitting
    },
    submitError() {
      return this.$store.state.applications.submitError
    },
    user() {
      return this.$store.state.auth.user
    },
    userId() {
      if (!this.user) {
        return undefined
      }
      return this.user.id
    },
    hasFieldErrors() {
      const messages = Object.values(this.errors)
      for (const message of messages) {
        if (message) {
          return true
        }
      }
      return false
    }
  },
  // При смене вакансии или пользователя очищаем старый черновик.
  watch: {
    'job.id'() {
      this.resetForm()
    },
    'user.id'() {
      this.resetForm()
    }
  },
  // При создании формы подставляем имя и email вошедшего пользователя.
  created() {
    this.resetForm()
  },
  // Методы готовят поля, проверяют ввод и запускают отправку.
  methods: {
    fieldId(field) {
      return `apply-${encodeURIComponent(this.job.id)}-${field}`
    },
    // Возвращаем форму в начальное состояние с данными аккаунта.
    resetForm() {
      const nameParts = []
      let email = ''
      if (this.user) {
        if (this.user.firstName) {
          nameParts.push(this.user.firstName)
        }
        if (this.user.lastName) {
          nameParts.push(this.user.lastName)
        }
        email = this.user.email || ''
      }
      this.form = {
        name: nameParts.join(' '),
        email: email,
        letter: ''
      }
      this.errors = {}
      this.success = false
      this.$store.dispatch('applications/clearSubmitError')
    },
    // При редактировании убираем старые сообщения для исправляемого поля.
    clearFeedback(field) {
      this.errors[field] = ''
      this.success = false
      if (this.submitError) {
        this.$store.dispatch('applications/clearSubmitError')
      }
    },
    // Проверяем длину имени, формат email и длину письма до запроса.
    validate() {
      const errors = {}
      if (this.form.name.length < 2 || this.form.name.length > 100) {
        errors.name = 'Введите имя: от 2 до 100 символов.'
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(this.form.email) || this.form.email.length > 254) {
        errors.email = 'Введите корректный email, например name@example.com.'
      }
      if (this.form.letter.length < 20 || this.form.letter.length > 5000) {
        errors.letter = 'Расскажите о себе: от 20 до 5000 символов.'
      }
      this.errors = errors
      return Object.keys(errors).length === 0
    },
    async submit() {
      // Не отправляем форму повторно или с некорректными полями.
      if (this.submitting || this.success) {
        return
      }
      if (!this.validate()) {
        return
      }
      const jobId = this.job.id
      const userId = this.userId
      this.$store.dispatch('applications/clearSubmitError')
      try {
        // Ждём успешного POST из Vuex и только затем показываем подтверждение.
        await this.$store.dispatch('applications/submitApplication', {
          job: this.job,
          name: this.form.name,
          email: this.form.email,
          letter: this.form.letter
        })
        if (this.job.id === jobId && this.userId === userId) {
          this.success = true
        }
      } catch {
        // Ошибка хранится в Vuex; заполненные поля остаются в форме.
      }
    }
  }
}
</script>

<style scoped>
.apply-panel { background: #fff; border: 1px solid #e8e5ef; border-radius: 18px; padding: 28px; }
.eyebrow { color: #7551cc; font-size: 11px; letter-spacing: .13em; font-weight: 800; margin: 0 0 10px; }
h2 { font-size: 23px; color: #24203b; margin: 0 0 9px; }
.intro { color: #777289; font-size: 14px; line-height: 1.6; margin: 0 0 26px; }
fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.field { display: flex; flex-direction: column; min-width: 0; }
.field label { font-size: 13px; font-weight: 600; color: #423c56; margin-bottom: 9px; }
.field input, .field textarea { width: 100%; box-sizing: border-box; margin: 0; padding: 12px 14px; color: #302a43; background: #fcfbfe; border: 1px solid #ded9e8; border-radius: 9px; font: inherit; font-size: 14px; line-height: 1.5; }
.field textarea { resize: vertical; min-height: 150px; }
.field input:focus, .field textarea:focus { outline: 3px solid #eee7ff; border-color: #8761d4; }
.field input[aria-invalid="true"], .field textarea[aria-invalid="true"] { border-color: #c24860; }
.letter-field { margin-top: 22px; }
.field-hint { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 8px; color: #8a849a; font-size: 11px; }
.field-error { color: #b23652; font-size: 12px; line-height: 1.5; margin: 7px 0 0; }
.submit-button { display: flex; align-items: center; gap: 28px; margin-top: 25px; padding: 13px 21px; color: #fff; background: #7952cc; border: 0; border-radius: 9px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.submit-button:hover:not(:disabled) { background: #6841bb; }
.submit-button:focus-visible { outline: 3px solid #c7b4ef; outline-offset: 3px; }
.submit-button:disabled { opacity: .6; cursor: default; }
.form-message { padding: 13px 15px; border-radius: 9px; font-size: 13px; line-height: 1.6; margin: 18px 0 0; overflow-wrap: anywhere; }
.error-message { color: #a02e49; background: #fff1f4; }
.success-message { color: #247354; background: #edf9f3; }
.success-message a { color: inherit; font-weight: 700; }
@media (max-width: 600px) { .apply-panel { padding: 22px 18px; } .form-row { grid-template-columns: 1fr; gap: 20px; } .submit-button { width: 100%; justify-content: center; } }
</style>
