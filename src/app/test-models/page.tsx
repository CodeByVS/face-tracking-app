'use client';

import { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { loadFaceApiModels, areModelsLoaded, getModelPaths } from '@/utils/modelLoader';

export default function TestModels() {
  const [status, setStatus] = useState('Initializing model loader...');
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelPaths, setModelPaths] = useState<ReturnType<typeof getModelPaths> | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});

  useEffect(() => {
    // Initialize debug information
    const paths = getModelPaths();
    setModelPaths(paths);
    
    const updateDebugInfo = () => {
      setDebugInfo({
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
        environment: process.env.NODE_ENV,
        modelPaths: paths,
        modelsLoaded: areModelsLoaded(),
        timestamp: new Date().toISOString()
      });
    };
    
    updateDebugInfo();
    
    const testModels = async () => {
      try {
        setStatus('Starting model loading process...');
        updateDebugInfo();
        
        // Load the models using our utility
        await loadFaceApiModels();
        updateDebugInfo();
        
        // Verify models are loaded
        if (areModelsLoaded()) {
          setStatus('All models loaded successfully!');
          setIsLoading(false);
          updateDebugInfo();
          
          // Test if models are working
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            
            setStatus('Testing face detection with dummy canvas...');
            updateDebugInfo();
            
            const detections = await faceapi.detectAllFaces(
              canvas,
              new faceapi.TinyFaceDetectorOptions()
            );
            
            console.log('Test detections:', detections);
            updateDebugInfo();
            setStatus(` Models loaded and working! Detected ${detections.length} faces in test.`);
          } catch (testError) {
            console.warn('Test detection warning:', testError);
            updateDebugInfo();
            setStatus(' Models loaded but test detection failed. Check console for details.');
          }
        } else {
          throw new Error('Models did not load correctly');
        }
      } catch (err) {
        console.error('Error in testModels:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during model testing.';
        setError(new Error(errorMessage));
        setIsLoading(false);
        updateDebugInfo();
      }
    };

    // Check if we're running in a browser environment
    if (typeof window !== 'undefined') {
      testModels();
    } else {
      setError(new Error('This page must be run in a browser environment'));
      setIsLoading(false);
      updateDebugInfo();
    }
    
    // Set up periodic debug info updates
    const debugInterval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(debugInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Face API Model Loading Test</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h2 className="font-bold mb-2">Test Status</h2>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-2 ${isLoading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <p className="font-mono">{status}</p>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500">
            <h3 className="font-bold text-red-700">Error Details:</h3>
            <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-sm text-red-700">
              {error.message}
            </pre>
            <p className="text-red-500">We couldn&apos;t load the models. Please check the following:</p>
            <p className="mt-2 text-sm text-gray-600">
              Please check the browser console (F12) for more detailed error information.
            </p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-50 rounded border">
          <h2 className="font-bold mb-2">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Page URL:</strong></p>
              <code className="block p-2 bg-gray-100 rounded mt-1 overflow-x-auto text-xs">
                {typeof window !== 'undefined' ? window.location.href : 'N/A'}
              </code>
            </div>
            <div>
              <p><strong>Environment:</strong></p>
              <code className="block p-2 bg-gray-100 rounded mt-1">
                {process.env.NODE_ENV}
              </code>
            </div>
            <div>
              <p><strong>Base Models Path:</strong></p>
              <code className="block p-2 bg-gray-100 rounded mt-1 text-xs break-all">
                {modelPaths?.basePath || 'Loading...'}
              </code>
            </div>
            <div>
              <p><strong>Models Loaded:</strong></p>
              <code className={`block p-2 rounded mt-1 ${
                areModelsLoaded() ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {typeof window !== 'undefined' ? areModelsLoaded() ? '✅ Yes' : '❌ No' : 'N/A'}
              </code>
            </div>
            {modelPaths && (
              <>
                <div>
                  <p><strong>TinyFaceDetector Path:</strong></p>
                  <code className="block p-2 bg-gray-100 rounded mt-1 text-xs break-all">
                    {modelPaths.tinyFaceDetector}
                  </code>
                </div>
                <div>
                  <p><strong>FaceLandmark68 Path:</strong></p>
                  <code className="block p-2 bg-gray-100 rounded mt-1 text-xs break-all">
                    {modelPaths.faceLandmark68}
                  </code>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-4">
            <details className="border rounded p-2">
              <summary className="font-medium cursor-pointer">Raw Debug Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500">
          <h3 className="font-bold text-yellow-700">Troubleshooting Tips</h3>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Ensure the model files exist in the <code>public/models</code> directory</li>
            <li>Check the browser&apos;s Network tab to see if the model files are being requested</li>
            <li>Verify file permissions for the model files</li>
            <li>Try clearing your browser cache and refreshing the page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
