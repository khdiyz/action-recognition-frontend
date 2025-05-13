import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import { PlaySquare, Server, Zap, Upload, History, Trash2, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

// API manzillari (o'zingizning manzillaringiz bilan almashtiring)
const UPLOAD_API_URL = 'http://localhost:4040/api/files';
const PREDICT_API_URL = 'http://localhost:4040/api/predict';
const ACTIONS_API_URL = 'http://localhost:4040/api/actions';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Select, 2: Upload, 3: Predict, 4: Results
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Load history when component mounts or when showHistory changes to true
  useEffect(() => {
    if (showHistory) {
      fetchPredictionHistory();
    }
  }, [showHistory]);

  const fetchPredictionHistory = async () => {
    setIsLoadingHistory(true);
    setError('');
    
    try {
      const response = await fetch(ACTIONS_API_URL, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Tarix ma'lumotlarini olishda xatolik: ${response.status}`);
      }

      const data = await response.json();
      setHistoryItems(data.actions || []);
    } catch (err) {
      console.error('Tarix xatosi:', err);
      setError(err.message || 'Tarix ma\'lumotlarini olishda xatolik yuz berdi.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (confirm('Haqiqatan ham barcha tarix ma\'lumotlarini o\'chirmoqchimisiz?')) {
      setIsDeletingHistory(true);
      setError('');
      
      try {
        const response = await fetch(ACTIONS_API_URL, {
          method: 'DELETE',
          headers: {
            'accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Tarixni o'chirishda xatolik: ${response.status}`);
        }

        await response.json();
        setHistoryItems([]);
        setSelectedHistoryItem(null);
      } catch (err) {
        console.error('Tarixni o\'chirish xatosi:', err);
        setError(err.message || 'Tarix ma\'lumotlarini o\'chirishda xatolik yuz berdi.');
      } finally {
        setIsDeletingHistory(false);
      }
    }
  };

  const handleFileChange = (file) => {
    setVideoFile(file);
    setVideoUrl('');
    setPredictions([]);
    setError('');
    setUploadProgress(0);
    setCurrentStep(1);
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setError('Iltimos, avval video faylni tanlang.');
      return;
    }

    setIsUploading(true);
    setError('');
    setCurrentStep(2);
    setUploadProgress(0);

    try {
      // Upload the video to get the URL
      const uploadFormData = new FormData();
      uploadFormData.append('video', videoFile);

      console.log(`Uploading video to: ${UPLOAD_API_URL}`);
      
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Create a promise to handle the XHR request
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Serverdan kelgan javobni qayta ishlashda xatolik'));
            }
          } else {
            reject(new Error(`Yuklash xatosi: ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Tarmoq xatosi yuz berdi'));
        });
        
        xhr.open('POST', UPLOAD_API_URL);
        xhr.send(uploadFormData);
      });
      
      const uploadResult = await uploadPromise;
      const videoUrl = uploadResult.message;
      setVideoUrl(videoUrl);
      console.log('Video URL:', videoUrl);
      setCurrentStep(3);

    } catch (err) {
      console.error('Xatolik:', err);
      setError(err.message || 'Noma\'lum xatolik yuz berdi.');
      setCurrentStep(1);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePredict = async () => {
    if (!videoUrl) {
      setError('Iltimos, avval videoni yuklang.');
      return;
    }

    setIsPredicting(true);
    setError('');
    
    try {
      // Use the video URL to predict
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
      setCurrentStep(4);
      console.log('Bashorat natijalari:', predictResult.predictions);
      
      // Refresh history after successful prediction
      if (showHistory) {
        fetchPredictionHistory();
      }

    } catch (err) {
      console.error('Xatolik:', err);
      setError(err.message || 'Noma\'lum xatolik yuz berdi.');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSelectHistoryItem = (item) => {
    setSelectedHistoryItem(item);
    setVideoUrl(item.video_url);
    setPredictions(item.predicted_actions);
    setCurrentStep(4);
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4 sm:p-8 transition-all duration-500 ease-in-out">
      <div className="bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-10 w-full max-w-2xl transform transition-all duration-500 ease-in-out">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            Inson Harakatini Aniqlash
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base mb-4">
            Videoni yuklang va tizim undagi harakatlarni aniqlaydi.
          </p>
          
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center text-sky-400 hover:text-sky-300 transition-colors duration-300 text-sm px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700"
            >
              <History size={16} className="mr-2" />
              {showHistory ? 'Tarixni yashirish' : 'Tarixni ko\'rsatish'}
              {showHistory ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
            </button>
          </div>
        </header>

        <main>
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">Xatolik!</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}

          {showHistory && (
            <div className="mb-8 bg-slate-700/50 rounded-lg p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-sky-400 flex items-center">
                  <Clock size={24} className="mr-2" /> Bashorat Tarixi
                </h2>
                <button
                  onClick={handleDeleteHistory}
                  disabled={isDeletingHistory || isLoadingHistory || historyItems.length === 0}
                  className="text-red-400 hover:text-red-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                  title="Tarixni o'chirish"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              {isLoadingHistory ? (
                <div className="flex justify-center py-6">
                  <Loader size="small" />
                </div>
              ) : historyItems.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Tarix ma'lumotlari mavjud emas</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {historyItems.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleSelectHistoryItem(item)}
                      className={`p-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                        selectedHistoryItem?.id === item.id 
                          ? 'bg-sky-500/20 border border-sky-500' 
                          : 'bg-slate-700 hover:bg-slate-600/70'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sky-300">{item.predicted_actions.length} ta harakat aniqlangan</p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center">
                            <Clock size={12} className="mr-1" />
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                        <a 
                          href={item.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-sky-400 transition-colors p-1"
                          title="Videoni ochish"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-8">
            <div className={`p-6 rounded-lg bg-slate-700/50 transition-opacity duration-500 ${currentStep === 1 ? 'opacity-100' : 'opacity-60'}`}>
              <div className="flex items-center text-sky-400 mb-3">
                <PlaySquare size={28} className="mr-3" />
                <h2 className="text-2xl font-semibold">Video Yuklash</h2>
              </div>
              <FileUpload onFileChange={handleFileChange} disabled={isUploading || isPredicting} />
            </div>

            {videoFile && currentStep === 1 && (
              <div className="text-center">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !videoFile}
                  className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <Loader size="small" />
                      <span className="ml-2">Yuklanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="mr-2" />
                      <span>Yuklash</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {isUploading && currentStep === 2 && (
              <div className="p-6 rounded-lg bg-slate-700/50 text-center">
                <div className="flex items-center justify-center text-sky-400 mb-4">
                  <Server size={32} className="mr-3 animate-pulse" />
                  <h2 className="text-2xl font-semibold">Video Yuklanmoqda...</h2>
                </div>
                <p className="text-slate-400 mb-4">
                  Video serverga yuklanmoqda. Iltimos kuting.
                </p>
                <div className="w-full bg-slate-600 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-sky-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sky-400 font-medium">{uploadProgress}%</p>
              </div>
            )}

            {videoUrl && (currentStep === 3 || currentStep === 4) && (
              <div className={`p-6 rounded-lg bg-slate-700/50 transition-opacity duration-500`}>
                <div className="flex items-center text-sky-400 mb-3">
                  <Server size={28} className="mr-3" />
                  <h2 className="text-2xl font-semibold">Video Yuklandi</h2>
                </div>
                <p className="text-slate-400 text-sm mb-4 break-all">
                  Video manzili: <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{videoUrl}</a>
                </p>
                
                {currentStep === 3 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={handlePredict}
                      disabled={isPredicting || !videoUrl}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isPredicting ? (
                        <>
                          <Loader size="small" />
                          <span className="ml-2">Qayta ishlanmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={20} className="mr-2" />
                          <span>Harakatlarni Aniqlash</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {isPredicting && (
              <div className="p-6 rounded-lg bg-slate-700/50 text-center">
                <div className="flex items-center justify-center text-sky-400 mb-4">
                  <Server size={32} className="mr-3 animate-pulse" />
                  <h2 className="text-2xl font-semibold">Tahlil Qilinmoqda...</h2>
                </div>
                <p className="text-slate-400 mb-6">
                  Video harakatlari tahlil qilinmoqda. Iltimos kuting.
                </p>
                <Loader />
              </div>
            )}

            {currentStep === 4 && predictions.length > 0 && (
              <div className={`p-6 rounded-lg bg-slate-700/50 transition-opacity duration-500`}>
                <h2 className="text-2xl font-semibold text-sky-400 mb-4 text-center sm:text-left">Aniqlangan Harakatlar:</h2>
                <ResultsDisplay predictions={predictions} />
                {selectedHistoryItem && (
                  <p className="text-xs text-slate-400 mt-4 text-center">
                    <Clock size={12} className="inline mr-1" />
                    Tarixdan tanlangan: {formatDate(selectedHistoryItem.created_at)}
                  </p>
                )}
              </div>
            )}

            {currentStep === 4 && predictions.length === 0 && !isPredicting && (
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