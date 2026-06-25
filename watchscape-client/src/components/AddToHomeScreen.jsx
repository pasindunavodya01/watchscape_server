import { useState, useEffect } from 'react';

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export default function AddToHomeScreenPrompt() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Don't show if it's already a PWA or not a mobile device
    if (window.matchMedia('(display-mode: standalone)').matches || !isMobile()) {
      return;
    }

    // Check if the prompt has been shown before
    const promptShown = localStorage.getItem('addToHomeScreenPromptShown');
    if (!promptShown) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('addToHomeScreenPromptShown', 'true');
  };

  if (!isVisible) {
    return null;
  }

  const shareIcon = (
    <svg className="w-5 h-5 inline-block mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {isIOS() ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
      )}
    </svg>
  );

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[100] animate-fade-in-up">
      <div className="bg-slate-800 text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 border border-slate-700">
        <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="6" width="20" height="13" rx="2" />
            <path strokeLinecap="round" d="M2 10h20M7 6V4M17 6V4M7 10v9M17 10v9M12 10v9" />
          </svg>
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold mb-1">Get the full experience!</p>
          <p className="text-slate-300">Add Watchscape to your home screen for faster access and a better experience.</p>
        </div>
        <button onClick={handleClose} className="p-1 text-slate-400 hover:text-white transition-colors flex-shrink-0 -mt-1 -mr-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}