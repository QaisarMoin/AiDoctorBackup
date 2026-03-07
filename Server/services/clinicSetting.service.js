const { executeQuery } = require('../config/db');

// ─── Default medicines ────────────────────────────────────────────────────────
const DEFAULT_MEDICINES = [
  { name: 'Paracetamol 650mg',    default_dosage: '1 Tablet',   default_duration: '5 Days',  default_food_relation: 'After Food' },
  { name: 'Ibuprofen 400mg',      default_dosage: '1 Tablet',   default_duration: '5 Days',  default_food_relation: 'After Food' },
  { name: 'Amoxicillin 500mg',    default_dosage: '1 Capsule',  default_duration: '5 Days',  default_food_relation: 'After Food' },
  { name: 'Azithromycin 500mg',   default_dosage: '1 Tablet',   default_duration: '3 Days',  default_food_relation: 'After Food' },
  { name: 'Cetirizine 10mg',      default_dosage: '1 Tablet',   default_duration: '5 Days',  default_food_relation: 'After Food' },
  { name: 'Omeprazole 20mg',      default_dosage: '1 Capsule',  default_duration: '14 Days', default_food_relation: 'Before Food' },
  { name: 'Pantoprazole 40mg',    default_dosage: '1 Tablet',   default_duration: '14 Days', default_food_relation: 'Before Food' },
  { name: 'Metformin 500mg',      default_dosage: '1 Tablet',   default_duration: '30 Days', default_food_relation: 'After Food' },
  { name: 'Amlodipine 5mg',       default_dosage: '1 Tablet',   default_duration: '30 Days', default_food_relation: 'After Food' },
  { name: 'Atenolol 50mg',        default_dosage: '1 Tablet',   default_duration: '30 Days', default_food_relation: 'After Food' },
  { name: 'Aspirin 75mg',         default_dosage: '1 Tablet',   default_duration: '30 Days', default_food_relation: 'After Food' },
  { name: 'Vitamin D3',           default_dosage: '1 Tablet',   default_duration: '90 Days', default_food_relation: 'After Food' },
  { name: 'Calcium Tablets',      default_dosage: '1 Tablet',   default_duration: '30 Days', default_food_relation: 'After Food' },
  { name: 'Multivitamin',         default_dosage: '1 Tablet',   default_duration: '30 Days', default_food_relation: 'After Food' },
  { name: 'Diclofenac 50mg',      default_dosage: '1 Tablet',   default_duration: '5 Days',  default_food_relation: 'After Food' },
  { name: 'Ciprofloxacin 500mg',  default_dosage: '1 Tablet',   default_duration: '5 Days',  default_food_relation: 'After Food' },
];

const DEFAULT_TESTS = [
  { name: 'Complete Blood Count (CBC)',      category: 'Blood' },
  { name: 'Lipid Profile',                   category: 'Blood' },
  { name: 'Blood Sugar Fasting (FBS)',        category: 'Blood' },
  { name: 'HbA1c',                           category: 'Blood' },
  { name: 'Thyroid Profile (T3, T4, TSH)',   category: 'Blood' },
  { name: 'Liver Function Test (LFT)',        category: 'Blood' },
  { name: 'Kidney Function Test (KFT)',       category: 'Blood' },
  { name: 'Chest X-Ray (PA View)',            category: 'Imaging' },
  { name: 'USG Abdomen & Pelvis',             category: 'Imaging' },
  { name: 'MRI Brain',                        category: 'Imaging' },
  { name: 'CT Scan Head',                     category: 'Imaging' },
  { name: 'Urine Routine & Microscopy',       category: 'Laboratory' },
  { name: 'Stool Routine',                    category: 'Laboratory' },
  { name: 'Sputum AFB',                       category: 'Laboratory' },
  { name: 'ECG',                              category: 'Cardiac' },
  { name: 'Echocardiogram (2D Echo)',         category: 'Cardiac' },
  { name: 'Treadmill Test (TMT)',             category: 'Cardiac' },
  { name: 'Vitamin D3 Level',                 category: 'Other' },
  { name: 'Vitamin B12 Level',                category: 'Other' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Medicines & Tests are stored per-CLINIC (clinic_id).
// Only admins can write (enforced at route level).
// All doctors within a clinic share the same list.
// ─────────────────────────────────────────────────────────────────────────────

class ClinicSettingService {

  // ─── MEDICINES ──────────────────────────────────────────────────────────────

  async getMedicines(clinicId) {
    let rows = await executeQuery(
      `SELECT * FROM clinic_medicines WHERE clinic_id = ? ORDER BY name ASC`,
      [clinicId]
    );
    // Auto-seed defaults for new clinics
    if (rows.length === 0) {
      await this.seedDefaultMedicines(clinicId);
      rows = await executeQuery(
        `SELECT * FROM clinic_medicines WHERE clinic_id = ? ORDER BY name ASC`,
        [clinicId]
      );
    }
    return rows;
  }

  async seedDefaultMedicines(clinicId) {
    for (const med of DEFAULT_MEDICINES) {
      await executeQuery(
        `INSERT INTO clinic_medicines (clinic_id, name, default_dosage, default_duration, default_food_relation, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [clinicId, med.name, med.default_dosage, med.default_duration, med.default_food_relation]
      );
    }
  }

  async getMedicineById(id, clinicId) {
    const rows = await executeQuery(
      `SELECT * FROM clinic_medicines WHERE id = ? AND clinic_id = ?`,
      [id, clinicId]
    );
    return rows[0] || null;
  }

  async addMedicine(clinicId, medicineData) {
    const { name, default_dosage = null, default_duration = null, default_food_relation = 'After Food' } = medicineData;
    const result = await executeQuery(
      `INSERT INTO clinic_medicines (clinic_id, name, default_dosage, default_duration, default_food_relation, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [clinicId, name, default_dosage, default_duration, default_food_relation]
    );
    return { id: result.insertId, clinic_id: clinicId, ...medicineData };
  }

  async updateMedicine(id, clinicId, medicineData) {
    const { name, default_dosage = null, default_duration = null, default_food_relation = 'After Food', is_active = true } = medicineData;
    const result = await executeQuery(
      `UPDATE clinic_medicines
       SET name = ?, default_dosage = ?, default_duration = ?, default_food_relation = ?, is_active = ?
       WHERE id = ? AND clinic_id = ?`,
      [name, default_dosage, default_duration, default_food_relation, is_active, id, clinicId]
    );
    if (result.affectedRows === 0) return null;
    return this.getMedicineById(id, clinicId);
  }

  async deleteMedicine(id, clinicId) {
    const result = await executeQuery(
      `DELETE FROM clinic_medicines WHERE id = ? AND clinic_id = ?`,
      [id, clinicId]
    );
    return result.affectedRows > 0;
  }

  // ─── TESTS ──────────────────────────────────────────────────────────────────

  async getTests(clinicId) {
    let rows = await executeQuery(
      `SELECT * FROM clinic_tests WHERE clinic_id = ? ORDER BY category ASC, name ASC`,
      [clinicId]
    );
    if (rows.length === 0) {
      await this.seedDefaultTests(clinicId);
      rows = await executeQuery(
        `SELECT * FROM clinic_tests WHERE clinic_id = ? ORDER BY category ASC, name ASC`,
        [clinicId]
      );
    }
    return rows;
  }

  async seedDefaultTests(clinicId) {
    for (const test of DEFAULT_TESTS) {
      await executeQuery(
        `INSERT INTO clinic_tests (clinic_id, name, category, is_active) VALUES (?, ?, ?, 1)`,
        [clinicId, test.name, test.category]
      );
    }
  }

  async getTestById(id, clinicId) {
    const rows = await executeQuery(
      `SELECT * FROM clinic_tests WHERE id = ? AND clinic_id = ?`,
      [id, clinicId]
    );
    return rows[0] || null;
  }

  async addTest(clinicId, testData) {
    const { name, category = 'Blood' } = testData;
    const result = await executeQuery(
      `INSERT INTO clinic_tests (clinic_id, name, category, is_active) VALUES (?, ?, ?, 1)`,
      [clinicId, name, category]
    );
    return { id: result.insertId, clinic_id: clinicId, ...testData };
  }

  async updateTest(id, clinicId, testData) {
    const { name, category = 'Blood', is_active = true } = testData;
    const result = await executeQuery(
      `UPDATE clinic_tests SET name = ?, category = ?, is_active = ? WHERE id = ? AND clinic_id = ?`,
      [name, category, is_active, id, clinicId]
    );
    if (result.affectedRows === 0) return null;
    return this.getTestById(id, clinicId);
  }

  async deleteTest(id, clinicId) {
    const result = await executeQuery(
      `DELETE FROM clinic_tests WHERE id = ? AND clinic_id = ?`,
      [id, clinicId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new ClinicSettingService();
