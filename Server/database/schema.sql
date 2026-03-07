-- AI Audio Doctor Database Schema
-- MySQL Database Setup Script

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS audio_doctor 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE audio_doctor;

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS consultation_audit;
DROP TABLE IF EXISTS ai_extraction_audit;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;

-- Users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    gender VARCHAR(20) NULL,
    organization_name VARCHAR(255) NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    google_id VARCHAR(255) UNIQUE NULL,
    profile_picture VARCHAR(500) NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_email (email),
    INDEX idx_user_google_id (google_id),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients table
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 150),
    gender ENUM('male', 'female', 'other') NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_name (name),
    INDEX idx_patient_phone (phone),
    INDEX idx_patient_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consultations table
CREATE TABLE consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    
    -- Receptionist data (read-only for doctors)
    chief_complaint TEXT NOT NULL,
    history TEXT,
    vitals JSON,  -- {weightKg, bloodPressure, temperature, etc.}
    
    -- Doctor consultation data
    diagnosis_provisional TEXT,
    diagnosis_notes TEXT,
    tests_recommended JSON,  -- Array of test objects with categories
    medications JSON,  -- Detailed medicine objects with dosage, timing, etc.
    doctor_advice TEXT,
    follow_up_days INT,
    follow_up_instructions TEXT,
    
    -- Voice and AI data
    voice_transcript TEXT,
    ai_analysis JSON,   -- Structured AI extraction results
    
    -- Metadata
    doctor_id INT,
    status ENUM('active', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_consultation_patient (patient_id),
    INDEX idx_consultation_doctor (doctor_id),
    INDEX idx_consultation_date (created_at),
    INDEX idx_consultation_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consultation Audit Table (immutable audit trail)
CREATE TABLE consultation_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT,
    doctor_id INT NOT NULL,
    action_type ENUM('CONSULTATION_CREATED', 'CONSULTATION_UPDATED', 'AI_DATA_APPLIED') NOT NULL,
    voice_transcript_raw TEXT,
    ai_analysis_raw JSON,
    final_data_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_consultation (consultation_id),
    INDEX idx_audit_doctor (doctor_id),
    INDEX idx_audit_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Extraction Audit Table (for tracking AI usage)
CREATE TABLE ai_extraction_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    transcript_raw TEXT NOT NULL,
    ai_response_raw JSON,
    extraction_success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ai_audit_doctor (doctor_id),
    INDEX idx_ai_audit_date (created_at),
    INDEX idx_ai_audit_success (extraction_success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO patients (name, age, gender, phone, email, address) VALUES
('John Doe', 35, 'male', '+1234567890', 'john.doe@email.com', '123 Main St, City, State'),
('Jane Smith', 28, 'female', '+0987654321', 'jane.smith@email.com', '456 Oak Ave, City, State'),
('Robert Johnson', 45, 'male', '+1122334455', NULL, '789 Pine Rd, City, State');

-- Insert sample consultations
INSERT INTO consultations (
    patient_id, chief_complaint, history, vitals,
    diagnosis_provisional, diagnosis_notes, tests_recommended, medications, 
    doctor_advice, follow_up_days, follow_up_instructions,
    voice_transcript, ai_analysis, status
) VALUES 
(1, 'Persistent headache for 3 days', 'Patient reports headache since 3 days, no history of migraines', 
'{"weightKg": 70, "bloodPressure": "120/80", "temperature": "98.6°F"}',
'Tension headache', 'Patient shows signs of stress-related muscle tension in neck and shoulders',
'[{"name": "CBC", "category": "blood"}, {"name": "CT Scan Head", "category": "imaging"}]',
'[{"name": "Paracetamol 650mg", "dosage": "650mg", "timing": {"morning": true, "afternoon": true, "evening": true}, "foodRelation": "afterFood", "duration": "5 days"}]',
'Rest and stress management techniques', 7, 'Follow up if headache persists or worsens',
'Patient complains of persistent headache for three days...', '{"diagnosis": "Tension headache", "severity": "mild"}',
'completed'),

(2, 'Fever and sore throat', 'Fever since yesterday, throat pain while swallowing', 
'{"weightKg": 60, "bloodPressure": "110/70", "temperature": "101.2°F"}',
'Upper respiratory tract infection', 'Throat appears red and inflamed, tonsils slightly swollen',
'[{"name": "Throat Swab Culture", "category": "laboratory"}, {"name": "Complete Blood Count", "category": "blood"}]',
'[{"name": "Ibuprofen 400mg", "dosage": "400mg", "timing": {"morning": true, "afternoon": true, "evening": true}, "foodRelation": "afterFood", "duration": "3 days"}, {"name": "Azithromycin 500mg", "dosage": "500mg", "timing": {"morning": true}, "foodRelation": "beforeFood", "duration": "3 days"}]',
'Warm salt water gargles, stay hydrated', 5, 'Follow up if fever persists beyond 3 days',
'Patient has fever and throat pain...', '{"diagnosis": "Upper respiratory infection", "severity": "moderate"}',
'completed');

-- Show table structure
DESCRIBE patients;
DESCRIBE consultations;

-- Show sample data
SELECT * FROM patients;
SELECT * FROM consultations;
