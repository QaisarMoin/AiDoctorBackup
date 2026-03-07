import React from 'react';
import { FileText, Trash2 } from 'lucide-react';

export default function TranscriptPanel({ 
  transcript, 
  onClear, 
  language,
  translations 
}) {
  const t = translations[language];

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">{t.voiceTranscript}</h3>
        </div>
        
        {transcript && (
          <button
            onClick={onClear}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title={language === 'hi' ? 'साफ़ करें' : 'Clear'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Transcript Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="min-h-[200px]">
          {transcript ? (
            <div className="space-y-2">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {transcript}
              </p>
              
              {/* Word count and timestamp */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>
                  {language === 'hi' ? 'शब्द:' : 'Words'} {transcript.split(/\s+/).filter(w => w.length > 0).length}
                </span>
                <span>
                  {new Date().toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileText className="w-12 h-12 mb-3" />
              <p className="text-center text-sm">
                {language === 'hi' 
                  ? 'आपकी आवाज़ यहाँ दिखाई देगी...' 
                  : 'Your voice will appear here...'
                }
              </p>
              <p className="text-center text-xs mt-2">
                {language === 'hi' 
                  ? 'माइक्रोफोन बटन दबाकर बोलना शुरू करें' 
                  : 'Press the microphone button to start speaking'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with processing indicator */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {language === 'hi' ? 'लाइव ट्रांसक्रिप्शन' : 'Live Transcription'}
          </span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{language === 'hi' ? 'सक्रिय' : 'Active'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
