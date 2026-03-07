import React from 'react';
import { Search, User, Calendar, Phone } from 'lucide-react';

export default function RecentPatients({ 
  patients, 
  searchQuery, 
  onSearchChange, 
  onPatientSelect, 
  language,
  translations 
}) {
  const t = translations[language];

  // The backend already handles filtering and limits (e.g. 5 patients).
  const displayPatients = patients;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return language === 'hi' ? 'आज' : 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return language === 'hi' ? 'कल' : 'Yesterday';
    } else {
      return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">{t.recentPatients}</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder={language === 'hi' ? 'मरीज खोजें...' : 'Search patients...'}
          />
        </div>
      </div>

      {/* Patients List */}
      <div className="flex-1 overflow-y-auto">
        {displayPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
            <User className="w-12 h-12 mb-3" />
            <p className="text-center text-sm">
              {searchQuery 
                ? (language === 'hi' ? 'कोई मरीज नहीं मिला' : 'No patients found')
                : t.noPatients
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => onPatientSelect(patient)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Patient Name */}
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="font-medium text-gray-900 truncate">
                        {patient.name}
                      </p>
                    </div>
                    
                    {/* Patient Details */}
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-3">
                          {patient.age} {language === 'hi' ? 'वर्ष' : 'years'}
                        </span>
                        <span className="mr-3">
                          {patient.gender === 'male' 
                            ? (language === 'hi' ? 'पुरुष' : 'Male')
                            : patient.gender === 'female' 
                              ? (language === 'hi' ? 'महिला' : 'Female')
                              : (language === 'hi' ? 'अन्य' : 'Other')
                          }
                        </span>
                      </div>
                      
                      {patient.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {patient.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Date */}
                  <div className="flex flex-col items-end text-xs text-gray-500 ml-3">
                    <Calendar className="w-3 h-3 mb-1" />
                    {formatDate(patient.created_at)}
                  </div>
                </div>
                
                {/* Click hint */}
                <div className="mt-2 text-xs text-blue-600">
                  {language === 'hi' ? 'क्लिक करके फॉर्म भरें' : 'Click to fill form'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          {language === 'hi' 
            ? `${displayPatients.length} मरीज़ दिखा रहे हैं`
            : `Showing ${displayPatients.length} patients`
          }
        </div>
      </div>
    </div>
  );
}
