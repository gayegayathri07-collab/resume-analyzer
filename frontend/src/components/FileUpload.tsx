import { useState, useRef } from 'react';

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
}

export default function FileUpload({ onTextExtracted }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      alert('Only PDF and DOCX files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setUploading(true);
    setFileName(file.name);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('https://gayi.pythonanywhere.com/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onTextExtracted(data.text, data.filename);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
      setFileName('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold text-white mb-4">Upload Resume</h2>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-cyan-400 bg-cyan-950/30'
            : 'border-gray-700 hover:border-gray-500 bg-gray-950/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          {uploading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Uploading...</span>
            </div>
          ) : fileName ? (
            <div className="text-cyan-400 font-medium">{fileName}</div>
          ) : (
            <>
              <p className="text-gray-400 font-medium">
                Drop your resume here or click to browse
              </p>
              <p className="text-gray-600 text-sm">Supports PDF and DOCX (max 5MB)</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
