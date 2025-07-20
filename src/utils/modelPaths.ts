/**
 * Utility to handle model paths in Next.js
 * Helps with loading models from the correct path in both development and production
 */

export const getModelPath = (): string => {
  // In development, we can use the public directory directly
  if (process.env.NODE_ENV === 'development') {
    return '/models';
  }
  
  // In production, use the basePath if it's set in next.config.js
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}/models`;
};

export const MODEL_PATHS = {
  TINY_FACE_DETECTOR: getModelPath(),
  FACE_LANDMARK_68_NET: getModelPath(),
  // Add other models here if needed
};
