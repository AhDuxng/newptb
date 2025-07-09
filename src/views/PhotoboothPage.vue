<script setup>
import { ref, onUnmounted, computed, watch } from 'vue';
import previewImage from '../assets/mascot-bear.png'; // Make sure this path is correct in your project
import mascotBearLogo from '../assets/mascot-bear.png'; // Make sure this path is correct in your project

// --- Refs for state ---
const videoRef = ref(null);
const canvasRef = ref(null);
const isCameraOn = ref(false);
const isPhotoTaken = ref(false);
const photoData = ref(null);
const errorMessage = ref('');

// --- Ref for ImgBB upload ---
const isUploading = ref(false);
const uploadedImageUrl = ref(null);

// --- Refs for frame type features ---
const activeFrameType = ref('single');
const photosInStrip = ref([]);
const stripCaptureStep = ref(0);
const isCapturing = ref(false);
const countdown = ref(0);

// --- Refs for filters ---
const activeFilter = ref('filter-none');
const filters = ref([
  { name: 'Gốc', class: 'filter-none' },
  { name: 'Sắc nét', class: 'filter-contrast' },
  { name: 'Nâu đỏ', class: 'filter-sepia' },
  { name: 'Đen trắng', class: 'filter-grayscale' },
  { name: 'Cổ điển', class: 'filter-vintage' },
  { name: 'Mùa hè', class: 'filter-summer' },
]);

// Map to convert filter class to CSS value
const filterCssMap = {
  'filter-none': 'none',
  'filter-contrast': 'contrast(140%)',
  'filter-sepia': 'sepia(100%)',
  'filter-grayscale': 'grayscale(100%)',
  'filter-vintage': 'sepia(65%) contrast(110%) brightness(90%) saturate(130%)',
  'filter-summer': 'contrast(110%) brightness(110%) saturate(150%) hue-rotate(-10deg)',
};


// --- Refs for customization ---
const captureTimeOptions = ref([3, 5, 10]);
const selectedCaptureTime = ref(3);
const isContinuousShooting = ref(false);
const frameColor = ref('#FFFFFF');
const suggestedColors = ref(['#FFFFFF', '#000000', '#FFD700', '#F08080', '#ADD8E6', '#90EE90']);

// --- Refs for download delay ---
const isDownloadReady = ref(false);
const downloadCountdown = ref(5);
let downloadTimer = null;
let stream = null;
let captureLoopTimeout = null;

// --- Function to upload image to ImgBB (secure, via backend) ---
const uploadToImgBB = async () => {
  if (!photoData.value) return;
  isUploading.value = true;
  uploadedImageUrl.value = null;
  try {
    const base64Image = photoData.value.split(',')[1];
    // This API call assumes you have a backend endpoint '/api/upload'
    // that handles the actual upload to ImgBB using your API key.
    // This is crucial for security as API keys should not be exposed client-side.
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    errorMessage.value = "Tải ảnh thất bại. Vui lòng kiểm tra console.";
  } finally {
    isUploading.value = false;
  }
};

const copyUrl = (url) => {
  // Using document.execCommand('copy') for better compatibility in iframe environments
  const el = document.createElement('textarea');
  el.value = url;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  // Replace alert with a custom message box for better UX
  showCustomMessageBox('Đã sao chép link!');
};

// Custom message box function (replace alert)
const showCustomMessageBox = (message) => {
  const messageBox = document.createElement('div');
  messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 opacity-0 transition-opacity duration-300';
  messageBox.textContent = message;
  document.body.appendChild(messageBox);

  // Animate in
  setTimeout(() => {
    messageBox.style.opacity = '1';
  }, 10);

  // Animate out and remove
  setTimeout(() => {
    messageBox.style.opacity = '0';
    messageBox.addEventListener('transitionend', () => messageBox.remove());
  }, 2000);
};


// --- FUNCTION TO DRAW FINAL IMAGE (UPDATED DIMENSIONS AND TEXT POSITION) ---
const generateFinalImage = async (backgroundColor) => {
  if (photosInStrip.value.length === 0 || !canvasRef.value) return;

  const canvas = canvasRef.value;
  const context = canvas.getContext('2d');

  // Define image dimensions based on active frame type
  const singleImgWidth = 1294;
  const singleImgHeight = 974;
  const stripImgWidth = 863; // New width for strip photos
  const stripImgHeight = 649; // New height for strip photos
  const twoByThreeImgWidth = 863; // Same as strip for ratio
  const twoByThreeImgHeight = 649; // Same as strip for ratio

  let currentImageWidth, currentImageHeight;
  if (activeFrameType.value === 'single') {
      currentImageWidth = singleImgWidth;
      currentImageHeight = singleImgHeight;
  } else if (activeFrameType.value === 'strip') {
      currentImageWidth = stripImgWidth;
      currentImageHeight = stripImgHeight;
  } else { // 2x3
      currentImageWidth = twoByThreeImgWidth;
      currentImageHeight = twoByThreeImgHeight;
  }


  const PADDING = 50;
  const BOTTOM_MARGIN = 150; // Space for logo and text

  context.setTransform(1, 0, 0, 1, 0, 0); // Reset canvas transformation

  if (activeFrameType.value === 'single') {
    const firstImage = new Image();
    firstImage.src = photosInStrip.value[0];
    await new Promise(resolve => firstImage.onload = resolve);
    
    canvas.width = currentImageWidth + PADDING * 2;
    canvas.height = currentImageHeight + PADDING * 2 + BOTTOM_MARGIN;
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(firstImage, PADDING, PADDING, currentImageWidth, currentImageHeight);

  } else if (activeFrameType.value === 'strip') { // activeFrameType.value === 'strip'
    const BORDER_WIDTH = 50; // Space between photos in the strip
    canvas.width = currentImageWidth + PADDING * 2;
    canvas.height = (currentImageHeight * 4) + PADDING * 2 + (BORDER_WIDTH * 3) + BOTTOM_MARGIN;
    
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 4; i++) {
      if (!photosInStrip.value[i]) continue;
      const img = new Image();
      img.src = photosInStrip.value[i];
      await new Promise(r => img.onload = r);
      const yPos = PADDING + (i * currentImageHeight) + (i * BORDER_WIDTH);
      context.drawImage(img, PADDING, yPos, currentImageWidth, currentImageHeight);
    }
  } else { // '2x3' frame
      const BORDER_WIDTH = 40; // A bit smaller border for 2x3
      canvas.width = (currentImageWidth * 2) + PADDING * 2 + BORDER_WIDTH;
      canvas.height = (currentImageHeight * 3) + PADDING * 2 + (BORDER_WIDTH * 2) + BOTTOM_MARGIN;

      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 6; i++) {
        if (!photosInStrip.value[i]) continue;
        const img = new Image();
        img.src = photosInStrip.value[i];
        await new Promise(r => img.onload = r);

        const col = i % 2;
        const row = Math.floor(i / 2);

        const xPos = PADDING + col * (currentImageWidth + BORDER_WIDTH);
        const yPos = PADDING + row * (currentImageHeight + BORDER_WIDTH);

        context.drawImage(img, xPos, yPos, currentImageWidth, currentImageHeight);
      }
  }
  
  // Add logo and text at the bottom
  const logo = new Image();
  logo.src = mascotBearLogo;
  await new Promise(r => logo.onload = r);
  
  const logoHeight = 100;
  const logoAspectRatio = logo.width / logo.height;
  const logoWidth = logoHeight * logoAspectRatio;
  
  const webName = 'DEMO STUDIO';
  const textHeight = 25; // Adjusted text height for better spacing
  const spaceBetweenLogoAndText = 5; // Reduced space between logo and text

  const totalContentHeight = logoHeight + spaceBetweenLogoAndText + textHeight;
  const contentYStart = canvas.height - BOTTOM_MARGIN + (BOTTOM_MARGIN - totalContentHeight) / 2;

  const logoX = (canvas.width - logoWidth) / 2;
  const logoY = contentYStart;
  
  context.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

  // Ensure 'Poppins' font is loaded or provide a fallback
  context.font = 'bold 25px Poppins, sans-serif'; // Adjusted font size slightly
  context.fillStyle = '#0369a1';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  const textY = logoY + logoHeight + spaceBetweenLogoAndText;
  context.fillText(webName, canvas.width / 2, textY);

  photoData.value = canvas.toDataURL('image/png');
  isPhotoTaken.value = true;
  stopCamera();
  uploadToImgBB();

  // --- Start download countdown ---
  isDownloadReady.value = false;
  downloadCountdown.value = 5;
  if(downloadTimer) clearInterval(downloadTimer);
  downloadTimer = setInterval(() => {
    downloadCountdown.value--;
    if (downloadCountdown.value <= 0) {
      clearInterval(downloadTimer);
      isDownloadReady.value = true;
    }
  }, 1000);
};

watch(frameColor, (newColor) => {
  // Regenerate the final image when frame color changes, if a photo has been taken
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
  
  // Reset download state
  if (downloadTimer) clearInterval(downloadTimer);
  isDownloadReady.value = false;
  downloadCountdown.value = 5;
};

const startCamera = async () => {
  resetState();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 }, // Request high resolution for the raw video feed
        facingMode: 'user'
      },
      audio: false
    });
    if (videoRef.value) videoRef.value.srcObject = stream;
    isCameraOn.value = true;
  } catch (error) {
    console.error("Lỗi Camera:", error);
    errorMessage.value = "Không thể truy cập camera. Vui lòng kiểm tra lại quyền và thiết bị.";
  }
};

const stopCamera = () => {
  if (stream) stream.getTracks().forEach(track => track.stop());
  isCameraOn.value = false;
  stream = null;
};

const selectFrame = (type) => {
  activeFrameType.value = type;
  // If camera is on, reset and restart to apply new frame type settings
  if (isCameraOn.value) retakePhoto();
};

// --- FUNCTION TO CAPTURE FRAME (UPDATED DIMENSIONS) ---
const captureFrame = () => {
  if (!videoRef.value || !canvasRef.value) return null;

  const video = videoRef.value;
  const canvas = canvasRef.value;
  const context = canvas.getContext('2d');

  // Determine target dimensions for the captured frame based on active frame type
  const targetWidthSingle = 1294;
  const targetHeightSingle = 974;
  const targetWidthStrip = 863; // New target width for strip photos
  const targetHeightStrip = 649; // New target height for strip photos
  const targetWidth2x3 = 863; // Same as strip
  const targetHeight2x3 = 649; // Same as strip

  let currentCaptureWidth, currentCaptureHeight;
  if (activeFrameType.value === 'single') {
      currentCaptureWidth = targetWidthSingle;
      currentCaptureHeight = targetHeightSingle;
  } else if (activeFrameType.value === 'strip') {
      currentCaptureWidth = targetWidthStrip;
      currentCaptureHeight = targetHeightStrip;
  } else { // 2x3
      currentCaptureWidth = targetWidth2x3;
      currentCaptureHeight = targetHeight2x3;
  }


  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  canvas.width = currentCaptureWidth;
  canvas.height = currentCaptureHeight;

  const videoAspectRatio = videoWidth / videoHeight;
  const targetAspectRatio = currentCaptureWidth / currentCaptureHeight;

  let sx = 0, sy = 0, sWidth = videoWidth, sHeight = videoHeight;

  // Calculate the source rectangle (sx, sy, sWidth, sHeight) from the video
  // to fit the target aspect ratio while covering the target area.
  if (videoAspectRatio > targetAspectRatio) {
    // Video is wider than target aspect ratio, so crop video horizontally
    sWidth = videoHeight * targetAspectRatio;
    sx = (videoWidth - sWidth) / 2;
  } else {
    // Video is taller than target aspect ratio, so crop video vertically
    sHeight = videoWidth / targetAspectRatio;
    sy = (videoHeight - sHeight) / 2;
  }
  
  context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

  // Apply filter directly to canvas context
  context.filter = filterCssMap[activeFilter.value] || 'none';
  
  // Flip image horizontally for mirror effect
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  
  // Draw the cropped video frame onto the canvas
  context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, currentCaptureWidth, currentCaptureHeight);

  // Reset filter to avoid affecting subsequent draws (if any)
  context.filter = 'none';

  return canvas.toDataURL('image/png');
};


const runCaptureCycle = () => {
  // Prevent multiple capture cycles from running simultaneously or if already completed for strip
  const totalPhotos = activeFrameType.value === 'strip' ? 4 : (activeFrameType.value === '2x3' ? 6 : 1);
  if (isCapturing.value || !isCameraOn.value || (activeFrameType.value !== 'single' && stripCaptureStep.value >= totalPhotos)) return;

  isCapturing.value = true;
  countdown.value = selectedCaptureTime.value;

  const countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
      
      const capturedPhoto = captureFrame();
      if (!capturedPhoto) {
        isCapturing.value = false;
        return;
      }
      
      photosInStrip.value.push(capturedPhoto);

      if (activeFrameType.value === 'single') {
        generateFinalImage(frameColor.value);
        isCapturing.value = false;
      } else { // Strip or 2x3 frame type
        stripCaptureStep.value++;
        
        if (stripCaptureStep.value >= totalPhotos) {
          generateFinalImage(frameColor.value);
          isCapturing.value = false;
          isContinuousShooting.value = false; // Stop continuous shooting after completion
        } else {
          isCapturing.value = false;
          if (isContinuousShooting.value) {
            // If continuous shooting is active, start the next capture after 1 second
            captureLoopTimeout = setTimeout(runCaptureCycle, 1000);
          }
        }
      }
    }
  }, 1000); // Countdown every second
};


const handlePrimaryCapture = () => {
  if (isCapturing.value) return; // Prevent double-clicking
  isContinuousShooting.value = false; // Ensure continuous shooting is off for single capture
  if (captureLoopTimeout) clearTimeout(captureLoopTimeout); // Clear any pending continuous capture
  runCaptureCycle();
};

const toggleContinuousShooting = () => {
  // If currently capturing and not in continuous mode, prevent toggling
  if (isCapturing.value && !isContinuousShooting.value) return; 
  isContinuousShooting.value = !isContinuousShooting.value;
  if (isContinuousShooting.value) {
    runCaptureCycle(); // Start continuous capture
  } else {
    if (captureLoopTimeout) clearTimeout(captureLoopTimeout); // Stop continuous capture
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
    if (isCameraOn.value && !isPhotoTaken.value) {
        if (activeFrameType.value === 'strip') {
            if (stripCaptureStep.value < 4) {
                return `Chụp ảnh (${stripCaptureStep.value + 1}/4)`;
            }
        } else if (activeFrameType.value === '2x3') {
            if (stripCaptureStep.value < 6) {
                return `Chụp ảnh (${stripCaptureStep.value + 1}/6)`;
            }
        }
    }
    return 'Chụp ảnh';
});

// Cleanup on component unmount
onUnmounted(() => {
  stopCamera();
  if (captureLoopTimeout) clearTimeout(captureLoopTimeout);
  if (downloadTimer) clearInterval(downloadTimer);
});
</script>

<template>
  <div class="flex flex-col items-center p-4 md:p-8 bg-sky-50 min-h-screen font-inter">
    <div class="w-full max-w-5xl flex flex-col md:flex-row gap-8 pt-8">
      
      <div class="w-full md:w-1/4 flex flex-col">
        <div class="bg-white p-4 rounded-xl shadow-md">
          <h3 class="text-lg font-semibold text-sky-800 mb-3 text-center md:text-left">Chọn loại khung</h3>
          <div class="flex flex-wrap md:flex-col gap-4 justify-center">
            
            <div @click="selectFrame('single')" class="cursor-pointer group">
              <div 
                class="bg-white p-2 rounded-lg shadow-md border-2 transition-all"
                :class="[activeFrameType === 'single' ? 'border-sky-500 ring-2 ring-sky-300' : 'border-gray-200']"
              >
                <div class="w-24 h-32 bg-gray-300 rounded-sm mx-auto flex items-center justify-center overflow-hidden">
                    <img v-if="activeFrameType === 'single' && photosInStrip.length > 0" :src="photosInStrip[0]" class="w-full h-full object-cover">
                    <svg v-else class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
              </div>
              <p class="text-center mt-2 text-sm font-medium" :class="[activeFrameType === 'single' ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-500']">Ảnh đơn</p>
            </div>
            
            <div @click="selectFrame('strip')" class="cursor-pointer group">
              <div 
                class="bg-white p-2 rounded-lg shadow-md border-2 transition-all overflow-hidden"
                :class="[activeFrameType === 'strip' ? 'border-sky-500 ring-2 ring-sky-300' : 'border-gray-200']"
              >
                <div class="w-24 h-48 flex flex-col mx-auto bg-gray-200">
                  <div v-for="i in 4" :key="i" class="h-1/4 border-b border-gray-300" :class="{'ring-2 ring-pink-500 ring-inset': activeFrameType === 'strip' && stripCaptureStep === i - 1 && isCameraOn}">
                    <img v-if="photosInStrip[i-1]" :src="photosInStrip[i-1]" class="w-full h-full object-cover">
                    <svg v-else class="w-full h-full text-gray-400 p-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                </div>
              </div>
              <p class="text-center mt-2 text-sm font-medium" :class="[activeFrameType === 'strip' ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-500']">Dải 4 ảnh</p>
            </div>
            
            <div @click="selectFrame('2x3')" class="cursor-pointer group">
              <div
                class="bg-white p-2 rounded-lg shadow-md border-2 transition-all"
                :class="[activeFrameType === '2x3' ? 'border-sky-500 ring-2 ring-sky-300' : 'border-gray-200']"
              >
                <div class="w-24 h-36 bg-gray-200 rounded-sm mx-auto grid grid-cols-2 grid-rows-3 gap-1 p-1">
                    <div v-for="i in 6" :key="i" class="bg-gray-300 rounded-sm flex items-center justify-center overflow-hidden" :class="{'ring-2 ring-pink-500 ring-inset': activeFrameType === '2x3' && stripCaptureStep === i - 1 && isCameraOn}">
                        <img v-if="photosInStrip[i-1]" :src="photosInStrip[i-1]" class="w-full h-full object-cover">
                        <svg v-else class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                </div>
              </div>
              <p class="text-center mt-2 text-sm font-medium" :class="[activeFrameType === '2x3' ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-500']">Ảnh 2x3</p>
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
          
          <div class="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center mb-6 shadow-inner mx-auto">
            <div v-if="!isCameraOn && !isPhotoTaken" class="h-full flex flex-col items-center justify-center text-center text-white p-4">
              <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <p class="mt-2 font-medium">Camera đang tắt</p>
              <p class="text-sm text-gray-300">Nhấn "Bật Camera" để bắt đầu</p>
            </div>
            <video ref="videoRef" v-show="isCameraOn && !isPhotoTaken" autoplay playsinline muted class="w-full h-full object-cover transition-all duration-300" :class="activeFilter"></video>
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
          
          <div class="flex flex-col justify-center items-center gap-4">
            <div class="flex flex-wrap justify-center items-center gap-4">
              <template v-if="!isPhotoTaken">
                <button v-if="!isCameraOn" @click="startCamera" class="w-full sm:w-auto px-8 py-3 bg-sky-500 text-white font-semibold rounded-full hover:bg-sky-600 transition-all duration-300 shadow-md transform hover:scale-105">Bật Camera</button>
                
                <template v-else>
                    <button :disabled="isCapturing" @click="handlePrimaryCapture" class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105" :class="{'animate-pulse': isCapturing && !isContinuousShooting}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span>{{ captureButtonText }}</span>
                    </button>

                    <button v-if="activeFrameType === 'strip' || activeFrameType === '2x3'" @click="toggleContinuousShooting" class="w-full sm:w-auto px-6 py-3 font-semibold rounded-full transition-all duration-300 shadow-md transform hover:scale-105" :class="[isContinuousShooting ? 'bg-purple-600 text-white animate-pulse' : 'bg-gray-200 text-gray-800 hover:bg-gray-300']" :disabled="isCapturing && !isContinuousShooting">
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
                      :class="[frameColor === color ? 'ring-2 ring-offset-2 ring-sky-500' : 'ring-1 ring-gray-400']"
                    ></span>
                  </div>
                  <input type="color" v-model="frameColor" id="frameColor" class="w-8 h-8 p-0 border-none rounded-full cursor-pointer bg-transparent" style="height: 2rem; width: 2rem;">
                </div>
                
                <a 
                  :href="isDownloadReady ? photoData : '#'" 
                  :download="isDownloadReady ? `photobooth-${activeFrameType}-${Date.now()}.png` : null"
                  @click="!isDownloadReady && $event.preventDefault()"
                  class="flex items-center justify-center w-40 text-center px-6 py-3 text-white font-semibold rounded-full transition-colors duration-300 shadow-md"
                  :class="isDownloadReady ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'">
                  <span v-if="isDownloadReady">Tải xuống</span>
                  <span v-else>Đợi {{ downloadCountdown }}s...</span>
                </a>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Video element is flipped horizontally to act like a mirror */
video {
  transform: scaleX(-1);
}

/* Filter styles */
.filter-none { filter: none; }
.filter-grayscale { filter: grayscale(100%); }
.filter-sepia { filter: sepia(100%); }
.filter-contrast { filter: contrast(140%); }
.filter-vintage { filter: sepia(65%) contrast(110%) brightness(90%) saturate(130%); }
.filter-summer { filter: contrast(110%) brightness(110%) saturate(150%) hue-rotate(-10deg); }

/* Custom scrollbar for filter preview */
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

/* Fade transition for elements (if used, not explicitly in template but good to keep) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Styling for color input type */
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
