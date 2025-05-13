import { useState, useRef } from 'react';
import { UploadCloud, FileVideo, X } from 'lucide-react';

const FileUpload = ({ onFileChange, disabled }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        onFileChange(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Iltimos, faqat video fayl tanlang (.mp4, .avi, .mov, etc.)");
        setSelectedFile(null);
        setPreviewUrl(null);
        onFileChange(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onFileChange(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full p-4 border-2 border-dashed border-slate-600 rounded-xl hover:border-sky-500 transition-colors duration-300 ease-in-out">
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        disabled={disabled}
      />
      {!selectedFile ? (
        <div
          className="flex flex-col items-center justify-center h-48 cursor-pointer"
          onClick={() => !disabled && triggerFileInput()}
          onDrop={(e) => {
            e.preventDefault();
            if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
              if (e.dataTransfer.files[0].type.startsWith('video/')) {
                 setSelectedFile(e.dataTransfer.files[0]);
                 onFileChange(e.dataTransfer.files[0]);
                 const reader = new FileReader();
                 reader.onloadend = () => {
                   setPreviewUrl(reader.result);
                 };
                 reader.readAsDataURL(e.dataTransfer.files[0]);
              } else {
                alert("Iltimos, faqat video fayl tanlang.");
              }
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <UploadCloud size={64} className="text-slate-500 mb-4 group-hover:text-sky-400 transition-colors" />
          <p className="text-slate-400 text-center">
            Videoni shu yerga tashlang yoki <span className="text-sky-400 font-semibold">tanlash uchun bosing</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Maksimal hajmi: 100MB (Misol)</p>
        </div>
      ) : (
        <div className="text-center">
          {previewUrl && (
            <div className="mb-4 relative group">
                <video controls src={previewUrl} className="max-h-60 w-auto mx-auto rounded-lg shadow-md"></video>
                <button
                    onClick={handleRemoveFile}
                    disabled={disabled}
                    className="absolute top-2 right-2 bg-red-500/70 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    title="Videoni o'chirish"
                >
                    <X size={16} />
                </button>
            </div>
          )}
          <div className="flex items-center justify-center text-slate-300">
            <FileVideo size={20} className="mr-2 text-sky-400" />
            <span className="font-medium truncate max-w-xs sm:max-w-md md:max-w-lg">{selectedFile.name}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hajmi: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;