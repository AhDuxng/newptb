<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import mascotBear from '../assets/mascot-bear.png';
import AnnouncementTable from '@/components/AnnouncementTable.vue'; // MỚI: Import bảng thông báo

const router = useRouter();
const explore = () => router.push('/photobooth');

// --- Logic tạo bong bóng (phiên bản ổn định) ---
const bubbles = ref([]);
const numBubbles = 40; 

onMounted(() => {
  const newBubbles = [];
  for (let i = 0; i < numBubbles; i++) {
    const size = Math.random() * 80 + 20; 
    const left = Math.random() * 100;
    const animationDuration = Math.random() * 15 + 10;
    const animationDelay = Math.random() * 15;

    newBubbles.push({
      id: i,
      style: {
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        animationDuration: `${animationDuration}s`,
        animationDelay: `${animationDelay}s`,
      }
    });
  }
  bubbles.value = newBubbles;
});
</script>

<template>
  <div class="relative w-full">
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <div
        v-for="bubble in bubbles"
        :key="bubble.id"
        class="bubble"
        :style="bubble.style"
      ></div>
    </div>

    <div class="relative z-10 px-6 pt-12 pb-20">
      <div class="max-w-4xl mx-auto text-center">
        
        <div class="mb-0">
          <img :src="mascotBear" alt="Mascot DEMO STUDIO" class="w-48 h-auto mx-auto fade-in-up">
        </div>

        <h2 class="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
          <span class="font-poppins font-black text-sky-600 bg-gradient-to-r from-sky-500 to-sky-600 bg-clip-text text-transparent text-stack-effect">
            DEMO STUDIO
          </span>
        </h2>

        <h3 class="text-2xl md:text-3xl font-semibold text-gray-700 mb-8 fade-in-up" style="animation-delay: 0.2s;">
          Dịch vụ Chụp Ảnh Photobooth Online Sáng Tạo & Miễn Phí
        </h3>

        <p class="text-lg text-gray-600 mb-12 max-w-3xl mx-auto fade-in-up" style="animation-delay: 0.4s;">
          Tại DEMO STUDIO, bạn sẽ trải nghiệm nền tảng photobooth online miễn phí với các mẫu template sáng tạo và frame độc đáo, giúp tạo ra những bức ảnh ấn tượng chỉ trong vài cú nhấp chuột.
        </p>

        <div class="flex justify-center items-center mb-16 fade-in-up" style="animation-delay: 0.6s;">
          <button @click="explore" class="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold rounded-full hover:scale-105 shadow-lg hover:shadow-xl transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Khám phá Photobooth</span>
          </button>
        </div>
      </div>
    </div>
    
    <AnnouncementTable />

  </div>
</template>

<style scoped>
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>