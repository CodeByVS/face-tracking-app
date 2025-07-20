# Face Tracking Application

A Next.js application that tracks faces in real-time using the webcam and allows recording videos with face tracking markers.

## Features

- Real-time face detection using `face-api.js`
- Video recording with face tracking markers
- Save recorded videos locally
- Responsive design that works on both desktop and mobile devices
- Clean and user-friendly interface

## Prerequisites

- Node.js 16.8 or later
- pnpm (recommended) or npm/yarn
- Modern web browser with camera access

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd face-tracking-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Download face detection models**
   ```bash
   powershell -ExecutionPolicy Bypass -File scripts/download-models.ps1
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Grant camera permissions**
   When prompted, allow the browser to access your camera.

## Usage

1. The application will automatically start your webcam.
2. Click the "Start Recording" button to begin recording with face tracking.
3. Click "Stop Recording" when you're done.
4. The recorded video will be automatically downloaded to your device.
5. The video is also saved in the browser's local storage for future access.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type checking
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [face-api.js](https://github.com/justadudewhohacks/face-api.js/) - Face detection
- [file-saver](https://www.npmjs.com/package/file-saver) - File downloading

## Browser Support

This application uses modern web APIs including:
- MediaDevices API (for camera access)
- MediaRecorder API (for video recording)
- WebRTC (for camera streaming)

It works best in the latest versions of Chrome, Firefox, and Edge.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
