<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import donateQrImage from '@/assets/donate-qr.jpg'; // Import hình ảnh QR

// State để điều khiển việc hiển thị của modal
const isDonateModalVisible = ref(false);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-sky-200 via-sky-100 to-white relative overflow-hidden">
    
    <div class="absolute inset-0 overflow-hidden -z-10">
      <div class="absolute -top-40 -left-40 w-80 h-80 bg-sky-300 rounded-full opacity-20"></div>
      <div class="absolute top-1/4 -right-32 w-64 h-64 bg-sky-400 rounded-full opacity-15"></div>
      <div class="absolute bottom-1/4 -left-20 w-48 h-48 bg-sky-200 rounded-full opacity-25"></div>
      <div class="absolute bottom-0 right-1/4 w-72 h-72 bg-sky-300 rounded-full opacity-10"></div>
    </div>

    <header class="relative z-10 px-6 py-4">
      <nav class="flex justify-between items-center max-w-7xl mx-auto">
        <RouterLink to="/" class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center transition-transform hover:scale-110">
            <span class="text-white font-bold text-lg">S</span>
          </div>
          <h1 class="text-2xl font-bold text-sky-700">SmileUp!</h1>
        </RouterLink>
        <div class="hidden md:flex items-center space-x-8">
          <RouterLink to="/photobooth" class="text-gray-700 hover:text-sky-600 transition-colors duration-300 font-medium text-base">Photobooth</RouterLink>
          
          <button @click="isDonateModalVisible = true" class="text-gray-700 hover:text-sky-600 transition-colors duration-300 font-medium text-base">Ủng hộ</button>
          
          <a href="https://duxng.io.vn/" target="_blank" rel="noopener noreferrer" class="text-gray-700 hover:text-white hover:bg-sky-500 transition-colors duration-300 font-medium text-base border-2 border-sky-500 px-4 py-2 rounded-full">
            Liên hệ & góp ý
          </a>
        </div>
        <button class="md:hidden p-2 rounded-md hover:bg-sky-100">
          <svg class="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </nav>
    </header>
    
    <main>
      <RouterView />
    </main>

    <footer class="relative z-10 px-6 py-8 mt-20 text-center text-gray-600">
      <p>© 2025 SmileUp!. All Rights Reserved.</p>
    </footer>

    <div v-if="isDonateModalVisible" @click="isDonateModalVisible = false" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
        <div @click.stop class="relative bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 scale-95" :class="{ 'scale-100': isDonateModalVisible }">
            <img :src="donateQrImage" alt="QR Code ủng hộ" class="max-w-xs w-full h-auto object-contain">
            <button @click="isDonateModalVisible = false" class="absolute top-2 right-2 p-1 rounded-full bg-gray-200/50 text-gray-600 hover:bg-gray-300/80 hover:text-black transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    </div>

  </div>
</template>

<style scoped>
.router-link-exact-active {
  color: #0284c7; /* text-sky-600 */
  font-weight: 600;
}
</style>