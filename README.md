# AI Audio Doctor Project

A full-stack React + Node.js + MySQL application for doctor consultation management with future AI integration capabilities.

## Project Structure

```
AI Audio Doctor Project/
├── Client/                          # React Frontend
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js              # API service layer
│   │   ├── utils/
│   │   │   └── consultationExamples.js  # Example usage functions
│   │   └── ...                     # Existing React files
│   ├── .env.example                # Frontend environment variables
│   └── package.json
├── Server/                         # Node.js Backend
│   ├── config/
│   │   └── db.js                   # MySQL database configuration
│   ├── controllers/
│   │   └── consultation.controller.js  # Consultation controllers
│   ├── middlewares/
│   │   ├── error.middleware.js     # Global error handling
│   │   └── validate.middleware.js  # Request validation
│   ├── routes/
│   │   ├── health.route.js         # Health check routes
│   │   └── consultation.route.js   # Consultation routes
│   ├── services/
│   │   └── consultation.service.js # Business logic layer
│   ├── utils/
│   │   └── response.util.js        # Response formatting utilities
│   ├── database/
│   │   └── schema.sql              # Database schema and sample data
│   ├── .env.example                # Backend environment variables
│   ├── index.js                    # Express app entry point
│   └── package.json
```

## Tech Stack

- **Frontend**: React.js + Vite + Axios
- **Backend**: Node.js + Express.js
- **Database**: MySQL with mysql2 package
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Development**: Nodemon

## Setup Instructions

### 1. Database Setup

```bash
# Create MySQL database and tables
mysql -u root -p < Server/database/schema.sql
```

### 2. Backend Setup

```bash
cd Server
npm install
cp .env.example .env
# Update .env with your database credentials
npm run dev
```

### 3. Frontend Setup

```bash
cd Client
npm install
cp .env.example .env
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/db` - Database connection status

### Consultations
- `POST /api/consultation/save` - Save new consultation
- `GET /api/consultation/:patientId` - Get consultations by patient ID
- `GET /api/consultation/:patientId/latest` - Get latest consultation
- `GET /api/consultation/detail/:consultationId` - Get specific consultation

## Database Schema

### Patients Table
- `id` (Primary Key)
- `name`, `age`, `gender`
- `phone`, `email`, `address`
- `created_at`, `updated_at`

### Consultations Table
- `id` (Primary Key)
- `patient_id` (Foreign Key)
- `chief_complaint`, `history`, `examination`, `diagnosis`
- `medicines` (JSON)
- `notes`, `transcription`, `ai_analysis` (JSON)
- `created_at`, `updated_at`

## Usage Examples

### Frontend API Usage

```javascript
import { consultationAPI } from './services/api';

// Save consultation
const consultationData = {
  patientId: 1,
  chiefComplaint: "Patient complains of headache",
  diagnosis: "Tension headache",
  medicines: [
    {
      name: "Paracetamol",
      dosage: "500mg",
      frequency: "3 times daily",
      duration: "5 days"
    }
  ]
};

const response = await consultationAPI.saveConsultation(consultationData);
```

### Backend Request Format

```json
{
  "patientId": 1,
  "chiefComplaint": "Persistent headache for 3 days",
  "history": "No previous history of migraines",
  "examination": "Normal neurological examination",
  "diagnosis": "Tension headache",
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "5 days"
    }
  ],
  "notes": "Patient advised to rest",
  "transcription": "AI transcription placeholder",
  "aiAnalysis": {
    "severity": "mild",
    "urgency": "low"
  }
}
```

## Future AI Integration

The project is designed with placeholders for AI integration:

1. **Speech-to-Text**: `transcription` field for voice input
2. **AI Analysis**: `ai_analysis` JSON field for structured AI insights
3. **Groq Integration**: Ready for Groq API integration in the future

## Features

- ✅ Clean, scalable architecture
- ✅ RESTful API design
- ✅ Input validation and error handling
- ✅ Database connection pooling
- ✅ CORS and security middleware
- ✅ Pagination support
- ✅ JSON field handling for complex data
- ✅ Environment-based configuration
- ✅ Production-ready structure

## Development

- Backend runs on `http://localhost:5050`
- Frontend runs on `http://localhost:5173`
- Database: MySQL on default port 3306

## Next Steps

1. Set up MySQL database
2. Install dependencies in both Client and Server
3. Configure environment variables
4. Run both servers
5. Test API endpoints
6. Integrate AI services (Groq, speech-to-text)
7. Add authentication
8. Build UI components
