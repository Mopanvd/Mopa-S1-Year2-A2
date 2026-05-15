const video = document.querySelector("#custom-video-player");
const playPauseImg = document.querySelector("#play-pause-img");
const progressBar = document.querySelector("#progress-bar-fill");
const progressBarContainer = document.querySelector(".progress-bar");
const volumeIcon = document.querySelector("#volume-icon"); // Get volume icon element
let isDragging = false; // Flag to track if user is dragging the progress bar
let isMuted = false; // Flag to track if video is muted

// Audio visualization variables
let audioContext = null;
let analyser = null;
let frequencyData = null;
let animationId = null;

video.crossOrigin = "anonymous";

video.removeAttribute("controls");
video.addEventListener("timeupdate", updateProgressBar); // Update progress bar in real-time as video plays
video.addEventListener("play", startAudioVisualizer); // Start audio visualization when video plays
video.addEventListener("pause", stopAudioVisualizer); // Stop visualization when video pauses
video.addEventListener("ended", stopAudioVisualizer); // Stop visualization when video ends
progressBarContainer.addEventListener("click", seekVideo); // Seek video when clicking on progress bar
progressBarContainer.addEventListener("mousedown", startDrag); // Start dragging when mouse down on progress bar
document.addEventListener("mousemove", drag); // Update progress as mouse moves
document.addEventListener("mouseup", stopDrag); // Stop dragging when mouse is released

function togglePlayPause() {
  if (video.paused || video.ended) {
    video.play();
    playPauseImg.src = "https://img.icons8.com/ios-glyphs/30/pause--v1.png";
  } else {
    video.pause();
    playPauseImg.src = "https://img.icons8.com/ios-glyphs/30/play--v1.png";
  }
}
// 全屏切换功能
function toggleFullScreen() {
    // 关键点：获取整个播放器容器，而不是单纯的 video 标签
    const playerContainer = document.querySelector('.media-player');

    // 检查当前是否已经是全屏状态
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // 进入全屏 (兼容不同浏览器)
        if (playerContainer.requestFullscreen) {
            playerContainer.requestFullscreen();
        } else if (playerContainer.webkitRequestFullscreen) { /* Safari */
            playerContainer.webkitRequestFullscreen();
        } else if (playerContainer.msRequestFullscreen) { /* IE11 */
            playerContainer.msRequestFullscreen();
        }
    } else {
        // 退出全屏 (兼容不同浏览器)
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
}

function updateProgressBar() {
  // Update progress bar in real-time (skip if dragging to avoid conflicts)
  if (!isDragging) {
    const value = (video.currentTime / video.duration) * 100;
    progressBar.style.width = value + "%";
  }
}

function seekVideo(e) {
  // Jump to specific time by clicking progress bar
  const rect = progressBarContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left; // Calculate click position relative to progress bar
  const percentage = clickX / rect.width; // Calculate percentage of click position on progress bar
  video.currentTime = percentage * video.duration; // Set video time
}

function startDrag(e) {
  // Start dragging progress bar
  isDragging = true;
  updateProgressBarOnDrag(e);
}

function drag(e) {
  // Update progress bar while dragging
  if (isDragging) {
    updateProgressBarOnDrag(e);
  }
}

function updateProgressBarOnDrag(e) {
  // Update progress bar and video time during drag
  const rect = progressBarContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left; // Get mouse position relative to progress bar
  const percentage = Math.max(0, Math.min(1, clickX / rect.width)); // Ensure percentage is between 0 and 1
  video.currentTime = percentage * video.duration; // Set video playback time
  progressBar.style.width = (percentage * 100) + "%"; // Update progress bar width
}

function stopDrag() {
  // Stop dragging progress bar
  isDragging = false;
}

function toggleMute() {
  // Toggle mute: switch between muted and unmuted states
  if (isMuted) {
    // Unmute: restore volume and change icon to yellow
    video.muted = false;
    volumeIcon.src = "https://img.icons8.com/?size=100&id=reqgj3e1uKBy&format=png&color=FFFF00";
    isMuted = false;
  } else {
    // Mute: silence video and change icon to yellow mute icon
    video.muted = true;
    volumeIcon.src = "https://img.icons8.com/?size=100&id=91635&format=png&color=FFFF00";
    isMuted = true;
  }
}

function startAudioVisualizer() {
  // Initialize audio analyzer on first play, then start animation loop
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(video);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Use 256 bins for frequency analysis
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      analyser.connect(audioContext.destination); // Connect analyser to destination for audio output
    } catch (error) {
      console.error("Audio context error:", error);
      return;
    }
  }

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  if (!animationId) {
    animateAudioBackground();
  }
}

function animateAudioBackground() {
  // Read frequency data and change background color based on different frequency bands
  if (!analyser) return;
  
  analyser.getByteFrequencyData(frequencyData);
  
  // Split frequency data into three bands: low, mid, high
  const bandSize = Math.floor(frequencyData.length / 3);
  
  // Low frequency band (0-1/3): controls Red
  const lowFreq = frequencyData.slice(0, bandSize).reduce((sum, value) => sum + value, 0) / bandSize;
  
  // Mid frequency band (1/3-2/3): controls Green
  const midFreq = frequencyData.slice(bandSize, bandSize * 2).reduce((sum, value) => sum + value, 0) / bandSize;
  
  // High frequency band (2/3-1): controls Blue
  const highFreq = frequencyData.slice(bandSize * 2).reduce((sum, value) => sum + value, 0) / bandSize;
  
  // Map frequency values (0-255) to RGB values (0-255)
  const blue = Math.min(255, Math.round(lowFreq * 1.4)); 
  const green = Math.min(255, Math.round(midFreq * 1.7));
  const red = Math.min(255, Math.round(highFreq * 2.2));
  
  document.body.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;

  animationId = requestAnimationFrame(animateAudioBackground);
  // Adjusted color mapping to enhance visual effect based on frequency intensity
} 


function changeVideo(newVideoSrc) { // Function to change video source and update play/pause button state
    const videoPlayer = document.getElementById('custom-video-player');
    const playPauseImg = document.getElementById('play-pause-img');
    
    // Change video source to new video URL
    videoPlayer.src = newVideoSrc;
    
    // Load and play the new video
    videoPlayer.load();
    videoPlayer.play();
    
    // Update play/pause button to show pause icon since new video is playing
    // Ensure the pause icon link matches your existing project
    if (playPauseImg) {
        playPauseImg.src = "https://img.icons8.com/ios-glyphs/30/pause--v1.png"; 
    }
}

function stopAudioVisualizer() {
  // Stop the animation loop
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
