import * as faceapi from 'face-api.js';

// Base URL for model files
const getModelBaseUrl = () => {
  // In development, use absolute path from the public directory
  if (process.env.NODE_ENV === 'development') {
    return '/models';
  }
  // In production, use relative path since we copied models to the out directory
  return './models';
};

/**
 * Utility function to load face-api.js models with better error handling
 */
export async function loadFaceApiModels() {
  const modelPath = getModelBaseUrl();
  
  try {
    console.log(`[Model Loader] Starting model loading from: ${modelPath}`);
    console.log(`[Model Loader] Current environment: ${process.env.NODE_ENV}`);
    
    // First, verify the model files are accessible
    console.log('[Model Loader] Verifying model files...');
    
    // Try to fetch the manifest files to verify they're accessible
    const manifestUrls = [
      `${modelPath}/tiny_face_detector_model-weights_manifest.json`,
      `${modelPath}/face_landmark_68_model-weights_manifest.json`
    ];
    
    console.log('[Model Loader] Checking model manifests at:', manifestUrls);
    
    const manifestChecks = await Promise.allSettled(
      manifestUrls.map(url => 
        fetch(url).then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
      )
    );
    
    // Log manifest check results
    manifestChecks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`[Model Loader] Successfully loaded manifest: ${manifestUrls[index]}`);
      } else {
        console.error(`[Model Loader] Failed to load manifest ${manifestUrls[index]}:`, result.reason);
      }
    });
    
    // If any manifest failed to load, throw an error
    const failedManifests = manifestChecks.filter(r => r.status === 'rejected');
    if (failedManifests.length > 0) {
      throw new Error(`Failed to load ${failedManifests.length} model manifest(s). Check console for details.`);
    }
    
    // Now load the actual models with retry logic
    const loadWithRetry = async (loader: () => Promise<void>, name: string, maxRetries = 2) => {
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Model Loader] Loading ${name} (attempt ${attempt}/${maxRetries})...`);
          await loader();
          console.log(`[Model Loader] ${name} loaded successfully`);
          return true;
        } catch (err) {
          lastError = err as Error;
          console.warn(`[Model Loader] Attempt ${attempt} failed for ${name}:`, err);
          if (attempt < maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      throw lastError || new Error(`Failed to load ${name} after ${maxRetries} attempts`);
    };
    
    // Load models with retry
    await loadWithRetry(
      () => faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      'TinyFaceDetector'
    );
    
    await loadWithRetry(
      () => faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      'FaceLandmark68Net'
    );
    
    console.log('[Model Loader] All models loaded successfully');
    return true;
  } catch (error) {
    console.error('[Model Loader] Error loading models:', error);
    
    // Log additional debugging information
    if (typeof window !== 'undefined') {
      console.log('[Model Loader] Current URL:', window.location.href);
      console.log('[Model Loader] Current path:', window.location.pathname);
    }
    console.log('[Model Loader] Model path:', modelPath);
    console.log('[Model Loader] Environment:', process.env.NODE_ENV);
    
    // Try to determine the issue
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
        console.error('[Model Loader] Network error - the model files could not be loaded.');
        console.error('[Model Loader] Please check if the model files exist in the public/models directory.');
      }
      throw new Error(`Failed to load face detection models: ${error.message}`);
    }
    
    throw new Error('An unknown error occurred while loading models');
  }
}

/**
 * Utility to verify if models are loaded
 */
export function areModelsLoaded(): boolean {
  try {
    const isTinyLoaded = faceapi.nets.tinyFaceDetector?.isLoaded ?? false;
    const isLandmarkLoaded = faceapi.nets.faceLandmark68Net?.isLoaded ?? false;
    
    if (!isTinyLoaded || !isLandmarkLoaded) {
      console.warn('[Model Loader] Some models are not loaded:', {
        tinyFaceDetector: isTinyLoaded,
        faceLandmark68Net: isLandmarkLoaded
      });
    }
    
    return isTinyLoaded && isLandmarkLoaded;
  } catch (error) {
    console.error('[Model Loader] Error checking if models are loaded:', error);
    return false;
  }
}

/**
 * Utility to get the current model paths for debugging
 */
export function getModelPaths() {
  return {
    basePath: getModelBaseUrl(),
    tinyFaceDetector: `${getModelBaseUrl()}/tiny_face_detector_model-weights_manifest.json`,
    faceLandmark68: `${getModelBaseUrl()}/face_landmark_68_model-weights_manifest.json`
  };
}
