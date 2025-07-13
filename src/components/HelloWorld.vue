<template>
  <div class="min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-white relative overflow-hidden">
    <!-- Background decorative elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -left-40 w-80 h-80 bg-pink-300 rounded-full opacity-20 animate-pulse"></div>
      <div class="absolute top-1/4 -right-32 w-64 h-64 bg-pink-400 rounded-full opacity-15 animate-bounce"></div>
      <div class="absolute bottom-1/4 -left-20 w-48 h-48 bg-pink-200 rounded-full opacity-25"></div>
      <div class="absolute bottom-0 right-1/4 w-72 h-72 bg-pink-300 rounded-full opacity-10"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 px-6 py-4">
      <nav class="flex justify-between items-center max-w-7xl mx-auto">
        <div class="flex items-center space-x-2">
          <div class="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center">
            <span class="text-white font-bold text-lg">M</span>
          </div>
          <h1 class="text-2xl font-bold text-pink-600">Mèo Béo Studio</h1>
        </div>
        <div class="hidden md:flex space-x-8">
          <a href="#photobooth" class="text-gray-700 hover:text-pink-600 transition-colors duration-300 font-medium">Photobooth</a>
          <a href="#tarot" class="text-gray-700 hover:text-pink-600 transition-colors duration-300 font-medium">Tarot</a>
          <a href="#cutebooth" class="text-gray-700 hover:text-pink-600 transition-colors duration-300 font-medium">Cutebooth</a>
          <a href="#login" class="text-gray-700 hover:text-pink-600 transition-colors duration-300 font-medium">Đăng nhập</a>
        </div>
        <!-- Mobile menu button -->
        <button class="md:hidden p-2 rounded-md hover:bg-pink-100 transition-colors duration-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </nav>
    </header>

    <!-- Hero Section -->
    <main class="relative z-10 px-6 py-20">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
          Chào mừng bạn đến với 
          <span class="text-pink-600 bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent">
            Mèo Béo Studio
          </span>
        </h2>
        
        <h3 class="text-2xl md:text-3xl font-semibold text-gray-700 mb-8 leading-relaxed">
          Dịch vụ Chụp Ảnh Photobooth Online Miễn Phí & 
          <br class="hidden md:block">
          Xem Tarot Online Hàng Đầu
        </h3>
        
        <p class="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Tại Mèo Béo Studio, bạn sẽ trải nghiệm nền tảng photobooth online miễn phí với các mẫu 
          template sáng tạo và frame độc đáo, giúp tạo ra những bức ảnh ấn tượng. Bên cạnh đó, 
          dịch vụ xem Tarot Online của chúng tôi cũng cấp trải nghiệm tâm linh độc đáo, hỗ trợ bạn 
          khám phá bản thân và định hướng tương lai.
        </p>

        <!-- CTA Button -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button class="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-full hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            <span class="flex items-center space-x-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>Khám phá ngay</span>
            </span>
          </button>
          
          <button class="px-8 py-4 border-2 border-pink-400 text-pink-600 font-semibold rounded-full hover:bg-pink-50 transition-all duration-300 hover:border-pink-500">
            Xem Tarot Online
          </button>
        </div>

        <!-- Features Grid -->
        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100">
            <div class="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-pink-200 transition-colors duration-300">
              <svg class="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <h4 class="text-xl font-semibold text-gray-800 mb-4">Photobooth Miễn Phí</h4>
            <p class="text-gray-600 leading-relaxed">
              Hàng trăm template và frame độc đáo, tạo ra những bức ảnh ấn tượng chỉ trong vài click.
            </p>
          </div>

          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100">
            <div class="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-pink-200 transition-colors duration-300">
              <svg class="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
            <h4 class="text-xl font-semibold text-gray-800 mb-4">Tarot Online</h4>
            <p class="text-gray-600 leading-relaxed">
              Khám phá tương lai và bản thân qua những lá bài tarot mystical với độ chính xác cao.
            </p>
          </div>

          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100">
            <div class="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-pink-200 transition-colors duration-300">
              <svg class="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <h4 class="text-xl font-semibold text-gray-800 mb-4">Cutebooth</h4>
            <p class="text-gray-600 leading-relaxed">
              Thêm những hiệu ứng đáng yêu và sticker cute vào ảnh của bạn, tạo nên phong cách riêng.
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 px-6 py-8 mt-20">
      <div class="max-w-7xl mx-auto text-center">
        <div class="flex justify-center space-x-6 mb-6">
          <a href="#" class="text-gray-600 hover:text-pink-600 transition-colors duration-300">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
          </a>
          <a href="#" class="text-gray-600 hover:text-pink-600 transition-colors duration-300">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
            </svg>
          </a>
          <a href="#" class="text-gray-600 hover:text-pink-600 transition-colors duration-300">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.096.120.111.225.82.402-.09.402-.286 1.411-.327 1.609-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.749-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
            </svg>
          </a>
        </div>
        <p class="text-gray-600">© 2024 Mèo Béo Studio. Tất cả quyền được bảo lưu.</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      msg: 'Chào mừng đến với Mèo Béo Studio'
    }
  }
}
</script>

<style scoped>
/* Custom animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Gradient text */
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

/* Glassmorphism effect */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Responsive text */
@media (max-width: 768px) {
  .text-4xl {
    font-size: 2.5rem;
  }
  .text-6xl {
    font-size: 3rem;
  }
}
</style>