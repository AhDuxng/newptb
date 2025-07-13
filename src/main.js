// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import main.css để lấy font chữ và các style global bạn tự định nghĩa
import './assets/main.css'

const app = createApp(App)

app.use(router)

app.mount('#app')