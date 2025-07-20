const fs = require('fs');
const path = require('path');
const https = require('https');
const { pipeline } = require('stream/promises');
const { promisify } = require('util');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

// Model files from the official face-api.js repository
const MODEL_FILES = [
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/HEAD/weights/tiny_face_detector_model-weights_manifest.json',
    size: 149
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/HEAD/weights/tiny_face_detector_model-shard1',
    size: 1904193
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/HEAD/weights/face_landmark_68_model-weights_manifest.json',
    size: 159
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/HEAD/weights/face_landmark_68_model-shard1',
    size: 3846739
  }
];

async function downloadFile(url, filePath) {
  console.log(`Downloading ${url}...`);
  
  const response = await new Promise((resolve, reject) => {
    const req = https.get(url, resolve);
    req.on('error', reject);
  });

  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`);
  }

  const fileStream = fs.createWriteStream(filePath);
  await pipeline(response, fileStream);
  console.log(`✓ Downloaded ${path.basename(filePath)}`);
}

async function setupModels() {
  try {
    // Create models directory
    if (!fs.existsSync(MODELS_DIR)) {
      fs.mkdirSync(MODELS_DIR, { recursive: true });
      console.log(`Created directory: ${MODELS_DIR}`);
    }

    // Download each model file
    for (const file of MODEL_FILES) {
      const filePath = path.join(MODELS_DIR, file.name);
      
      try {
        await downloadFile(file.url, filePath);
        console.log(`✓ Successfully downloaded ${file.name}`);
      } catch (error) {
        console.error(`❌ Failed to download ${file.name}:`, error.message);
        throw error; // Stop on any error
      }
    }

    console.log('\n✅ All model files have been downloaded successfully!');
    console.log(`Models are available at: ${MODELS_DIR}`);
    
  } catch (error) {
    console.error('\n❌ Error setting up model files:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupModels();
