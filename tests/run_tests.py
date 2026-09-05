# MedLens Automated Test Runner (Python & JS Module Validator)
import re
import os
import sys

print("=================================================")
print("MEDLENS AUTOMATED TEST SUITE")
print("=================================================\n")

base_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(base_dir)
assets_dir = os.path.join(project_dir, "assets")

passed = 0
total = 0

def test(name, condition, err_msg=""):
    global passed, total
    total += 1
    if condition:
        passed += 1
        print(f"  [PASS] {name}")
    else:
        print(f"  [FAIL] {name} - {err_msg}")

# 1. Config Validation
config_path = os.path.join(assets_dir, "config.js")
with open(config_path, "r", encoding="utf-8") as f:
    config_code = f.read()

test("Config - Max File Size Defined", "maxFileUploadSizeMB: 15" in config_code)
test("Config - Categories Defined", "Blood & CBC" in config_code and "Diabetes & Sugar" in config_code)
test("Config - Medical Disclaimer Present", "disclaimers" in config_code and "educational information" in config_code)

# 2. Security Validation
sec_path = os.path.join(assets_dir, "security.js")
with open(sec_path, "r", encoding="utf-8") as f:
    sec_code = f.read()

test("Security - escapeHTML Method Implemented", "escapeHTML: function" in sec_code)
test("Security - XSS Regex Character Replacement", "replace(/&/g" in sec_code and "replace(/</g" in sec_code)
test("Security - File Validation Implemented", "validateFile: function" in sec_code)
test("Security - Patient Profile Validation Implemented", "validatePatientProfile: function" in sec_code)

# 3. NLP Engine Knowledge Base Validation
nlp_path = os.path.join(assets_dir, "medical-nlp.js")
with open(nlp_path, "r", encoding="utf-8") as f:
    nlp_code = f.read()

test("NLP - Hemoglobin Parameter KB Present", "Hemoglobin (Hb)" in nlp_code and "refLow: 12.0" in nlp_code)
test("NLP - Fasting Glucose KB Present", "Fasting Blood Glucose" in nlp_code and "refHigh: 100" in nlp_code)
test("NLP - Creatinine KB Present", "Serum Creatinine" in nlp_code)
test("NLP - Memoization Cache Implemented", "cache: {}" in nlp_code and "this.cache[cacheKey]" in nlp_code)
test("NLP - Demo Report Generator Present", "getDemoReport: function" in nlp_code)

# 4. Multi-Language Dictionary Validation
trans_path = os.path.join(assets_dir, "translations.js")
with open(trans_path, "r", encoding="utf-8") as f:
    trans_code = f.read()

langs = ['en:', 'hi:', 'te:', 'ta:', 'kn:', 'ml:', 'mr:', 'bn:']
for l in langs:
    test(f"Translations - Language '{l[:-1]}' Module", l in trans_code)

# 5. React Application & Semantic Structure
app_path = os.path.join(assets_dir, "medlens-app.jsx")
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

test("App - Semantic <header> Component", '<header className="medlens-navbar"' in app_code)
test("App - Semantic <main> Section", '<main id="main-content">' in app_code)
test("App - Problem Statement Alignment Section", "Bridging Patient Understanding & Medical Data" in app_code)
test("App - ARIA Live Status Announcements", 'role="status"' in app_code or 'aria-live="polite"' in app_code)

print("\n=================================================")
print(f"TEST RESULTS: {passed} / {total} TESTS PASSED ({round((passed/total)*100)}%)")
print("=================================================\n")

if passed < total:
    sys.exit(1)
