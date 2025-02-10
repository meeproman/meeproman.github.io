const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const recaptureBtn = document.getElementById('recaptureBtn');
const randomBtn = document.getElementById('randomBtn');
const modal = document.getElementById('modal');
const closeModal = document.querySelector('.close-modal');
const selectedFaceCanvas = document.getElementById('selectedFace');
const cameraSelect = document.getElementById('cameraSelect');

// Add resolution select element to the controls div
const resolutionSelect = document.createElement('select');
resolutionSelect.id = 'resolutionSelect';
const controlsDiv = document.querySelector('.controls');
controlsDiv.insertBefore(resolutionSelect, captureBtn);

// Common resolution presets
const resolutions = [
  { label: '4K (2160p)', width: 3840, height: 2160 },
  { label: 'Full HD (1080p)', width: 1920, height: 1080 },
  { label: 'HD (720p)', width: 1280, height: 720 },
  { label: 'VGA (480p)', width: 640, height: 480 }
];

let detectedFaces = [];
let capturedImageData = null;
let isCaptureModeActive = true;
let currentStream = null;
let currentDeviceId = '';

// Initialize face-api models
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
]).then(initializeApp);

async function populateResolutions() {
  resolutionSelect.innerHTML = '<option value="">กำลังโหลดความละเอียด...</option>';
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    stream.getTracks().forEach(track => track.stop());

    resolutionSelect.innerHTML = '';
    
    // Filter resolutions based on device capabilities
    const availableResolutions = resolutions.filter(res => {
      return (!capabilities.width || res.width <= capabilities.width.max) &&
             (!capabilities.height || res.height <= capabilities.height.max);
    });

    availableResolutions.forEach(res => {
      const option = document.createElement('option');
      option.value = `${res.width}x${res.height}`;
      option.text = res.label;
      resolutionSelect.appendChild(option);
    });

    // Select the highest resolution by default
    if (resolutionSelect.options.length > 0) {
      resolutionSelect.selectedIndex = 0;
    }
  } catch (err) {
    console.error('Error getting camera capabilities:', err);
    // Fallback to default resolutions if capabilities API fails
    resolutions.forEach(res => {
      const option = document.createElement('option');
      option.value = `${res.width}x${res.height}`;
      option.text = res.label;
      resolutionSelect.appendChild(option);
    });
  }
}

async function initializeApp() {
  await loadAvailableCameras();
  await populateResolutions();
  if (cameraSelect.options.length > 0) {
    startVideo(cameraSelect.value);
  }
}

async function loadAvailableCameras() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    cameraSelect.innerHTML = '';
    videoDevices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Camera ${cameraSelect.options.length + 1}`;
      cameraSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading cameras:', err);
  }
}

async function startVideo(deviceId = '') {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  currentDeviceId = deviceId;
  const [width, height] = resolutionSelect.value.split('x').map(Number);

  const constraints = {
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: width },
      height: { ideal: height },
      facingMode: deviceId ? undefined : 'environment'
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');

    // Get actual stream settings
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    console.log('Actual camera settings:', settings);

    video.onloadedmetadata = () => {
      // Set canvas size to match actual video dimensions
      canvas.width = settings.width;
      canvas.height = settings.height;
    };

    await video.play();
  } catch (err) {
    console.error('Error accessing camera:', err);
    // Fallback to basic constraints if resolution is not supported
    try {
      const basicStream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      });
      currentStream = basicStream;
      video.srcObject = basicStream;
      video.setAttribute('playsinline', 'true');
      await video.play();
    } catch (fallbackErr) {
      console.error('Fallback camera access failed:', fallbackErr);
    }
  }
}

// Event listeners for camera and resolution selection
cameraSelect.addEventListener('change', (event) => {
  if (isCaptureModeActive) {
    startVideo(event.target.value);
  }
});

resolutionSelect.addEventListener('change', () => {
  if (isCaptureModeActive) {
    startVideo(currentDeviceId);
  }
});

captureBtn.addEventListener('click', async () => {
  const ctx = canvas.getContext('2d');
  
  // Ensure canvas dimensions match video dimensions
  const track = currentStream.getVideoTracks()[0];
  const settings = track.getSettings();
  canvas.width = settings.width;
  canvas.height = settings.height;
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const detections = await faceapi.detectAllFaces(canvas, new faceapi.SsdMobilenetv1Options({
    minConfidence: 0.3
  })).withFaceLandmarks();
  
  detectedFaces = detections;
  drawDetections();
  
  captureBtn.style.display = 'none';
  recaptureBtn.style.display = 'inline-block';
  randomBtn.style.display = 'inline-block';
  isCaptureModeActive = false;
  
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
});

function drawDetections() {
  if (!capturedImageData) return;
  
  const ctx = canvas.getContext('2d');
  ctx.putImageData(capturedImageData, 0, 0);
  
  detectedFaces.forEach((detection, index) => {
    const box = detection.detection.box;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px Arial';
    ctx.fillText(index + 1, box.x, box.y - 5);
  });
}

function animateRandomSelection() {
  return new Promise(resolve => {
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      if (!capturedImageData) {
        clearInterval(interval);
        return;
      }
      const ctx = canvas.getContext('2d');
      ctx.putImageData(capturedImageData, 0, 0);
      
      const randomIndex = Math.floor(Math.random() * detectedFaces.length);
      const detection = detectedFaces[randomIndex];
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 10;
      ctx.strokeRect(
        detection.detection.box.x,
        detection.detection.box.y,
        detection.detection.box.width,
        detection.detection.box.height
      );
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        resolve(randomIndex);
      }
    }, 250);
  });
}

randomBtn.addEventListener('click', async () => {
  if (detectedFaces.length === 0) {
    alert('No faces detected!');
    return;
  }
  
  const selectedIndex = await animateRandomSelection();
  const selectedFace = detectedFaces[selectedIndex];
  
  const box = selectedFace.detection.box;
  
  // Calculate new dimensions maintaining aspect ratio within 400px width
  const aspectRatio = box.width / box.height;
  const newWidth = 400;
  const newHeight = Math.round(newWidth / aspectRatio);
  
  selectedFaceCanvas.width = newWidth;
  selectedFaceCanvas.height = newHeight;
  const selectedCtx = selectedFaceCanvas.getContext('2d');
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(capturedImageData, 0, 0);
  
  selectedCtx.drawImage(
    tempCanvas,
    box.x, box.y, box.width, box.height,
    0, 0, newWidth, newHeight
  );
  
  modal.style.display = 'flex';
  drawDetections();
});

recaptureBtn.addEventListener('click', () => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  startVideo(cameraSelect.value);
  
  captureBtn.style.display = 'inline-block';
  recaptureBtn.style.display = 'none';
  randomBtn.style.display = 'none';
  isCaptureModeActive = true;
  detectedFaces = [];
  capturedImageData = null;
});

closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
  drawDetections();
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
    drawDetections();
  }
});

// Update canvas size when window is resized while maintaining aspect ratio
window.addEventListener('resize', () => {
  if (video && capturedImageData) {
    const aspectRatio = capturedImageData.width / capturedImageData.height;
    const newWidth = video.offsetWidth;
    const newHeight = newWidth / aspectRatio;
    
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    drawDetections();
  }
});