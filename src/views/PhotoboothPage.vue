<script setup>
import { ref, onUnmounted, computed, watch, nextTick } from 'vue';
import previewImage from '../assets/mascot-bear.png';
import mascotBearLogo from '../assets/mascot-bear.png';
import { availableFrames } from '../config/frames.js';
import Cropper from 'cropperjs';

// --- State Management ---
const videoRef = ref(null);
const canvasRef = ref(null);
const isCameraOn = ref(false);
const currentStep = ref('capturing'); // Can be: 'capturing', 'reviewing', 'finalizing'
const photoData = ref(null);
const errorMessage = ref('');

const reviewPreviewData = ref(null);

const isUploading = ref(false);
const uploadedImageUrl = ref(null);
const uploadError = ref(null);

const activeFrameType = ref('single');
const photosInStrip = ref([]);
const stripCaptureStep = ref(0);
const isCapturing = ref(false);
const countdown = ref(0);

const selectedOverlayFrame = ref(null);

const activeFilter = ref('filter-none');
const filters = ref([
  { name: 'Gốc', class: 'filter-none' },
  { name: 'Làm đẹp', class: 'filter-beautify' },
  { name: 'Sắc nét', class: 'filter-contrast' },
  { name: 'Nâu đỏ', class: 'filter-sepia' },
  { name: 'Đen trắng', class: 'filter-grayscale' },
  { name: 'Cổ điển', class: 'filter-vintage' },
  { name: 'Mùa hè', class: 'filter-summer' },
]);

// --- Pixel manipulation filter functions ---
const applyFilterToImageData = (imageData, filterClass) => {
    const data = imageData.data;
    const len = data.length;
    const truncate = (val) => Math.min(255, Math.max(0, val));

    for (let i = 0; i < len; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        switch (filterClass) {
            case 'filter-grayscale': {
                const avg = 0.299 * r + 0.587 * g + 0.114 * b;
                data[i] = data[i + 1] = data[i + 2] = avg;
                break;
            }
            case 'filter-sepia': {
                const tr = 0.393 * r + 0.769 * g + 0.189 * b;
                const tg = 0.349 * r + 0.686 * g + 0.168 * b;
                const tb = 0.272 * r + 0.534 * g + 0.131 * b;
                data[i] = truncate(tr);
                data[i + 1] = truncate(tg);
                data[i + 2] = truncate(tb);
                break;
            }
            case 'filter-contrast': {
                const amount = 1.5;
                const avg = (r + g + b) / 3;
                data[i] = truncate((r - avg) * amount + avg);
                data[i+1] = truncate((g - avg) * amount + avg);
                data[i+2] = truncate((b - avg) * amount + avg);
                break;
            }
            case 'filter-beautify': {
                const brightness = 1.05, saturation = 1.1;
                r = truncate(r * brightness);
                g = truncate(g * brightness);
                b = truncate(b * brightness);
                const avg = (r + g + b) / 3;
                data[i] = truncate(avg + (r - avg) * saturation);
                data[i + 1] = truncate(avg + (g - avg) * saturation);
                data[i + 2] = truncate(avg + (b - avg) * saturation);
                break;
            }
            case 'filter-vintage': {
                let tr = 0.393 * r + 0.769 * g + 0.189 * b;
                let tg = 0.349 * r + 0.686 * g + 0.168 * b;
                let tb = 0.272 * r + 0.534 * g + 0.131 * b;
                r = truncate(tr); g = truncate(tg); b = truncate(tb);
                r *= 0.95; g *= 0.95; b *= 0.95;
                data[i] = r; data[i+1] = g; data[i+2] = b;
                break;
            }
            case 'filter-summer': {
                const saturation = 1.4;
                const avg = (r + g + b) / 3;
                r = truncate(avg + (r - avg) * saturation);
                g = truncate(avg + (g - avg) * saturation);
                b = truncate(avg + (b - avg) * saturation);
                data[i] = truncate(r * 1.1);
                data[i+1] = truncate(g * 1.05);
                data[i+2] = truncate(b * 0.9);
                break;
            }
        }
    }
    return imageData;
};

const captureTimeOptions = ref([3, 5, 10]);
const selectedCaptureTime = ref(3);
const isContinuousShooting = ref(false);
const frameColor = ref('#FFFFFF');
const suggestedColors = ref(['#FFFFFF', '#000000', '#FFD700', '#F08080', '#ADD8E6', '#90EE90']);

const isDownloadReady = ref(false);
const downloadCountdown = ref(5);
let downloadTimer = null;
let stream = null;
let captureLoopTimeout = null;

const fileInput = ref(null);
const isCropping = ref(false);
const cropImageRef = ref(null);
const imageToCrop = ref(null);
let cropperInstance = null;

const previewCanvasRef = ref(null);
const processingCanvasRef = ref(null);
let animationFrameId = null;

let lastFilterTime = 0;
const filterInterval = 100;

const staticStarsSmall = ref([]);
const staticStarsMedium = ref([]);
const staticStarsLarge = ref([]);
const NUMBER_OF_STATIC_STARS_SM = 100;
const NUMBER_OF_STATIC_STARS_MD = 50;
const NUMBER_OF_STATIC_STARS_LG = 25;

const generateStaticStars = () => {
  const createStars = (count, sizeMin, sizeMax, durationMin, durationMax) => {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * (sizeMax - sizeMin) + sizeMin;
      stars.push({
        style: {
          width: `${size}px`, height: `${size}px`,
          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${Math.random() * (durationMax - durationMin) + durationMin}s`,
        }
      });
    }
    return stars;
  };
  staticStarsSmall.value = createStars(NUMBER_OF_STATIC_STARS_SM, 0.5, 1, 4, 7);
  staticStarsMedium.value = createStars(NUMBER_OF_STATIC_STARS_MD, 1, 1.5, 6, 9);
  staticStarsLarge.value = createStars(NUMBER_OF_STATIC_STARS_LG, 1.5, 2.2, 8, 11);
};
generateStaticStars();

const maxPhotos = computed(() => {
  if (activeFrameType.value === 'strip') return 4;
  if (activeFrameType.value === 'grid_2x3') return 6;
  return 1;
});

const cropAspectRatio = computed(() => {
    if (activeFrameType.value === 'single') return 1294 / 974;
    return 863 / 649;
});

const areAllPhotosTaken = computed(() => {
    if (activeFrameType.value === 'single') {
        return photosInStrip.value.length > 0 && photosInStrip.value[0];
    }
    return photosInStrip.value.length === maxPhotos.value && photosInStrip.value.every(p => p);
});

const captureButtonText = computed(() => {
    if (areAllPhotosTaken.value) return 'Hoàn tất';
    if (isCameraOn.value && currentStep.value === 'capturing') {
        if (activeFrameType.value !== 'single') {
            return `Chụp ảnh (${stripCaptureStep.value + 1}/${maxPhotos.value})`;
        }
    }
    return 'Chụp ảnh';
});

const renderVideoToCanvas = () => {
  if (!isCameraOn.value || !videoRef.value || !previewCanvasRef.value || videoRef.value.paused || videoRef.value.ended) {
    return;
  }
  const video = videoRef.value;
  const processingCanvas = processingCanvasRef.value;
  const processingCtx = processingCanvas.getContext('2d');
  const visibleCanvas = previewCanvasRef.value;
  const visibleCtx = visibleCanvas.getContext('2d');
  const now = Date.now();

  visibleCtx.save();
  visibleCtx.translate(visibleCanvas.width, 0);
  visibleCtx.scale(-1, 1);
  visibleCtx.drawImage(video, 0, 0, visibleCanvas.width, visibleCanvas.height);
  visibleCtx.restore();

  if (activeFilter.value !== 'filter-none' && now - lastFilterTime > filterInterval) {
    lastFilterTime = now;

    processingCtx.save();
    processingCtx.translate(processingCanvas.width, 0);
    processingCtx.scale(-1, 1);
    processingCtx.drawImage(video, 0, 0, processingCanvas.width, processingCanvas.height);
    processingCtx.restore();
    
    let imageData = processingCtx.getImageData(0, 0, processingCanvas.width, processingCanvas.height);
    imageData = applyFilterToImageData(imageData, activeFilter.value);
    processingCtx.putImageData(imageData, 0, 0);
  }

  if (activeFilter.value !== 'filter-none') {
    visibleCtx.drawImage(processingCanvas, 0, 0, visibleCanvas.width, visibleCanvas.height);
  }

  animationFrameId = requestAnimationFrame(renderVideoToCanvas);
};


const generateReviewPreview = async () => {
    if (!areAllPhotosTaken.value) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    if (activeFrameType.value === 'single') {
        reviewPreviewData.value = photosInStrip.value[0];
        return;
    }

    const stripImgWidth = 863;
    const stripImgHeight = 649;
    const BORDER_WIDTH = 20;

    if (activeFrameType.value === 'strip') {
        tempCanvas.width = stripImgWidth;
        tempCanvas.height = (stripImgHeight * 4) + (BORDER_WIDTH * 3);
        tempCtx.fillStyle = '#4b5563';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        for (let i = 0; i < 4; i++) {
            if (!photosInStrip.value[i]) continue;
            const img = new Image();
            img.src = photosInStrip.value[i];
            await new Promise(r => img.onload = r);
            const yPos = i * (stripImgHeight + BORDER_WIDTH);
            tempCtx.drawImage(img, 0, yPos, stripImgWidth, stripImgHeight);
        }
    } else if (activeFrameType.value === 'grid_2x3') {
        tempCanvas.width = (stripImgWidth * 2) + BORDER_WIDTH;
        tempCanvas.height = (stripImgHeight * 3) + (BORDER_WIDTH * 2);
        tempCtx.fillStyle = '#4b5563';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        for (let i = 0; i < 6; i++) {
            if (!photosInStrip.value[i]) continue;
            const img = new Image();
            img.src = photosInStrip.value[i];
            await new Promise(r => img.onload = r);
            const col = i % 2;
            const row = Math.floor(i / 2);
            const xPos = col * (stripImgWidth + BORDER_WIDTH);
            const yPos = row * (stripImgHeight + BORDER_WIDTH);
            tempCtx.drawImage(img, xPos, yPos, stripImgWidth, stripImgHeight);
        }
    }
    
    reviewPreviewData.value = tempCanvas.toDataURL('image/png');
};


const updateStripCaptureStep = () => {
    const nextSlot = photosInStrip.value.findIndex(photo => !photo);
    stripCaptureStep.value = nextSlot === -1 ? maxPhotos.value : nextSlot;
};

const deletePhoto = (index) => {
    if (index >= 0 && index < photosInStrip.value.length) {
        photosInStrip.value[index] = undefined;
        updateStripCaptureStep();
        if (currentStep.value === 'reviewing') {
            currentStep.value = 'capturing';
            reviewPreviewData.value = null;
        }
    }
};

const selectFrame = (type) => {
  activeFrameType.value = type;
  currentStep.value = 'capturing';
  photoData.value = null;
  reviewPreviewData.value = null;
  
  if (type === 'strip' || type === 'grid_2x3') {
    photosInStrip.value = new Array(maxPhotos.value).fill(undefined);
  } else {
    photosInStrip.value = [];
  }
  updateStripCaptureStep();
};

const uploadToImgBB = async () => {
  if (!photoData.value) return;
  isUploading.value = true;
  uploadedImageUrl.value = null;
  uploadError.value = null;
  try {
    const base64Image = photoData.value.split(',')[1];
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });
    const result = await response.json();
    if (response.ok && result.success) {
      uploadedImageUrl.value = result.data.url;
    } else {
      throw new Error(result.error?.message || result.error || 'Lỗi không xác định từ server');
    }
  } catch (error) {
    console.error('Lỗi khi tải ảnh:', error);
    uploadError.value = error.message;
    errorMessage.value = "Tải ảnh thất bại. Vui lòng kiểm tra console.";
  } finally {
    isUploading.value = false;
  }
};

const proceedToFinalize = async () => {
  await generateFinalImage(frameColor.value);
  currentStep.value = 'finalizing';
};


const generateFinalImage = async (backgroundColor) => {
  if (!areAllPhotosTaken.value) return;

  const canvas = canvasRef.value;
  const context = canvas.getContext('2d');
  const PADDING = 50;
  const BOTTOM_MARGIN = 150;

  context.setTransform(1, 0, 0, 1, 0, 0);

  const singleImgWidth = 1294;
  const singleImgHeight = 974;
  const stripImgWidth = 863;
  const stripImgHeight = 649;

  if (activeFrameType.value === 'single') {
    canvas.width = singleImgWidth + PADDING * 2;
    canvas.height = singleImgHeight + PADDING * 2 + BOTTOM_MARGIN;
    if (!selectedOverlayFrame.value) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    const firstImage = new Image();
    firstImage.src = photosInStrip.value[0];
    await new Promise(resolve => firstImage.onload = resolve);
    context.drawImage(firstImage, PADDING, PADDING, singleImgWidth, singleImgHeight);

  } else if (activeFrameType.value === 'strip') {
    const BORDER_WIDTH = 50;
    canvas.width = stripImgWidth + PADDING * 2;
    canvas.height = (stripImgHeight * 4) + (BORDER_WIDTH * 3) + PADDING * 2 + BOTTOM_MARGIN;
    if (!selectedOverlayFrame.value) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    for (let i = 0; i < 4; i++) {
      if (!photosInStrip.value[i]) continue;
      const img = new Image();
      img.src = photosInStrip.value[i];
      await new Promise(r => img.onload = r);
      const yPos = PADDING + (i * (stripImgHeight + BORDER_WIDTH));
      context.drawImage(img, PADDING, yPos, stripImgWidth, stripImgHeight);
    }
  } else if (activeFrameType.value === 'grid_2x3') {
    const BORDER_WIDTH = PADDING;
    canvas.width = (stripImgWidth * 2) + (BORDER_WIDTH * 3);
    canvas.height = (stripImgHeight * 3) + (BORDER_WIDTH * 4) + BOTTOM_MARGIN;
    if (!selectedOverlayFrame.value) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    for (let i = 0; i < 6; i++) {
      if (!photosInStrip.value[i]) continue;
      const img = new Image();
      img.src = photosInStrip.value[i];
      await new Promise(r => img.onload = r);
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xPos = (col * (stripImgWidth + BORDER_WIDTH)) + BORDER_WIDTH;
      const yPos = (row * (stripImgHeight + BORDER_WIDTH)) + BORDER_WIDTH;
      context.drawImage(img, xPos, yPos, stripImgWidth, stripImgHeight);
    }
  }
  
  if (selectedOverlayFrame.value) {
    const overlayImg = new Image();
    overlayImg.crossOrigin = "Anonymous";
    overlayImg.src = selectedOverlayFrame.value;
    await new Promise(r => overlayImg.onload = r);
    context.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
  }

  if (!selectedOverlayFrame.value) {
    const logo = new Image();
    logo.src = mascotBearLogo;
    await new Promise(r => logo.onload = r);
    const logoHeight = 100;
    const logoAspectRatio = logo.width / logo.height;
    const logoWidth = logoHeight * logoAspectRatio;
    const webName = 'SmileUp!';
    const textHeight = 25;
    const spaceBetweenLogoAndText = 5;
    const totalContentHeight = logoHeight + spaceBetweenLogoAndText + textHeight;
    const contentYStart = canvas.height - BOTTOM_MARGIN + (BOTTOM_MARGIN - totalContentHeight) / 2;
    const logoX = (canvas.width - logoWidth) / 2;
    const logoY = contentYStart;
    context.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    context.font = 'bold 25px Poppins, sans-serif';
    context.fillStyle = '#0369a1';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    const textY = logoY + logoHeight + spaceBetweenLogoAndText;
    context.fillText(webName, canvas.width / 2, textY);
  }

  photoData.value = canvas.toDataURL('image/png');
  stopCamera();
  uploadToImgBB();

  isDownloadReady.value = false;
  downloadCountdown.value = 5;
  if (downloadTimer) clearInterval(downloadTimer);
  downloadTimer = setInterval(() => {
    downloadCountdown.value--;
    if (downloadCountdown.value <= 0) {
      clearInterval(downloadTimer);
      isDownloadReady.value = true;
    }
  }, 1000);
};

watch([frameColor, selectedOverlayFrame], () => {
  if (currentStep.value === 'finalizing') {
    generateFinalImage(frameColor.value);
  }
});

const startCamera = async () => {
  isCameraOn.value = true;
  await nextTick(); 

  try {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1920 }, facingMode: 'user' },
      audio: false
    });
    const video = videoRef.value;
    if (video) {
      video.srcObject = stream;
      video.onplaying = () => {
        const visibleCanvas = previewCanvasRef.value;
        const processingCanvas = processingCanvasRef.value;
        if (visibleCanvas && processingCanvas) {
            const aspectRatio = video.videoWidth / video.videoHeight;
            visibleCanvas.width = visibleCanvas.clientWidth;
            visibleCanvas.height = visibleCanvas.clientWidth / aspectRatio;

            processingCanvas.width = 320;
            processingCanvas.height = 320 / aspectRatio;
        }
        renderVideoToCanvas();
      };
      await video.play();
    }
  } catch (error) {
    console.error("Lỗi Camera:", error);
    errorMessage.value = "Không thể truy cập camera. Vui lòng kiểm tra lại quyền và thiết bị.";
    isCameraOn.value = false;
  }
};

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  isCameraOn.value = false;
  stream = null;
};

const retakePhoto = () => {
  stopCamera();
  nextTick(() => {
    currentStep.value = 'capturing';
    photoData.value = null;
    reviewPreviewData.value = null;
    
    if (activeFrameType.value === 'strip' || activeFrameType.value === 'grid_2x3') {
      photosInStrip.value = new Array(maxPhotos.value).fill(undefined);
    } else {
      photosInStrip.value = [];
    }
    updateStripCaptureStep();
    
    startCamera();
  });
};

const captureFrame = () => {
  if (!videoRef.value || !canvasRef.value) return null;
  const video = videoRef.value;
  const canvas = canvasRef.value;
  const context = canvas.getContext('2d');
  
  const targetWidthSingle = 1294;
  const targetHeightSingle = 974;
  const targetWidthStrip = 863;
  const targetHeightStrip = 649;
  
  const currentCaptureWidth = activeFrameType.value === 'single' ? targetWidthSingle : targetWidthStrip;
  const currentCaptureHeight = activeFrameType.value === 'single' ? targetHeightSingle : targetHeightStrip;

  canvas.width = currentCaptureWidth;
  canvas.height = currentCaptureHeight;

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (videoWidth === 0 || videoHeight === 0) return null;
  
  const videoAspectRatio = videoWidth / videoHeight;
  const targetAspectRatio = currentCaptureWidth / currentCaptureHeight;

  let sx = 0, sy = 0, sWidth = videoWidth, sHeight = videoHeight;
  
  if (videoAspectRatio > targetAspectRatio) {
    sWidth = videoHeight * targetAspectRatio;
    sx = (videoWidth - sWidth) / 2;
  } else {
    sHeight = videoWidth / targetAspectRatio;
    sy = (videoHeight - sHeight) / 2;
  }
  
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, currentCaptureWidth, currentCaptureHeight);
  context.setTransform(1, 0, 0, 1, 0, 0);

  if (activeFilter.value !== 'filter-none') {
      let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      imageData = applyFilterToImageData(imageData, activeFilter.value);
      context.putImageData(imageData, 0, 0);
  }
  
  return canvas.toDataURL('image/png');
};

const runCaptureCycle = () => {
    if (isCapturing.value || !isCameraOn.value || areAllPhotosTaken.value) return;
    
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
            
            if (activeFrameType.value === 'single') {
                photosInStrip.value = [capturedPhoto];
            } else {
                photosInStrip.value[stripCaptureStep.value] = capturedPhoto;
            }
            updateStripCaptureStep();
            
            isCapturing.value = false;
            
            if (areAllPhotosTaken.value) {
                currentStep.value = 'reviewing';
                generateReviewPreview();
            } else if (isContinuousShooting.value) {
                captureLoopTimeout = setTimeout(runCaptureCycle, 1000);
            }
        }
    }, 1000);
};

const handlePrimaryCapture = () => {
  if (isCapturing.value) return;
  isContinuousShooting.value = false;
  if (captureLoopTimeout) clearTimeout(captureLoopTimeout);
  runCaptureCycle();
};

const toggleContinuousShooting = () => {
  if (activeFrameType.value === 'single' || areAllPhotosTaken.value) return;
  if (isCapturing.value && !isContinuousShooting.value) return; 
  isContinuousShooting.value = !isContinuousShooting.value;
  if (isContinuousShooting.value) {
    runCaptureCycle();
  } else {
    if (captureLoopTimeout) clearTimeout(captureLoopTimeout);
  }
};

const applyFilter = (filterClass) => {
  activeFilter.value = filterClass;
};

const triggerFileUpload = () => {
    fileInput.value.click();
};

const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageToCrop.value = e.target.result;
            isCropping.value = true;
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
};

watch(isCropping, (newVal) => {
    if (newVal) {
        nextTick(() => {
            if (cropImageRef.value) {
                cropperInstance = new Cropper(cropImageRef.value, {
                    aspectRatio: cropAspectRatio.value,
                    viewMode: 1,
                    background: false,
                    autoCropArea: 0.8,
                });
            }
        });
    } else {
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
    }
});

const confirmCrop = () => {
    if (!cropperInstance) return;
    const croppedImageData = cropperInstance.getCroppedCanvas().toDataURL('image/png');
    if (activeFrameType.value === 'single') {
        photosInStrip.value = [croppedImageData];
    } else {
        photosInStrip.value[stripCaptureStep.value] = croppedImageData;
    }
    updateStripCaptureStep();
    isCropping.value = false;
    if (areAllPhotosTaken.value) {
        currentStep.value = 'reviewing';
        generateReviewPreview();
    }
};

const cancelCrop = () => {
    isCropping.value = false;
};

selectFrame('single');

onUnmounted(() => {
  stopCamera();
  if (captureLoopTimeout) clearTimeout(captureLoopTimeout);
  if (downloadTimer) clearInterval(downloadTimer);
});
</script>

<template>
  <div class="starry-sky-bg relative flex flex-col items-center p-4 md:p-8 min-h-screen font-inter overflow-hidden">
    
    <!-- Starry Background -->
    <div class="static-stars-container parallax-sm pointer-events-none">
      <div v-for="(star, index) in staticStarsSmall" :key="`ss-sm-${index}`" class="static-star star-sm" :style="star.style"></div>
    </div>
    <div class="static-stars-container parallax-md pointer-events-none">
      <div v-for="(star, index) in staticStarsMedium" :key="`ss-md-${index}`" class="static-star star-md" :style="star.style"></div>
    </div>
    <div class="static-stars-container parallax-lg pointer-events-none">
      <div v-for="(star, index) in staticStarsLarge" :key="`ss-lg-${index}`" class="static-star star-lg" :style="star.style"></div>
    </div>
    
    <div class="w-full max-w-7xl flex flex-col md:flex-row gap-8 pt-8 relative z-10">
      
      <!-- Left Panel: Layout Selection -->
      <div class="w-full md:w-[280px] md:flex-shrink-0 flex flex-col">
        <div class="bg-white p-4 rounded-xl shadow-md">
          <h3 class="text-lg font-semibold text-sky-800 mb-3 text-center md:text-left">Chọn loại bố cục</h3>
          <div class="flex md:flex-col gap-4 justify-center">
            
            <div @click="selectFrame('single')" class="cursor-pointer group">
              <div 
                class="bg-white p-2 rounded-lg shadow-md border-2 transition-all"
                :class="[activeFrameType === 'single' ? 'border-sky-500 ring-2 ring-sky-300' : 'border-gray-200']"
              >
                <div class="w-24 h-32 bg-gray-300 rounded-sm mx-auto flex items-center justify-center overflow-hidden">
                  <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
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
                  <div v-for="i in 4" :key="i" class="h-1/4 border-b border-gray-300">
                    <svg class="w-full h-full text-gray-400 p-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                </div>
              </div>
              <p class="text-center mt-2 text-sm font-medium" :class="[activeFrameType === 'strip' ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-500']">Dải 4 ảnh</p>
            </div>

            <div @click="selectFrame('grid_2x3')" class="cursor-pointer group">
              <div 
                class="bg-white p-2 rounded-lg shadow-md border-2 transition-all"
                :class="[activeFrameType === 'grid_2x3' ? 'border-sky-500 ring-2 ring-sky-300' : 'border-gray-200']"
              >
                <div class="w-24 h-36 bg-gray-200 rounded-sm mx-auto grid grid-cols-2 grid-rows-3 gap-1 p-1">
                    <div v-for="i in 6" :key="i" class="bg-gray-300">
                        <svg class="w-full h-full text-gray-400 p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                </div>
              </div>
              <p class="text-center mt-2 text-sm font-medium" :class="[activeFrameType === 'grid_2x3' ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-500']">Lưới 2x3 (6 ảnh)</p>
            </div>

          </div>
        </div>

        <div v-if="isCameraOn && currentStep === 'capturing'" class="bg-white p-4 rounded-xl shadow-md mt-6">
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

      <!-- Right Panel: Camera View and Controls -->
      <div class="w-full md:flex-1">
        <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-sky-200">
          
          <!-- Main Display Area -->
          <div 
            class="relative w-full bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center mb-6 shadow-inner mx-auto"
            :style="{ aspectRatio: '1294 / 974' }"
          >
            <!-- Finalizing Step -->
            <img v-if="currentStep === 'finalizing'" :src="photoData" alt="Ảnh đã hoàn thành" class="w-full h-full object-contain bg-transparent">
            
            <!-- Reviewing Step -->
            <img v-else-if="currentStep === 'reviewing'" :src="reviewPreviewData" alt="Xem lại ảnh" class="w-full h-full object-contain bg-gray-900">

            <!-- Capturing Step -->
            <template v-else-if="isCameraOn">
                <video ref="videoRef" autoplay playsinline muted class="hidden"></video>
                <canvas ref="previewCanvasRef" class="w-full h-full object-cover"></canvas>
            </template>

            <!-- Camera Off -->
            <div v-else class="h-full flex flex-col items-center justify-center text-center text-white p-4">
              <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <p class="mt-2 font-medium">Camera đang tắt</p>
              <p class="text-sm text-gray-300">Nhấn "Bật Camera" để bắt đầu</p>
            </div>

            <div v-if="countdown > 0" class="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-9xl font-bold z-20">{{ countdown }}</div>
          </div>
          
          <!-- Thumbnails for Strip/Grid -->
          <div v-if="activeFrameType !== 'single' && currentStep !== 'finalizing'" class="mb-6">
            <div class="grid gap-2 grid-cols-4 md:grid-cols-6">
                <div v-for="i in maxPhotos" :key="i" class="relative aspect-square bg-gray-200 rounded-md flex items-center justify-center" :class="{'ring-2 ring-pink-500 ring-inset': currentStep === 'capturing' && stripCaptureStep === i - 1}">
                    <img v-if="photosInStrip[i-1]" :src="photosInStrip[i-1]" class="w-full h-full object-cover rounded-md">
                    <span v-else class="text-gray-400 font-bold text-2xl">{{ i }}</span>
                     <button v-if="photosInStrip[i-1]" @click.stop="deletePhoto(i-1)" class="delete-photo-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
          </div>

          <canvas ref="canvasRef" class="hidden"></canvas>
          <canvas ref="processingCanvasRef" class="hidden"></canvas>

          <!-- Filters (Only show during capture) -->
          <div v-if="isCameraOn && currentStep === 'capturing'" class="mb-6">
              <div class="flex space-x-4 overflow-x-auto pb-3 -mx-2 px-2">
                <div v-for="filter in filters" :key="filter.class" @click="applyFilter(filter.class)" class="flex-shrink-0 cursor-pointer text-center group">
                  <div class="w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200" :class="[activeFilter === filter.class ? 'border-sky-500 ring-2 ring-sky-300' : 'border-transparent']">
                    <img :src="previewImage" :class="filter.class" class="w-full h-full object-cover" alt="Preview bộ lọc">
                  </div>
                  <p class="mt-1.5 text-xs font-semibold transition-colors duration-200" :class="[activeFilter === filter.class ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-500']">{{ filter.name }}</p>
                </div>
              </div>
            </div>
          
          <!-- Controls -->
          <div class="flex flex-col justify-center items-center gap-4">
        
            <div class="flex flex-wrap justify-center items-center gap-4">
              <!-- Step 1: Not started or Capturing -->
              <template v-if="currentStep === 'capturing'">
                <button v-if="!isCameraOn" @click="startCamera" class="w-full sm:w-auto px-8 py-3 bg-sky-500 text-white font-semibold rounded-full hover:bg-sky-600 transition-all duration-300 shadow-md transform hover:scale-105">Bật Camera</button>
                <template v-else>
                    <button :disabled="isCapturing || areAllPhotosTaken" @click="handlePrimaryCapture" class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105" :class="{'animate-pulse': isCapturing && !isContinuousShooting}">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span>{{ captureButtonText }}</span>
                    </button>

                    <button v-if="activeFrameType !== 'single' && !areAllPhotosTaken" @click="toggleContinuousShooting" class="w-full sm:w-auto px-6 py-3 font-semibold rounded-full transition-all duration-300 shadow-md transform hover:scale-105" :class="[isContinuousShooting ? 'bg-purple-600 text-white animate-pulse' : 'bg-gray-200 text-gray-800 hover:bg-gray-300']" :disabled="isCapturing && !isContinuousShooting">
                      {{ isContinuousShooting ? 'Dừng chụp' : 'Chụp liên tục' }}
                    </button>
                    <button @click="triggerFileUpload" class="w-full sm:w-auto px-8 py-3 bg-sky-500 text-white font-semibold rounded-full hover:bg-sky-600 transition-all duration-300 shadow-md transform hover:scale-105" :disabled="areAllPhotosTaken">Tải ảnh lên</button>
                </template>
              </template>
              
              <!-- Step 2: Reviewing Photo -->
              <template v-if="currentStep === 'reviewing'">
                  <button @click="retakePhoto" class="px-6 py-3 bg-gray-500 text-white font-semibold rounded-full hover:bg-gray-600 transition-all duration-300 shadow-md">Chụp lại</button>
                  <button @click="proceedToFinalize" class="px-8 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-all duration-300 shadow-md transform hover:scale-105">
                    Tiếp tục
                  </button>
              </template>
              
              <!-- Step 3: Finalizing (Frame selection, download) -->
              <template v-if="currentStep === 'finalizing'">
                <button @click="retakePhoto" class="px-6 py-3 bg-gray-500 text-white font-semibold rounded-full hover:bg-gray-600 transition-all duration-300 shadow-md">Chụp lại</button>
                
                <div class="flex items-center gap-3 bg-gray-200 p-2 rounded-full shadow-inner">
                  <label for="frameColor" class="text-sm font-medium text-gray-700 pl-2">Màu nền:</label>
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

            <!-- Frame Selection (Only show during finalization) -->
            <div v-if="currentStep === 'finalizing'" class="w-full bg-gray-100 p-4 rounded-lg mt-4">
              <h4 class="text-sm font-semibold text-gray-800 mb-3 text-center">Chọn khung trang trí</h4>
              <div class="flex flex-wrap justify-center gap-4">
                <div @click="selectedOverlayFrame = null" class="cursor-pointer text-center group">
                  <div class="w-24 h-24 rounded-lg flex items-center justify-center bg-gray-300 border-2 transition-all" :class="!selectedOverlayFrame ? 'border-sky-500 ring-2 ring-sky-300' : 'border-gray-400 group-hover:border-sky-400'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  </div>
                  <p class="text-xs mt-1.5 font-medium" :class="!selectedOverlayFrame ? 'text-sky-600' : 'text-gray-600'">Không</p>
                </div>
                <div v-for="frameUrl in availableFrames[activeFrameType]" :key="frameUrl" @click="selectedOverlayFrame = frameUrl" class="cursor-pointer text-center group">
                  <img :src="frameUrl" class="w-24 h-24 object-contain rounded-lg border-2 bg-white transition-all" :class="selectedOverlayFrame === frameUrl ? 'border-sky-500 ring-2 ring-sky-300' : 'border-gray-300 group-hover:border-sky-400'">
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Cropping Modal -->
    <div v-if="isCropping" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
        <h3 class="text-xl font-semibold mb-4">Cắt ảnh</h3>
        <div class="max-h-[60vh]">
          <img ref="cropImageRef" :src="imageToCrop" alt="Image to crop" class="max-w-full">
        </div>
        <div class="flex justify-end gap-4 mt-4">
          <button @click="cancelCrop" class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">Hủy</button>
          <button @click="confirmCrop" class="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition">Xác nhận</button>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input type="file" ref="fileInput" @change="onFileChange" accept="image/*" class="hidden">
  </div>
</template>

<style scoped>
@import 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css';

/* These CSS filters are now only for the small preview images in the UI */
.filter-beautify { 
  filter: brightness(1.1) saturate(1.15);
}
.filter-none { filter: none; }
.filter-grayscale { filter: grayscale(100%); }
.filter-sepia { filter: sepia(100%); }
.filter-contrast { filter: contrast(150%); }
.filter-vintage { filter: sepia(65%) contrast(95%) brightness(90%) saturate(120%); }
.filter-summer { filter: saturate(140%) brightness(110%) contrast(110%); }


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

.starry-sky-bg {
  background: white;
}

.static-stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.static-star {
  position: absolute;
  background-color: #0ea5e9;
  border-radius: 50%;
  animation-name: twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
.star-sm { opacity: 0.4; }
.star-md { opacity: 0.6; }
.star-lg { opacity: 0.8; }


@keyframes twinkle {
  0%, 100% {
    opacity: 0.2;
    box-shadow: 0 0 2px 0px rgba(14, 165, 233, 0.5);
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 6px 2px rgba(14, 165, 233, 0.7);
    transform: scale(1);
  }
}

.delete-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  z-index: 10;
}
.delete-photo-btn:hover {
  opacity: 1;
  background-color: rgba(239, 68, 68, 1);
}
</style>
