import { useState } from 'react';
import FileUpload from './components/FileUpload';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import { PlaySquare, Server, Zap } from 'lucide-react';

// API manzillari (o'zingizning manzillaringiz bilan almashtiring)
const UPLOAD_API_URL = 'http://localhost:4040/api/files';
const PREDICT_API_URL = 'http://localhost:4040/api/predict';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Processing, 3: Results

  const handleFileChange = (file) => {
    setVideoFile(file);
    setVideoUrl('');
    setPredictions([]);
    setError('');
    setCurrentStep(1);
  };

  const handleUploadAndPredict = async () => {
    if (!videoFile) {
      setError('Iltimos, avval video faylni tanlang.');
      return;
    }

    setIsLoading(true);
    setError('');
    setCurrentStep(2);

    try {
      // Step 1: Upload the video to get the URL
      const uploadFormData = new FormData();
      uploadFormData.append('video', videoFile);

      console.log(`Uploading video to: ${UPLOAD_API_URL}`);
      const uploadResponse = await fetch(UPLOAD_API_URL, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ message: 'Video yuklashda xatolik yuz berdi.' }));
        throw new Error(`Yuklash xatosi: ${uploadResponse.status} - ${errorData.message || 'Serverdan javob yo\'q'}`);
      }

      const uploadResult = await uploadResponse.json();
      const videoUrl = uploadResult.message;
      setVideoUrl(videoUrl);
      console.log('Video URL:', videoUrl);

      // Step 2: Use the video URL to predict
      console.log(`Sending prediction request to: ${PREDICT_API_URL}`);
      const predictResponse = await fetch(PREDICT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ video_url: videoUrl }),
      });

      if (!predictResponse.ok) {
        const errorData = await predictResponse.json().catch(() => ({ message: 'Bashorat qilishda xatolik yuz berdi.' }));
        throw new Error(`Bashorat xatosi: ${predictResponse.status} - ${errorData.message || 'Serverdan javob yo\'q'}`);
      }

      const predictResult = await predictResponse.json();
      setPredictions(predictResult.predictions || []);
      setCurrentStep(3);
      console.log('Bashorat natijalari:', predictResult.predictions);

    } catch (err) {
      console.error('Xatolik:', err);
      setError(err.message || 'Noma\'lum xatolik yuz berdi.');
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4 sm:p-8 transition-all duration-500 ease-in-out">
      <div className="bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-10 w-full max-w-2xl transform transition-all duration-500 ease-in-out">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            Inson Harakatini Aniqlash
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Videoni yuklang va tizim undagi harakatlarni aniqlaydi.
          </p>
        </header>

        <main>
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">Xatolik!</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}

          <div className="space-y-8">
            <div className={`p-6 rounded-lg bg-slate-700/50 transition-opacity duration-500 ${currentStep === 1 ? 'opacity-100' : 'opacity-60'}`}>
              <div className="flex items-center text-sky-400 mb-3">
                <PlaySquare size={28} className="mr-3" />
                <h2 className="text-2xl font-semibold">Video Yuklash</h2>
              </div>
              <FileUpload onFileChange={handleFileChange} disabled={isLoading} />
            </div>

            {videoFile && currentStep === 1 && (
              <div className="text-center">
                <button
                  onClick={handleUploadAndPredict}
                  disabled={isLoading || !videoFile}
                  className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader size="small" />
                      <span className="ml-2">Qayta ishlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={20} className="mr-2" />
                      <span>Yuklash va Aniqlash</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {isLoading && currentStep === 2 && (
              <div className="p-6 rounded-lg bg-slate-700/50 text-center">
                <div className="flex items-center justify-center text-sky-400 mb-4">
                  <Server size={32} className="mr-3 animate-pulse" />
                  <h2 className="text-2xl font-semibold">Qayta Ishlanmoqda...</h2>
                </div>
                <p className="text-slate-400 mb-6">
                  Video serverga yuklanmoqda va harakatlar tahlil qilinmoqda. Iltimos kuting.
                </p>
                <Loader />
                {videoUrl && <p className="text-xs text-slate-500 mt-4 break-all">Yuklangan video: {videoUrl}</p>}
              </div>
            )}

            {currentStep === 3 && predictions.length > 0 && (
              <div className={`p-6 rounded-lg bg-slate-700/50 transition-opacity duration-500 ${currentStep === 3 ? 'opacity-100' : 'opacity-60'}`}>
                <h2 className="text-2xl font-semibold text-sky-400 mb-4 text-center sm:text-left">Aniqlangan Harakatlar:</h2>
                <ResultsDisplay predictions={predictions} />
              </div>
            )}

            {currentStep === 3 && predictions.length === 0 && !isLoading && (
               <div className="p-6 rounded-lg bg-slate-700/50 text-center">
                <p className="text-slate-400">Harakatlar topilmadi yoki bashorat qilishda muammo yuz berdi.</p>
               </div>
            )}
          </div>
        </main>

        <footer className="text-center mt-10 text-slate-500 text-xs">
          <p>&copy; {new Date().getFullYear()} Inson Harakatini Aniqlash Tizimi. Barcha huquqlar himoyalangan.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;