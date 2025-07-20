const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const stream = require('stream');
const { pipeline } = require('stream/promises');

// Use direct CDN links that don't redirect
const MODEL_FILES = [
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/tiny_face_detector_model-weights_manifest.json',
    size: 149
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/tiny_face_detector_model-shard1',
    size: 1904193
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/face_landmark_68_model-weights_manifest.json',
    size: 159
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/face_landmark_68_model-shard1',
    size: 3846739
  }
];

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

async function downloadFile(url, filePath) {
  console.log(`Downloading ${url} to ${filePath}...`);
  
  const response = await new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return downloadFile(res.headers.location, filePath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      resolve(res);
    });
    
    req.on('error', reject);
    req.end();
  });

  const fileStream = fs.createWriteStream(filePath);
  await pipeline(response, fileStream);
  
  console.log(`✓ Downloaded ${filePath}`);
  return true;
}

function verifyFile(filePath, expectedSize) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    const stats = fs.statSync(filePath);
    if (stats.size !== expectedSize) {
      console.log(`File size mismatch for ${path.basename(filePath)}: expected ${expectedSize} bytes, got ${stats.size} bytes`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error verifying file ${filePath}:`, err.message);
    return false;
  }
}

async function ensureModels() {
  try {
    // Create models directory if it doesn't exist
    if (!fs.existsSync(MODELS_DIR)) {
      fs.mkdirSync(MODELS_DIR, { recursive: true });
      console.log(`Created directory: ${MODELS_DIR}`);
    }

    let allSuccess = true;
    
    // Check and download each model file
    for (const file of MODEL_FILES) {
      const filePath = path.join(MODELS_DIR, file.name);
      const fileExists = await verifyFile(filePath, file.size);
      
      if (!fileExists) {
        console.log(`\n❌ ${file.name} is missing or corrupted`);
        console.log(`   Downloading from: ${file.url}`);
        try {
          await downloadFile(file.url, filePath);
          // Verify the downloaded file
          const isValid = await verifyFile(filePath, file.size);
          if (isValid) {
            console.log(`✓ Successfully downloaded and verified ${file.name}`);
          } else {
            console.error(`❌ Downloaded file ${file.name} is invalid`);
            allSuccess = false;
          }
        } catch (error) {
          console.error(`❌ Failed to download ${file.name}:`, error.message);
          allSuccess = false;
        }
      } else {
        console.log(`✓ ${file.name} is already downloaded and valid`);
      }
    }

    if (allSuccess) {
      console.log('\n✅ All model files are ready!');
    } else {
      console.log('\n⚠️ Some model files may not have downloaded correctly. Check the logs above.');
    }
    
    return allSuccess;
  } catch (error) {
    console.error('\n❌ Error ensuring model files:', error.message);
    return false;
  }
}

// Run the script
ensureModels().then(success => {
  process.exit(success ? 0 : 1);
});
