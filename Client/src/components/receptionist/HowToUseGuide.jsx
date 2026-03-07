import React, { useState } from 'react';
import { X, HelpCircle, Mic, Keyboard, Save, Search, Volume2 } from 'lucide-react';

export default function HowToUseGuide({ isOpen, onClose, language }) {
  const [activeTab, setActiveTab] = useState(language === 'hi' ? 'hi' : 'en');

  const content = {
    en: {
      title: 'How to Use Voice Assistant',
      tabs: { en: 'English', hi: 'हिंदी' },
      sections: [
        {
          icon: Mic,
          title: 'Voice Recording',
          content: [
            'Click the large microphone button in the center',
            'Speak clearly and naturally in Hindi or English',
            'The system will automatically detect and fill patient information',
            'Click the microphone button again to stop recording'
          ]
        },
        {
          icon: Volume2,
          title: 'Auto-Filled Fields',
          content: [
            'Name: Say "Name is [patient name]" or "[patient name] का नाम है"',
            'Age: Say "Age is [number]" or "[number] साल के हैं"',
            'Gender: Say "Male/Female" or "पुरुष/महिला"',
            'Phone: Say "Phone is [number]" or "फोन नंबर है"',
            'Voice-filled fields appear with blue highlight'
          ]
        },
        {
          icon: Search,
          title: 'Recent Patients',
          content: [
            'View recent patients in the right panel',
            'Search by name or phone number',
            'Click on any patient to auto-fill the form',
            'Maximum 10 recent patients shown'
          ]
        },
        {
          icon: Save,
          title: 'Saving Patient',
          content: [
            'Required fields: Name, Age, Gender (marked with *)',
            'Review all information before saving',
            'Click "Save Patient" button (green button at bottom)',
            'Form will clear automatically after successful save'
          ]
        },
        {
          icon: Keyboard,
          title: 'Keyboard Shortcuts',
          content: [
            'Spacebar: Toggle microphone on/off',
            'Ctrl + M: Toggle microphone on/off',
            'Tab: Navigate between form fields',
            'Enter: Save patient (when save button is focused)'
          ]
        }
      ],
      tips: [
        'Speak at a normal pace - not too fast, not too slow',
        'Ensure quiet environment for better accuracy',
        'You can manually edit any field after voice input',
        'The system works best with clear pronunciation',
        'Use simple sentences for better recognition'
      ],
      close: 'Close',
      gotIt: 'Got it!'
    },
    hi: {
      title: 'वॉइस असिस्टेंट का उपयोग कैसे करें',
      tabs: { en: 'English', hi: 'हिंदी' },
      sections: [
        {
          icon: Mic,
          title: 'वॉइस रिकॉर्डिंग',
          content: [
            'बीच में दिख रहे बड़े माइक्रोफोन बटन पर क्लिक करें',
            'हिंदी या अंग्रेजी में स्पष्ट रूप से बोलें',
            'सिस्टम स्वचालित रूप से मरीज की जानकारी भर देगा',
            'रिकॉर्डिंग बंद करने के लिए फिर से माइक्रोफोन बटन दबाएं'
          ]
        },
        {
          icon: Volume2,
          title: 'ऑटो-फिल्ड जानकारी',
          content: [
            'नाम: "नाम है [मरीज का नाम]" या "[मरीज का नाम] का नाम है" बोलें',
            'उम्र: "[संख्या] साल के हैं" या "उम्र है [संख्या]" बोलें',
            'लिंग: "पुरुष/महिला" या "Male/Female" बोलें',
            'फोन: "फोन नंबर है [संख्या]" बोलें',
            'वॉइस से भरे गए फ़ील्ड ब्लू रंग में दिखाई देंगे'
          ]
        },
        {
          icon: Search,
          title: 'हाल के मरीज',
          content: [
            'दाएं पैनल में हाल के मरीज देखें',
            'नाम या फोन नंबर से खोजें',
            'फॉर्म भरने के लिए किसी भी मरीज पर क्लिक करें',
            'अधिकतम 10 हाल के मरीज दिखाए जाते हैं'
          ]
        },
        {
          icon: Save,
          title: 'मरीज को सेव करना',
          content: [
            'जरूरी फ़ील्ड: नाम, उम्र, लिंग (*) के साथ चिह्नित',
            'सेव करने से पहले सभी जानकारी जांचें',
            'मरीज बचाएं" बटन पर क्लिक करें (नीचे हरा बटन)',
            'सफल सेव के बाद फॉर्म अपने आप साफ़ हो जाएगा'
          ]
        },
        {
          icon: Keyboard,
          title: 'कीबोर्ड शॉर्टकट',
          content: [
            'Spacebar: माइक्रोफोन चालू/बंद करें',
            'Ctrl + M: माइक्रोफोन चालू/बंद करें',
            'Tab: फॉर्म फ़ील्ड के बीच जाएं',
            'Enter: मरीज सेव करें (जब सेव बटन फोकस में हो)'
          ]
        }
      ],
      tips: [
        'सामान्य गति से बोलें - न तो ज्यादा तेज, न धीमे',
        'बेहतर accuracy के लिए शांत वातावरण सुनिश्चित करें',
        'वॉइस इनपुट के बाद कोई भी फ़ील्ड मैन्युअली एडिट कर सकते हैं',
        'सिस्टम स्पष्ट उच्चारण के साथ सबसे अच्छा काम करता है',
        'बेहतर पहचान के लिए सरल वाक्यों का उपयोग करें'
      ],
      close: 'बंद करें',
      gotIt: 'समझ गए!'
    }
  };

  const currentContent = content[activeTab];

  if (!isOpen) {
    // Floating button
    return (
      <button
        onClick={() => onClose(true)} // Pass true to open
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-40"
        title={language === 'hi' ? 'उपयोग कैसे करें' : 'How to Use'}
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{currentContent.title}</h2>
          <button
            onClick={() => onClose(false)} // Pass false to close
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('en')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'en'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {currentContent.tabs.en}
          </button>
          <button
            onClick={() => setActiveTab('hi')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'hi'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {currentContent.tabs.hi}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {currentContent.sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  <ul className="space-y-2 ml-10">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <span className="text-blue-600 mr-2 mt-1">•</span>
                        <span className="text-gray-700 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* Tips Section */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">
                {language === 'hi' ? 'बेहतर अनुभव के लिए टिप्स:' : 'Tips for Better Experience:'}
              </h3>
              <ul className="space-y-2">
                {currentContent.tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">💡</span>
                    <span className="text-blue-800 text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onClose(false)} // Pass false to close
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {currentContent.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
}
