<script setup>
import { ref, onUnmounted, computed, watch } from 'vue';
import previewImage from '../assets/mascot-bear.png';
import mascotBearLogo from '../assets/mascot-bear.png';

const notificationStore = useNotificationStore();

// --- Các ref cho trạng thái ---
const videoRef = ref(null);
const canvasRef = ref(null);
const isCameraOn = ref(false);
const isPhotoTaken = ref(false);
const photoData = ref(null);
const errorMessage = ref('');

// --- Ref cho việc tải lên ImgBB ---
const isUploading = ref(false);
const uploadedImageUrl = ref(null);

// --- Các ref cho tính năng khung ảnh ---
const activeFrameType = ref('single');
const photosInStrip = ref([]);
const stripCaptureStep = ref(0);
const isCapturing = ref(false);
const countdown = ref(0);

// --- Các ref cho bộ lọc ---
const activeFilter = ref('filter-none');
const filters = ref([
  { name: 'Gốc', class: 'filter-none' },
  { name: 'Sắc nét', class: 'filter-contrast' },
  { name: 'Nâu đỏ', class: 'filter-sepia' },
  { name: 'Đen trắng', class: 'filter-grayscale' },
  { name: 'Cổ điển', class: 'filter-vintage' },
  { name: 'Mùa hè', class: 'filter-summer' },
]);

// --- Ref cho tùy chỉnh ---
const captureTimeOptions = ref([3, 5, 10]);
const selectedCaptureTime = ref(3);
const isContinuousShooting = ref(false);
const frameColor = ref('#FFFFFF');
const suggestedColors = ref(['#FFFFFF', '#000000', '#FFD700', '#F08080', '#ADD8E6', '#90EE90']);

let stream = null;
let captureLoopTimeout = null;
// --- ĐÃ XÓA API KEY KHỎI ĐÂY ---

// --- Hàm tải ảnh lên (đã cập nhật để gọi backend) ---
const uploadToImgBB = async () => {
  if (!photoData.value) return;

  isUploading.value = true;
  uploadedImageUrl.value = null;

  try {
    const base64Image = photoData.value.split(',')[1];
    
    // Gọi đến serverless function của bạn, không phải ImgBB
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      uploadedImageUrl.value = result.data.url;
    } else {
      throw new Error(result.error || 'Lỗi từ server');
    }
  } catch (error) {
    console.error('Lỗi khi tải ảnh:', error);
    // Không hiển thị thông báo lỗi cho người dùng
  } finally {
    isUploading.value = false;
  }
};

const copyUrl = (url) => {
  navigator.clipboard.writeText(url);
  notificationStore.showNotification('url_copied');
};

// --- HÀM VẼ LẠI ẢNH ---
const generateFinalImage = async (backgroundColor) => {
  if (photosInStrip.value.length === 0 || !canvasRef.value) return;

  const canvas = canvasRef.value;
  const context = canvas.getContext('2d');
  const PADDING = 50;
  const BOTTOM_MARGIN = 250;

  const firstImage = new Image();
  firstImage.src = photosInStrip.value[0];
  await new Promise(resolve => firstImage.onload = resolve);

  const imgWidth = firstImage.width;
  const imgHeight = firstImage.height;

  context.setTransform(1, 0, 0, 1, 0, 0);

  if (activeFrameType.value === 'single') {
    canvas.width = imgWidth + PADDING * 2;
    canvas.height = imgHeight + PADDING * 2 + BOTTOM_MARGIN;
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(firstImage, PADDING, PADDING, imgWidth, imgHeight);
  } else {
    const BORDER_WIDTH = 50;
    canvas.width = imgWidth + PADDING * 2;
    canvas.height = (imgHeight * 4) + PADDING * 2 + (BORDER_WIDTH * 3) + BOTTOM_MARGIN;
    
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 4; i++) {
      if (!photosInStrip.value[i]) continue;
      const img = new Image();
      img.src = photosInStrip.value[i];
      await new Promise(r => img.onload = r);
      const yPos = PADDING + (i * imgHeight) + (i * BORDER_WIDTH);
      context.drawImage(img, PADDING, yPos, imgWidth, imgHeight);
    }
  }
  
  const logo = new Image();
  logo.src = mascotBearLogo;
  await new Promise(r => logo.onload = r);
  
  const logoHeight = 150;
  const logoAspectRatio = logo.width / logo.height;
  const logoWidth = logoHeight * logoAspectRatio;
  
  const webName = 'DEMO STUDIO';
  const textHeight = 30;
  const spaceBetweenLogoAndText = 20;

  const totalContentHeight = logoHeight + spaceBetweenLogoAndText + textHeight;
  const contentYStart = canvas.height - BOTTOM_MARGIN + (BOTTOM_MARGIN - totalContentHeight) / 2;

  const logoX = (canvas.width - logoWidth) / 2;
  const logoY = contentYStart;
  
  context.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

  context.font = 'bold 30px Poppins';
  context.fillStyle = '#0369a1';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  const textY = logoY + logoHeight + spaceBetweenLogoAndText;
  context.fillText(webName, canvas.width / 2, textY);

  photoData.value = canvas.toDataURL('image/png');
  isPhotoTaken.value = true;
  stopCamera();
  
  uploadToImgBB();
};

watch(frameColor, (newColor) => {
  if (isPhotoTaken.value) {
    generateFinalImage(newColor);
  }
});

const resetState = () => {
  errorMessage.value = '';
  isPhotoTaken.value = false;
  photoData.value = null;
  activeFilter.value = 'filter-none';
  photosInStrip.value = [];
  stripCaptureStep.value = 0;
  isCapturing.value = false;
  countdown.value = 0;
  isContinuousShooting.value = false;
  frameColor.value = '#FFFFFF';
  isUploading.value = false;
  uploadedImageUrl.value = null;
  if (captureLoopTimeout) clearTimeout(captureLoopTimeout);
};

const startCamera = async () => {
  resetState();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    if (videoRef.value) videoRef.value.srcObject = stream;
    isCameraOn.value = true;
  } catch (error) {
    errorMessage.value = "Không thể truy cập camera. Vui lòng kiểm tra lại quyền và thiết bị.";
    notificationStore.showNotification('camera_error');
  }
};

const stopCamera = () => {
  if (stream) stream.getTracks().forEach(track => track.stop());
  isCameraOn.value = false;
  stream = null;
};

const selectFrame = (type) => {
  activeFrameType.value = type;
  if (isCameraOn.value) retakePhoto();
};

const captureFrame = () => {
  if (!videoRef.value || !canvasRef.value) return null;
  const video = videoRef.value;
  const canvas = canvasRef.value;
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.filter = window.getComputedStyle(video).filter;
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
};

const runCaptureCycle = () => {
  if (stripCaptureStep.value >= 4 || !isCameraOn.value) {
    isCapturing.value = false;
    isContinuousShooting.value = false;
    return;
  }
  isCapturing.value = true;
  countdown.value = selectedCaptureTime.value;
  const countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
      const capturedPhoto = captureFrame();
      if (!capturedPhoto) {
        isCapturing.value = false;
        isContinuousShooting.value = false;
        return;
      }
      photosInStrip.value.push(capturedPhoto);
      
      if (activeFrameType.value === 'single' || stripCaptureStep.value >= 3) {
        generateFinalImage(frameColor.value);
        isCapturing.value = false;
        isContinuousShooting.value = false;
      } else {
        stripCaptureStep.value++;
        if (isContinuousShooting.value) {
          captureLoopTimeout = setTimeout(runCaptureCycle, 1500);
        } else {
          isCapturing.value = false;
        }
      }
    }
  }, 1000);
};

const handlePrimaryCapture = () => {
  if (isCapturing.value) return;
  isContinuousShooting.value = false;
  if(captureLoopTimeout) clearTimeout(captureLoopTimeout);
  runCaptureCycle();
};

const toggleContinuousShooting = () => {
  if (isCapturing.value && !isContinuousShooting.value) return;
  isContinuousShooting.value = !isContinuousShooting.value;
  if (isContinuousShooting.value) {
    notificationStore.showNotification('continuous_start');
    runCaptureCycle();
  } else {
    notificationStore.showNotification('continuous_stop');
    if (captureLoopTimeout) clearTimeout(captureLoopTimeout);
  }
};

const retakePhoto = () => {
  stopCamera();
  resetState();
  startCamera();
};

const applyFilter = (filterClass) => {
  activeFilter.value = filterClass;
};

const captureButtonText = computed(() => {
  if (activeFrameType.value === 'strip' && isCameraOn.value && !isPhotoTaken) {
    return `Chụp ảnh (${stripCaptureStep.value + 1}/4)`;
  }
  return 'Chụp ảnh';
});

onUnmounted(() => {
  stopCamera();
  if (captureLoopTimeout) clearTimeout(captureLoopTimeout);
});
</script>

<template>
  <div class="flex flex-col items-center p-4 md:p-8 bg-sky-50 min-h-screen">
    <h1 class="text-4xl font-bold text-sky-700 mb-6 font-poppins">🎨 Photobooth Pro 🎨</h1>

    <div class="w-full max-w-5xl flex flex-col md:flex-row gap-8">
      
      <div class="w-full md:w-1/4 flex flex-col">
        <div class="bg-white p-4 rounded-xl shadow-md">
          <h3 class="text-lg font-semibold text-sky-800 mb-3 text-center md:text-left">Chọn loại khung</h3>
          <div class="flex md:flex-col gap-4 justify-center">
            
            <div @click="selectFrame('single')" class="cursor-pointer group">
              <div 
                class="bg-white p-2 rounded-lg shadow-md border-2 transition-all"
                :class="[activeFrameType === 'single' ? 'border-sky-500 ring-2 ring-sky-300' : 'border-gray-200']"
              >
                <div class="w-24 h-32 bg-gray-300 rounded-sm mx-auto flex items-center justify-center overflow-hidden">
                   <img v-if="activeFrameType === 'single' && photosInStrip.length > 0" :src="photosInStrip[0]" class="w-full h-full object-cover">
                </div>
              </div>
              <p class="text-center mt-2 text-sm font-medium" :class="[activeFrameType === 'single' ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-500']">Ảnh đơn</p>
            </div>
            
            <div @click="selectFrame('strip')" class="cursor-pointer group">
              <div 
                class="bg-white rounded-lg shadow-md border-2 transition-all overflow-hidden"
                :class="[activeFrameType === 'strip' ? 'border-sky-500 ring-2 ring-sky-300' : 'border-transparent']"
              >
                <div class="w-24 h-48 flex flex-col mx-auto bg-gray-200">
                  <div v-for="i in 4" :key="i" class="h-1/4 border-b border-gray-300" :class="{'ring-2 ring-pink-500 ring-inset': activeFrameType === 'strip' && stripCaptureStep === i - 1 && isCameraOn}">
                    <img v-if="photosInStrip[i-1]" :src="photosInStrip[i-1]" class="w-full h-full object-cover">
                  </div>
                </div>
              </div>
              <p class="text-center mt-2 text-sm font-medium" :class="[activeFrameType === 'strip' ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-500']">Dải 4 ảnh</p>
            </div>
          </div>
        </div>

        <div v-if="isCameraOn" class="bg-white p-4 rounded-xl shadow-md mt-6">
          <h4 class="text-lg font-semibold text-sky-800 mb-2 text-center md:text-left">Thời gian chụp</h4>
          <div class="flex justify-center md:justify-start gap-2">
            <button
              v-for="time in captureTimeOptions"
              :key="time"
              @click="selectedCaptureTime = time"
              :disabled="isCapturing"
              class="px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
              :class="selectedCaptureTime === time ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
            >{{ time }} giây</button>
          </div>
        </div>
      </div>

      <div class="w-full md:w-3/4">
        <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-sky-200">
          
          <div class="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center mb-6 shadow-inner">
            <div v-if="!isCameraOn && !isPhotoTaken" class="text-center text-white p-4">
              <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <p class="mt-2 font-medium">Camera đang tắt</p>
              <p class="text-sm text-gray-300">Nhấn "Bật Camera" để bắt đầu</p>
            </div>
            <video ref="videoRef" v-show="isCameraOn && !isPhotoTaken" :class="activeFilter" autoplay playsinline muted class="w-full h-full object-cover transition-all duration-300"></video>
            <img v-if="isPhotoTaken" :src="photoData" alt="Ảnh đã chụp" class="w-full h-full object-contain bg-transparent">
            
            <div v-if="countdown > 0" class="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-9xl font-bold z-20">{{ countdown }}</div>
            
            <canvas ref="canvasRef" class="hidden"></canvas>
          </div>
          
          <div v-if="isCameraOn && !isPhotoTaken" class="mb-6">
             <div class="flex space-x-4 overflow-x-auto pb-3 -mx-2 px-2">
               <div v-for="filter in filters" :key="filter.class" @click="applyFilter(filter.class)" class="flex-shrink-0 cursor-pointer text-center group">
                 <div class="w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200" :class="[activeFilter === filter.class ? 'border-sky-500 ring-2 ring-sky-300' : 'border-transparent']">
                   <img :src="previewImage" :class="filter.class" class="w-full h-full object-cover" alt="Preview bộ lọc">
                 </div>
                 <p class="mt-1.5 text-xs font-semibold transition-colors duration-200" :class="[activeFilter === filter.class ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-500']">{{ filter.name }}</p>
               </div>
             </div>
           </div>

          <div v-if="errorMessage" class="text-center text-red-600 bg-red-100 p-3 rounded-lg mb-4">{{ errorMessage }}</div>
          
          <div class="flex flex-col justify-center items-center gap-4">
            <div class="flex flex-wrap justify-center items-center gap-4">
              <template v-if="!isPhotoTaken">
                <button v-if="!isCameraOn" @click="startCamera" class="w-full sm:w-auto px-8 py-3 bg-sky-500 text-white font-semibold rounded-full hover:bg-sky-600 transition-all duration-300 shadow-md transform hover:scale-105">Bật Camera</button>
                
                <template v-else>
                   <button :disabled="isCapturing" @click="handlePrimaryCapture" class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105" :class="{'animate-pulse': isCapturing && !isContinuousShooting}">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     <span>{{ captureButtonText }}</span>
                   </button>

                   <button v-if="activeFrameType === 'strip'" @click="toggleContinuousShooting" class="w-full sm:w-auto px-6 py-3 font-semibold rounded-full transition-all duration-300 shadow-md transform hover:scale-105" :class="[isContinuousShooting ? 'bg-purple-600 text-white animate-pulse' : 'bg-gray-200 text-gray-800 hover:bg-gray-300']" :disabled="isCapturing && !isContinuousShooting">
                      {{ isContinuousShooting ? 'Dừng chụp' : 'Chụp liên tục' }}
                   </button>
                </template>
              </template>
              
              <template v-else>
                <button @click="retakePhoto" class="px-6 py-3 bg-gray-500 text-white font-semibold rounded-full hover:bg-gray-600 transition-all duration-300 shadow-md">Chụp lại</button>
                
                <div class="flex items-center gap-3 bg-gray-200 p-2 rounded-full shadow-inner">
                  <label for="frameColor" class="text-sm font-medium text-gray-700 pl-2">Màu khung:</label>
                  <div class="flex items-center gap-2">
                    <span
                      v-for="color in suggestedColors"
                      :key="color"
                      @click="frameColor = color"
                      class="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
                      :style="{ backgroundColor: color }"
                      :class="frameColor === color ? 'ring-2 ring-offset-2 ring-sky-500' : 'ring-1 ring-gray-400'"
                    ></span>
                  </div>
                  <input type="color" v-model="frameColor" id="frameColor" class="w-8 h-8 p-0 border-none rounded-full cursor-pointer bg-transparent" style="height: 2rem; width: 2rem;">
                </div>
                
                <a :href="photoData" :download="`photobooth-${activeFrameType}-${Date.now()}.png`" class="text-center px-6 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-all duration-300 shadow-md">Tải xuống</a>
              </template>
            </div>
            
            <div v-if="isPhotoTaken" class="mt-4 w-full max-w-md text-center">
              <div v-if="isUploading" class="p-3 bg-sky-100 border border-sky-300 rounded-lg animate-pulse">
                <p class="font-semibold text-sky-800 flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-sky-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang tự động lưu ảnh trực tuyến...
                </p>
              </div>
              <div v-if="uploadedImageUrl" class="p-4 bg-green-100 border border-green-300 rounded-lg shadow">
                <p class="font-semibold text-green-800">Lưu trữ thành công! Link ảnh:</p>
                <a :href="uploadedImageUrl" target="_blank" class="text-blue-600 hover:underline break-all">{{ uploadedImageUrl }}</a>
                <button @click="copyUrl(uploadedImageUrl)" class="ml-4 mt-2 sm:mt-0 px-3 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600">Sao chép</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
video {
  transform: scaleX(-1);
}
.filter-none { filter: none; }
.filter-grayscale { filter: grayscale(100%); }
.filter-sepia { filter: sepia(100%); }
.filter-contrast { filter: contrast(140%); }
.filter-vintage { filter: sepia(65%) contrast(110%) brightness(90%) saturate(130%); }
.filter-summer { filter: contrast(110%) brightness(110%) saturate(150%) hue-rotate(-10deg); }

.overflow-x-auto::-webkit-scrollbar { 
  height: 6px; 
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.overflow-x-auto::-webkit-scrollbar-thumb { 
  background-color: #94a3b8; 
  border-radius: 10px; 
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

input[type="color"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: transparent;
  border: none;
  cursor: pointer;
}
input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}
input[type="color"]::-webkit-color-swatch {
  border-radius: 50%;
  border: 2px solid #e2e8f0;
}
input[type="color"]::-moz-color-swatch {
  border-radius: 50%;
  border: 2px solid #e2e8f0;
}
</style>