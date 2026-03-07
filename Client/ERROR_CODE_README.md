# Frontend Error Codes Registry

This document serves as the single source of truth for all unique error codes used across the frontend application. 
By attaching a unique code to each `toast.error`, developers can easily trace issues back to their exact source file and function.

## 🗂 Error Code Taxonomy

We organize errors into categories using standard prefixes:

- **`AUTH`**: Authentication & Login (Login, Signup, OAuth)
- **`DOC`**: Doctor flow (Consultation, Patient Selection, Prescriptions)
- **`REC`**: Receptionist flow (Patient Registration, Demographics)
- **`API`**: Backend integration & Network responses (Save failures, Axios errors)
- **`SYS`**: System & Browser compatibility (Speech Recognition, Permissions)

---

## 🔐 Auth Errors (`AUTH`)
*Mainly found in `Login.jsx` and `Auth/loginRegister.jsx`*

| Code | Description / Context | Default User Message |
| --- | --- | --- |
| **`AUTH-OAUTH-FAIL`** | OAuth / Third-party login failure | *(Dynamic based on authResult.error)* |
| **`AUTH-MISSING-FIELDS`** | Missing required fields in Login/Registration form | "Please fill in all fields" |
| **`AUTH-LOGIN-FAIL`** | General login failure (Credentials rejected or network) | "Login failed. Please try again." |

---

## 🩺 Doctor Consultation Errors (`DOC`)
*Mainly found in `DoctorConsultation.jsx`*

| Code | Description / Context | Default User Message |
| --- | --- | --- |
| **`DOC-MISSING-PATIENT`** | Attempted to start recording/saving without selecting a patient | "Please select a patient first!" |
| **`DOC-MISSING-DIAGNOSIS`** | Attempted to save consultation without provisional diagnosis | "Please provide a provisional diagnosis!" |

---

## 🏥 Receptionist Errors (`REC`)
*Mainly found in `ReceptionistAudio.jsx`*

| Code | Description / Context | Default User Message (English / Hindi) |
| --- | --- | --- |
| **`REC-MISSING-NAME`** | Name validation failed (missing or < 2 chars) | "Please enter name..." / "कृपया नाम भरें..." |
| **`REC-MISSING-AGE`** | Age validation failed (missing) | "Please enter age" / "कृपया उम्र भरें" |
| **`REC-MISSING-GENDER`** | Gender validation failed (missing) | "Please select gender" / "कृपया लिंग चुनें" |

---

## 🌐 API & Network Errors (`API`)
*Errors occurring during save/fetch operations to the backend*

| Code | Description / Context | Default User Message |
| --- | --- | --- |
| **`API-DOC-SAVE-FAIL`** | Consultation save rejected by backend | "Failed to save consultation: [message]" |
| **`API-DOC-NETWORK-ERR`** | Network or try-catch error while saving consultation | "Error saving consultation. Please try again." |
| **`API-REC-SAVE-FAIL`** | Patient save rejected by backend (Receptionist) | "Failed to save patient: [message]" |
| **`API-REC-NETWORK-ERR`** | Network or try-catch error while saving patient (Receptionist) | "Error saving patient. Please try again." |
| **`API-PAT-NETWORK-ERR`** | Network or try-catch error while fetching patient records | "Could not load patient data. Please check the server." |

---

## ⚙️ System & Browser Errors (`SYS`)
*Errors related to Web APIs like SpeechRecognition*

| Code | Description / Context | Default User Message |
| --- | --- | --- |
| **`SYS-SPEECH-ERR`** | Speech recognition `onerror` fired (excluding silent pauses) | "Voice recognition error. Please try again." |
| **`SYS-SPEECH-UNSUPPORTED`** | Speech Recognition API not supported in current browser | "Your browser does not support Voice Recognition. Please use Chrome or Edge." |
