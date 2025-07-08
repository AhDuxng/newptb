<script setup>
import { ref, onMounted } from 'vue';

const announcements = ref([]);
const isLoading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const response = await fetch('/announcements.json');
    if (!response.ok) {
      throw new Error('Không thể tải dữ liệu thông báo');
    }
    announcements.value = await response.json();
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="w-full max-w-4xl mx-auto mt-16 px-6">
    <h2 class="text-3xl font-bold text-center text-sky-800 mb-8 font-poppins">
      Bảng tin
    </h2>
    <div v-if="isLoading" class="text-center text-gray-500">
      Đang tải thông báo...
    </div>
    <div v-else-if="error" class="text-center text-red-500 bg-red-100 p-4 rounded-lg">
      Lỗi: {{ error }}
    </div>
    <div v-else class="space-y-4">
      <div 
        v-for="item in announcements" 
        :key="item.id"
        class="bg-white/70 backdrop-blur-sm border border-sky-100 rounded-xl p-6 shadow-md transition-transform hover:scale-105 hover:shadow-lg"
      >
        <p class="text-sm text-gray-500 mb-1">{{ item.date }}</p>
        <h3 class="text-xl font-semibold text-sky-700 mb-2">{{ item.title }}</h3>
        <p class="text-gray-600">{{ item.content }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* You can add component-specific styles here if needed */
</style>