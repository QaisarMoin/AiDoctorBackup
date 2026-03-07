import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export default function VoiceController({ 
  isListening, 
  isProcessing, 
  onToggle, 
  language,
  translations 
}) {
  const t = translations[language];

  const getMicButtonClass = () => {
    const baseClass = "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4";
    
    if (isProcessing) {
      return `${baseClass} bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300 cursor-not-allowed`;
    }
    if (isListening) {
      return `${baseClass} bg-red-500 hover:bg-red-600 focus:ring-red-300 animate-pulse`;
    }
    return `${baseClass} bg-blue-600 hover:bg-blue-700 focus:ring-blue-300`;
  };

  const getStatusText = () => {
    if (isProcessing) {
      return language === 'hi' ? 'प्रोसेसिंग...' : 'Processing...';
    }
    if (isListening) {
      return t.listening;
    }
    return language === 'hi' ? 'माइक्रोफोन शुरू करने के लिए क्लिक करें' : 'Click to start microphone';
  };

  const getStatusClass = () => {
    if (isProcessing) return 'text-yellow-600';
    if (isListening) return 'text-red-600 font-semibold animate-pulse';
    return 'text-gray-600';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Microphone Button */}
      <button
        onClick={onToggle}
        disabled={isProcessing}
        className={getMicButtonClass()}
      >
        {/* Outer ring animation when listening */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
        )}
        
        {/* Icon */}
        <div className="relative z-10 text-white">
          {isProcessing ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-12 h-12" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </div>
      </button>

      {/* Status Text */}
      <div className="mt-6 text-center">
        <p className={`text-lg ${getStatusClass()}`}>
          {getStatusText()}
        </p>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          {language === 'hi' ? 'कीबोर्ड शॉर्टकट:' : 'Keyboard shortcuts:'}
        </p>
        <div className="flex justify-center space-x-2 mt-1">
          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</span>
          <span className="text-xs text-gray-500">or</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+M</span>
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg max-w-xs">
        <p className="text-sm text-blue-700 text-center">
          {language === 'hi' 
            ? 'आप स्वाभाविक रूप से बोल सकते हैं। मैं समझ जाऊंगा।' 
            : 'You can speak naturally. I will understand.'
          }
        </p>
      </div>
    </div>
  );
}
