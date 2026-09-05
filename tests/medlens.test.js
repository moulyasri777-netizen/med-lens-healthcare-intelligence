// MedLens Automated Unit & Integration Test Suite
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=================================================");
console.log("🧪 RUNNING MEDLENS AUTOMATED TEST SUITE");
console.log("=================================================\n");

var passedCount = 0;
var totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    passedCount++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// Mock browser window environment for Node.js test execution
global.window = {};

// Load modules
const securityCode = fs.readFileSync(path.join(__dirname, '../assets/security.js'), 'utf8');
eval(securityCode);

const configCode = fs.readFileSync(path.join(__dirname, '../assets/config.js'), 'utf8');
eval(configCode);

const translationsCode = fs.readFileSync(path.join(__dirname, '../assets/translations.js'), 'utf8');
eval(translationsCode);

const nlpCode = fs.readFileSync(path.join(__dirname, '../assets/medical-nlp.js'), 'utf8');
eval(nlpCode);

console.log("1. SECURITY & INPUT SANITIZATION TESTS");
test("XSS HTML Escaping - Script Tag Injection", function() {
  var input = "<script>alert('XSS')</script>";
  var sanitized = global.window.MedLensSecurity.escapeHTML(input);
  assert.strictEqual(sanitized, "&lt;script&gt;alert('XSS')&lt;/script&gt;");
});

test("XSS HTML Escaping - Attribute Injection", function() {
  var input = 'img src="x" onerror="alert(1)"';
  var sanitized = global.window.MedLensSecurity.escapeHTML(input);
  assert.strictEqual(sanitized, 'img src=&quot;x&quot; onerror=&quot;alert(1)&quot;');
});

test("File Upload Validation - Allowed PDF", function() {
  var mockFile = { name: "test_report.pdf", size: 2 * 1024 * 1024 };
  var res = global.window.MedLensSecurity.validateFile(mockFile);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.error, null);
});

test("File Upload Validation - Disallowed Executable", function() {
  var mockFile = { name: "malicious.exe", size: 1024 };
  var res = global.window.MedLensSecurity.validateFile(mockFile);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.error.indexOf("Unsupported file format") !== -1);
});

test("File Upload Validation - Oversized File (>15MB)", function() {
  var mockFile = { name: "huge_panel.pdf", size: 20 * 1024 * 1024 };
  var res = global.window.MedLensSecurity.validateFile(mockFile);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.error.indexOf("15 MB limit") !== -1);
});

test("Patient Profile Validation - Valid Patient", function() {
  var profile = { name: "Ananya Shah", age: "28", bloodGroup: "O+" };
  var res = global.window.MedLensSecurity.validatePatientProfile(profile);
  assert.strictEqual(res.isValid, true);
});

test("Patient Profile Validation - Invalid Age Bounds", function() {
  var profile = { name: "Test User", age: "250", bloodGroup: "O+" };
  var res = global.window.MedLensSecurity.validatePatientProfile(profile);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.age);
});

console.log("\n2. MEDICAL NLP & REFERENCE RANGE EXTRACTION TESTS");
test("NLP Text Extraction - Low Hemoglobin Detection", function() {
  var text = "Patient Blood Count Report: Hemoglobin 10.8 g/dL (Reference 12.0 - 16.0 g/dL)";
  var params = global.window.MedLensNLP.extractFromText(text);
  var hb = params.find(p => p.id === 'hb');
  assert.ok(hb, "Hemoglobin parameter should be extracted");
  assert.strictEqual(hb.value, "10.8");
  assert.strictEqual(hb.status, "LOW");
});

test("NLP Text Extraction - High Fasting Glucose Detection", function() {
  var text = "Metabolic Panel: Fasting Glucose 118 mg/dL (Reference 70 - 100 mg/dL)";
  var params = global.window.MedLensNLP.extractFromText(text);
  var glucose = params.find(p => p.id === 'glucose_fasting');
  assert.ok(glucose, "Glucose parameter should be extracted");
  assert.strictEqual(glucose.value, "118");
  assert.strictEqual(glucose.status, "HIGH");
});

test("NLP Text Extraction - Normal Serum Creatinine", function() {
  var text = "Kidney Function Test: Serum Creatinine 0.85 mg/dL (Reference 0.60 - 1.20 mg/dL)";
  var params = global.window.MedLensNLP.extractFromText(text);
  var cr = params.find(p => p.id === 'creatinine');
  assert.ok(cr, "Creatinine parameter should be extracted");
  assert.strictEqual(cr.value, "0.85");
  assert.strictEqual(cr.status, "NORMAL");
});

test("NLP Demo Fallback Report Generation", function() {
  var demo = global.window.MedLensNLP.getDemoReport();
  assert.ok(demo.reportName);
  assert.ok(demo.parameters.length >= 8);
});

console.log("\n3. MULTI-LANGUAGE TRANSLATION DICTIONARY TESTS");
test("Language Dictionary - 8 Supported Languages Present", function() {
  var langs = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn'];
  langs.forEach(function(langKey) {
    assert.ok(global.window.MedLensTranslations[langKey], `Language dictionary for ${langKey} should exist`);
    assert.ok(global.window.MedLensTranslations[langKey].appName, `AppName translation for ${langKey} should exist`);
  });
});

console.log("\n=================================================");
console.log(`📊 TEST RESULTS: ${passedCount} / ${totalCount} TESTS PASSED (${Math.round((passedCount/totalCount)*100)}%)`);
console.log("=================================================\n");

if (passedCount < totalCount) {
  process.exit(1);
}
