/**
 * PrintPrescription.jsx
 * Professional clinic style A4 prescription
 */

import signatureImgSrc from "../../assets/qaisarSign.png";

const TIMING_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

const formatTiming = (timing) => {
  if (!timing) return "—";
  const arr = Array.isArray(timing)
    ? timing
    : Object.keys(timing).filter((k) => timing[k]);
  return arr.map((t) => TIMING_LABELS[t] || t).join(" · ") || "—";
};

const groupByCategory = (tests = []) =>
  tests.reduce((acc, t) => {
    const cat = t.category || "Other";
    (acc[cat] = acc[cat] || []).push(t);
    return acc;
  }, {});

const buildHTML = (patient, consultation, signatureSrc) => {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const prescriptionId = "RX-" + Math.floor(Math.random() * 100000);

  const {
    diagnosisProvisional = "",
    diagnosisNotes = "",
    testsRecommended = [],
    medications = [],
    doctorAdvice = "",
    followUpDays = 7,
    followUpInstructions = "",
  } = consultation;

  const testGroups = groupByCategory(testsRecommended);

  const testsHTML =
    testsRecommended.length === 0
      ? ""
      : Object.entries(testGroups)
          .map(
            ([cat, tests]) => `
      <p><b>${cat}:</b> ${tests
        .map((t) => t.name)
        .join(", ")}</p>
    `
          )
          .join("");

  const medsHTML =
    medications.length === 0
      ? ""
      : `
<table>
<thead>
<tr>
<th>Medicine</th>
<th>Dosage</th>
<th>Timing</th>
<th>Duration</th>
<th>Food</th>
</tr>
</thead>
<tbody>

${medications
  .map(
    (med) => `
<tr>
<td>${med.name || "—"}</td>
<td>${med.dosage || "—"}</td>
<td>${formatTiming(med.timing)}</td>
<td>${med.duration || "—"}</td>
<td>${med.foodRelation || "—"}</td>
</tr>
${
  med.instructions
    ? `<tr><td colspan="5" class="note">↳ ${med.instructions}</td></tr>`
    : ""
}
`
  )
  .join("")}

</tbody>
</table>
`;

  return `

<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8"/>
<title>Prescription</title>

<style>

*{
box-sizing:border-box;
margin:0;
padding:0;
}

html,body{
width:210mm;
height:297mm;
font-family:Segoe UI, Arial;
color:#2c3e50;
}

.page{
position:relative;
width:210mm;
height:297mm;
padding:12mm;
}

.header{
text-align:center;
border-bottom:3px solid #3498db;
padding-bottom:8px;
margin-bottom:8px;
}

.header h1{
font-size:22px;
}

.header p{
font-size:14px;
color:#777;
}

.doctor{
margin-top:4px;
font-size:14px;
}

.row{
display:grid;
grid-template-columns:1fr 1fr;
gap:8px;
margin-bottom:8px;
}

.box{
border:1px solid #ddd;
padding:6px;
border-radius:5px;
background:#fafafa;
}

.vitals{
display:grid;
grid-template-columns:repeat(5,1fr);
gap:6px;
margin-bottom:6px;
}

.vitals div{
text-align:center;
border:1px solid #ddd;
padding:5px;
border-radius:5px;
}

.section{
margin-top:8px;
}

.section h3{
color:#3498db;
border-left:4px solid #3498db;
padding-left:6px;
font-size:15px;
margin-bottom:4px;
text-transform:uppercase;
}

table{
width:100%;
border-collapse:collapse;
font-size:14px;
}

th,td{
border:1px solid #ddd;
padding:4px 6px;
text-align:left;
}

th{
background:#f2f6ff;
}

.note{
font-size:12px;
color:#666;
}

.footer{
position:absolute;
bottom:10mm;
right:20mm;
text-align:center;
}

.footer img{
height:60px;
display:block;
margin:auto;
}

.sigline{
border-top:1px solid #000;
padding-top:4px;
font-weight:600;
}

@media print{
@page{
size:A4;
margin:0;
}
}

</style>
</head>

<body>

<div class="page">

<div class="header">

<h1>Sunrise Medical Clinic</h1>
<p>21 MG Road, Bhopal | +91 9876543210</p>

<div class="doctor">
<b>Dr. Rajesh Sharma</b><br>
MBBS, MD (Medicine)<br>
Reg No: MP-24561
</div>

</div>


<div class="row">

<div class="box">

<p><b>Name:</b> ${patient?.name || "—"}</p>
<p><b>Age / Gender:</b> ${
    patient?.age ? patient.age + " yrs" : "—"
  } / ${patient?.gender || "—"}</p>
<p><b>Phone:</b> ${patient?.phone || "—"}</p>

</div>

<div class="box">

<p><b>Date:</b> ${today}</p>
<p><b>Prescription No:</b> ${prescriptionId}</p>
<p><b>Chief Complaint:</b> ${
    patient?.chief_complaint || "As discussed"
  }</p>

</div>

</div>


<div class="vitals">

<div>
<small>Weight</small><br>
${patient?.weight ? patient.weight + " kg" : "—"}
</div>

<div>
<small>BP</small><br>
${patient?.bp || "—"}
</div>

<div>
<small>Temp</small><br>
${patient?.temperature || "—"}
</div>

<div>
<small>Pulse</small><br>
${patient?.pulse_rate || "—"}
</div>

<div>
<small>SpO2</small><br>
${patient?.spo2 || "—"}
</div>

</div>


<div class="section">

<h3>Diagnosis</h3>

<div class="box">

<p><b>Provisional Diagnosis:</b> ${diagnosisProvisional || "—"}</p>

${
  diagnosisNotes
    ? `<p style="margin-top:4px"><b>Clinical Notes:</b> ${diagnosisNotes}</p>`
    : ""
}

</div>

</div>


${
  testsRecommended.length > 0
    ? `
<div class="section">

<h3>Recommended Tests</h3>

<div class="box">
${testsHTML}
</div>

</div>
`
    : ""
}


${
  medications.length > 0
    ? `
<div class="section">

<h3>Medications</h3>

${medsHTML}

</div>
`
    : ""
}


<div class="section">

<h3>Doctor Advice</h3>

<div class="box">

<p>${doctorAdvice || "—"}</p>

<p style="margin-top:4px"><b>Follow-up:</b> ${followUpDays} days</p>

${
  followUpInstructions
    ? `<p><b>Instructions:</b> ${followUpInstructions}</p>`
    : ""
}

</div>

</div>


<div class="footer">

${signatureSrc ? `<img src="${signatureSrc}"/>` : ""}

<div class="sigline">

Dr. Rajesh Sharma<br>
Doctor Signature

</div>

</div>

</div>

<script>

window.onload = () => window.print();

</script>

</body>

</html>
`;
};

export const printPrescription = (patient, consultationData) => {
  const html = buildHTML(patient, consultationData, signatureImgSrc);

  const win = window.open("", "_blank", "width=900,height=800");

  if (!win) {
    alert("Please allow pop-ups for printing.");
    return;
  }

  win.document.write(html);
  win.document.close();
};