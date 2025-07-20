$modelsDir = "public/models"
if (-not (Test-Path -Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir | Out-Null
}

# Download face detection models
$models = @(
    "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-weights_manifest.json",
    "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-shard1",
    "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-weights_manifest.json",
    "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-shard1"
)

foreach ($modelUrl in $models) {
    $fileName = [System.IO.Path]::GetFileName($modelUrl)
    $outputPath = Join-Path $modelsDir $fileName
    
    Write-Host "Downloading $fileName..."
    Invoke-WebRequest -Uri $modelUrl -OutFile $outputPath
}

Write-Host "\nAll models downloaded successfully to $modelsDir"
