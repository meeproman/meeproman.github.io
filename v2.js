const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const recaptureBtn = document.getElementById('recaptureBtn');
const randomBtn = document.getElementById('randomBtn');
const modal = document.getElementById('modal');
const closeModal = document.querySelector('.close-modal');
const selectedFaceCanvas = document.getElementById('selectedFace');
const cameraSelect = document.getElementById('cameraSelect');

let detectedFaces = [];
let capturedImageData = null;
let isCaptureModeActive = true;
let currentStream = null;

// Initialize face-api models
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
]).then(initializeApp);

async function initializeApp() {
  await loadAvailableCameras();
  if (cameraSelect.options.length > 0) {
    startVideo(cameraSelect.value);
  }
}

async function loadAvailableCameras() {
    try {
      // Request access to the camera first
      await navigator.mediaDevices.getUserMedia({ video: true });
  
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
  
      // Clear the dropdown
      cameraSelect.innerHTML = '';
  
      // Add all video devices to the dropdown
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
  
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
    };
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      currentStream = stream;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true'); // Prevent fullscreen on iOS
      video.play();
  
      video.onloadedmetadata = () => {
        canvas.width = video.offsetWidth;
        canvas.height = video.offsetHeight;
      };
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  }
  
  

// Event listener for camera selection
cameraSelect.addEventListener('change', (event) => {
  if (isCaptureModeActive) {
    startVideo(event.target.value);
  }
});

captureBtn.addEventListener('click', async () => {
  const ctx = canvas.getContext('2d');
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
  
  // Stop the video stream
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

// resize canvas when window is resized
window.addEventListener('resize', () => {
    if (video) {
      canvas.width = video.offsetWidth;
      canvas.height = video.offsetHeight;
      if (capturedImageData) {
        drawDetections();
      }
    }
  });