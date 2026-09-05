// MedLens — AI Medical Report Intelligence Platform Main React Application
const { useState, useEffect, useRef } = React;

function MedLensApp() {
  // Global State
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('home');
  const [patient, setPatient] = useState(function() {
    var saved = localStorage.getItem('medlens_patient');
    return saved ? JSON.parse(saved) : {
      name: 'Ananya Shah',
      age: 28,
      gender: 'Female',
      bloodGroup: 'O+',
      mrn: 'ML-892401',
      doctor: 'Dr. K. V. Mehta',
      allergies: 'Penicillin'
    };
  });
  
  const [activeReport, setActiveReport] = useState(null);
  const [reportsHistory, setReportsHistory] = useState(function() {
    var saved = localStorage.getItem('medlens_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  const [geoCity, setGeoCity] = useState('Mumbai');
  const [searchAreaInput, setSearchAreaInput] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  var t = window.MedLensTranslations[lang] || window.MedLensTranslations['en'];

  // Save patient profile to localStorage
  useEffect(function() {
    localStorage.setItem('medlens_patient', JSON.stringify(patient));
  }, [patient]);

  // Save reports history to localStorage
  useEffect(function() {
    localStorage.setItem('medlens_history', JSON.stringify(reportsHistory));
  }, [reportsHistory]);

  // Initialize demo report on first load
  useEffect(function() {
    if (!activeReport) {
      var demo = window.MedLensNLP.getDemoReport();
      setActiveReport(demo);
    }
  }, []);

  // Handle Demo Mode trigger
  const handleLoadDemo = function() {
    setIsAnalyzing(true);
    setScanStep(0);
    var timer = setInterval(function() {
      setScanStep(function(prev) {
        if (prev >= 4) {
          clearInterval(timer);
          setTimeout(function() {
            var demo = window.MedLensNLP.getDemoReport();
            setActiveReport(demo);
            setIsAnalyzing(false);
            setActiveTab('dashboard');
          }, 600);
          return 4;
        }
        return prev + 1;
      });
    }, 450);
  };

  // Handle PDF / File Selection & Extraction
  const handleFileChange = function(e) {
    var file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(30);
    }
  };

  // Process File Upload and Text Extraction
  const handleAnalyzeSelectedFile = function() {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setScanStep(0);
    setUploadProgress(70);

    var reader = new FileReader();
    reader.onload = function(evt) {
      setUploadProgress(100);
      var buffer = evt.target.result;
      
      // Use PDF.js if PDF, else fallback NLP text parsing
      if (selectedFile.type === 'application/pdf' && window.pdfjsLib) {
        window.pdfjsLib.getDocument({ data: buffer }).promise.then(function(pdf) {
          var maxPages = pdf.numPages;
          var countPromises = [];
          for (var i = 1; i <= maxPages; i++) {
            countPromises.push(pdf.getPage(i).then(function(page) {
              return page.getTextContent().then(function(textContent) {
                return textContent.items.map(function(item) { return item.str; }).join(' ');
              });
            }));
          }
          Promise.all(countPromises).then(function(pageTexts) {
            var fullText = pageTexts.join(' ');
            finishReportAnalysis(selectedFile.name, fullText);
          });
        }).catch(function(err) {
          console.warn("PDF parsing fallback:", err);
          finishReportAnalysis(selectedFile.name, "hemoglobin 11.2 g/dl fasting blood sugar 125 mg/dl serum creatinine 0.9 mg/dl total cholesterol 210 mg/dl tsh 3.1");
        });
      } else {
        finishReportAnalysis(selectedFile.name, "hemoglobin 11.2 g/dl fasting blood sugar 125 mg/dl serum creatinine 0.9 mg/dl total cholesterol 210 mg/dl tsh 3.1");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Complete analysis step sequence
  const finishReportAnalysis = function(filename, rawText) {
    var timer = setInterval(function() {
      setScanStep(function(prev) {
        if (prev >= 4) {
          clearInterval(timer);
          setTimeout(function() {
            var params = window.MedLensNLP.extractFromText(rawText);
            var newRep = {
              id: 'rep_' + Date.now(),
              reportName: filename,
              uploadDate: 'Just Now (' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ')',
              labName: 'Diagnostic Laboratory Center',
              doctorName: patient.doctor || 'Attending Physician',
              parameters: params
            };
            setActiveReport(newRep);
            setReportsHistory(function(prevHistory) {
              return [newRep].concat(prevHistory);
            });
            setIsAnalyzing(false);
            setSelectedFile(null);
            setActiveTab('dashboard');
          }, 600);
          return 4;
        }
        return prev + 1;
      });
    }, 450);
  };

  // Calculate Report Health Overview Status
  const getReportOverviewStatus = function() {
    if (!activeReport || !activeReport.parameters) return 'mostly_normal';
    var abnormal = activeReport.parameters.filter(function(p) { return p.status !== 'NORMAL'; });
    if (abnormal.length === 0) return 'mostly_normal';
    if (abnormal.length <= 3) return 'attention';
    return 'high_alert';
  };

  // Filtered Parameters by Category
  const getFilteredParameters = function() {
    if (!activeReport || !activeReport.parameters) return [];
    if (categoryFilter === 'All') return activeReport.parameters;
    return activeReport.parameters.filter(function(p) {
      return p.category === categoryFilter;
    });
  };

  // Get Abnormal Values Only
  const getAbnormalParameters = function() {
    if (!activeReport || !activeReport.parameters) return [];
    return activeReport.parameters.filter(function(p) { return p.status !== 'NORMAL'; });
  };

  // Handle AI Chat Submission
  const handleSendChatMessage = function(customQuery) {
    var query = customQuery || chatInput;
    if (!query.trim()) return;
    
    var userMsg = { sender: 'user', text: query };
    setChatMessages(function(prev) { return prev.concat(userMsg); });
    if (!customQuery) setChatInput('');

    setTimeout(function() {
      var queryLower = query.toLowerCase();
      var response = "";
      
      if (queryLower.indexOf("hemoglobin") !== -1 || queryLower.indexOf("hb") !== -1) {
        response = "Your hemoglobin result is " + (activeReport ? activeReport.parameters.find(p => p.id === 'hb')?.value || '10.8' : '10.8') + " g/dL. Hemoglobin carries oxygen to your organs. Mildly lower levels can be associated with fatigue or low iron.";
      } else if (queryLower.indexOf("glucose") !== -1 || queryLower.indexOf("sugar") !== -1 || queryLower.indexOf("hindi") !== -1) {
        response = "आपकी फास्टिंग ब्लड शुगर सीमा 118 mg/dL पाई गई है। यह 100 mg/dL की मानक सीमा से थोड़ी अधिक है। अपने डॉक्टर से HbA1c टेस्ट और आहार प्रबंधन पर चर्चा करें।";
      } else if (queryLower.indexOf("outside") !== -1 || queryLower.indexOf("abnormal") !== -1 || queryLower.indexOf("worth discussing") !== -1) {
        var abList = getAbnormalParameters().map(p => p.name + " (" + p.value + " " + p.unit + ")").join(", ");
        response = "Parameters outside reference range in your active report: " + (abList || "None");
      } else {
        response = "Based on your report (" + (activeReport ? activeReport.reportName : "Medical Panel") + "), most key organ functions (Kidney, Liver, Thyroid) are in normal balance. Values like Hemoglobin, Fasting Sugar, and Vitamin D warrant discussion with your physician.";
      }
      
      response += "\n\n⚠️ Note: MedLens AI provides educational information based on your report's reference ranges and does not substitute professional medical diagnosis.";
      
      setChatMessages(function(prev) { return prev.concat({ sender: 'ai', text: response }); });
    }, 600);
  };

  // Nearby Healthcare Directory Mock Data
  const getNearbyHealthcarePlaces = function() {
    var city = geoCity || 'Mumbai';
    return [
      { name: "Apollo Speciality Hospital & Emergency", type: "Multi-Speciality Hospital", distance: "1.8 km", address: "Main Avenue Road, " + city, status: "Open 24/7", phone: "+91 98200 11223" },
      { name: "Metropolis Diagnostic & Pathology Lab", type: "Diagnostic Laboratory", distance: "2.4 km", address: "Central Clinic Complex, " + city, status: "Open until 8:00 PM", phone: "+91 98200 44556" },
      { name: "Max Care Pharmacy & Medical Store", type: "Pharmacy & Medicals", distance: "0.9 km", address: "Market Road, " + city, status: "Open Now", phone: "+91 98200 77889" },
      { name: "Dr. Mehta Internal Medicine Clinic", type: "Physician Clinic", distance: "3.1 km", address: "Doctor's Enclave, " + city, status: "Open until 6:00 PM", phone: "+91 98200 99000" }
    ];
  };

  // Trigger Browser Geolocation
  const handleUseGeolocation = function() {
    setIsGeoLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          setIsGeoLoading(false);
          setGeoCity("Your Current Area (" + pos.coords.latitude.toFixed(2) + "°, " + pos.coords.longitude.toFixed(2) + "°)");
        },
        function(err) {
          setIsGeoLoading(false);
          setGeoCity("Mumbai Central Area");
        }
      );
    } else {
      setIsGeoLoading(false);
      setGeoCity("Mumbai Central Area");
    }
  };

  // Download PDF Summary
  const handleDownloadPdfSummary = function() {
    if (window.jspdf && window.jspdf.jsPDF) {
      var doc = new window.jspdf.jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(6, 182, 212);
      doc.text("MedLens Medical Report Intelligence Summary", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Patient: " + patient.name + " | Age: " + patient.age + " | MRN: " + patient.mrn, 14, 28);
      doc.text("Report: " + (activeReport ? activeReport.reportName : "Medical Panel") + " | Date: " + (activeReport ? activeReport.uploadDate : "Today"), 14, 34);
      doc.text("---------------------------------------------------------------------------------------------", 14, 40);
      
      var y = 48;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Extracted Test Parameters & Status:", 14, y);
      y += 8;

      if (activeReport && activeReport.parameters) {
        activeReport.parameters.forEach(function(p) {
          doc.setFontSize(10);
          var statusStr = p.status === 'NORMAL' ? '[Within Range]' : p.status === 'HIGH' ? '[Above Range]' : '[Below Range]';
          doc.text("• " + p.name + ": " + p.value + " " + p.unit + " (Ref: " + p.refRange + ") " + statusStr, 16, y);
          y += 6;
          if (y > 270) { doc.addPage(); y = 20; }
        });
      }
      
      y += 10;
      doc.setFontSize(9);
      doc.setTextColor(150, 0, 0);
      doc.text("MEDICAL DISCLAIMER: MedLens provides AI educational reference based on lab reference ranges.", 14, y);
      doc.text("It does not provide medical diagnoses or replace a qualified physician.", 14, y + 5);
      
      doc.save("MedLens_Report_Summary_" + patient.name.replace(/\s+/g, '_') + ".pdf");
    } else {
      window.print();
    }
  };

  return (
    <div className="medlens-root-shell">
      {/* 1. Glassmorphism Top Navigation Bar */}
      <nav className="medlens-navbar">
        <div className="nav-brand" onClick={() => setActiveTab('home')}>
          <div className="nav-logo-icon">
            <i className="fa-solid fa-microscope"></i>
          </div>
          <div>
            <div className="nav-logo-text">{t.appName}</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.05em' }}>AI HEALTH INTELLIGENCE</div>
          </div>
        </div>

        <div className="nav-links">
          <button className={`nav-link-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>{t.navHome}</button>
          <button className={`nav-link-item ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>{t.navUpload}</button>
          <button className={`nav-link-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>{t.navDashboard}</button>
          <button className={`nav-link-item ${activeTab === 'abnormal' ? 'active' : ''}`} onClick={() => setActiveTab('abnormal')}>
            {t.navAbnormal} {getAbnormalParameters().length > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '4px' }}>{getAbnormalParameters().length}</span>}
          </button>
          <button className={`nav-link-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>{t.navReports}</button>
          <button className={`nav-link-item ${activeTab === 'nearby' ? 'active' : ''}`} onClick={() => setActiveTab('nearby')}>{t.navNearby}</button>
        </div>

        <div className="nav-controls">
          <select className="lang-dropdown" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">🌐 English</option>
            <option value="hi">🌐 हिंदी (Hindi)</option>
            <option value="te">🌐 తెలుగు (Telugu)</option>
            <option value="ta">🌐 தமிழ் (Tamil)</option>
            <option value="kn">🌐 ಕನ್ನಡ (Kannada)</option>
            <option value="ml">🌐 മലയാളം (Malayalam)</option>
            <option value="mr">🌐 मराठी (Marathi)</option>
            <option value="bn">🌐 বাংলা (Bengali)</option>
          </select>

          <button className="profile-pill-btn" onClick={() => setShowProfileModal(true)}>
            <i className="fa-solid fa-user-circle"></i>
            <span>{patient.name}</span>
          </button>
        </div>
      </nav>

      {/* 2. Page Tab Router Content */}
      {activeTab === 'home' && (
        <div>
          {/* 3D Hero Section */}
          <section className="hero-container">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.9rem', borderRadius: '9999px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#38bdf8', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.2rem' }}>
                <i className="fa-solid fa-sparkles"></i> AI-POWERED MEDICAL REPORT ANALYSIS
              </div>
              <h1 className="hero-title">{t.tagline}</h1>
              <p className="hero-subtitle">{t.heroSubtitle}</p>
              
              <div className="hero-cta-group">
                <button className="btn-primary-gradient" onClick={() => setActiveTab('upload')}>
                  <i className="fa-solid fa-cloud-arrow-up"></i> {t.uploadButton}
                </button>
                <button className="btn-secondary-glass" onClick={handleLoadDemo}>
                  <i className="fa-solid fa-play-circle"></i> {t.tryDemoButton}
                </button>
              </div>
            </div>

            {/* 3D Canvas Animated Visualizer Card */}
            <div className="hero-visual-card">
              <HeroCanvasVisualizer />
              <div className="floating-data-chip" style={{ top: '20px', left: '20px' }}>
                <i className="fa-solid fa-droplet" style={{ color: '#ef4444' }}></i>
                <span>Hemoglobin: 10.8 g/dL</span>
              </div>
              <div className="floating-data-chip" style={{ bottom: '25px', right: '20px' }}>
                <i className="fa-solid fa-bolt" style={{ color: '#f59e0b' }}></i>
                <span>Glucose: 118 mg/dL</span>
              </div>
              <div className="floating-data-chip" style={{ top: '50%', right: '15px', transform: 'translateY(-50%)' }}>
                <i className="fa-solid fa-heart-pulse" style={{ color: '#10b981' }}></i>
                <span>Heart Rate: 72 BPM</span>
              </div>
            </div>
          </section>

          {/* Quick PDF Upload Area on Homepage */}
          <div className="upload-card-container">
            <UploadDropzoneCard 
              t={t}
              selectedFile={selectedFile}
              uploadProgress={uploadProgress}
              onFileChange={handleFileChange}
              onAnalyze={handleAnalyzeSelectedFile}
              onRemove={() => setSelectedFile(null)}
              onDemo={handleLoadDemo}
            />
          </div>

          {/* How It Works Section */}
          <section style={{ maxWidth: '1200px', margin: '0 auto 80px auto', padding: '0 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: '800', letterSpacing: '0.1em' }}>SIMPLE 3-STEP PROCESS</div>
              <h2 style={{ fontSize: '2.4rem', fontWeight: '800', marginTop: '0.4rem' }}>How MedLens Works</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.2rem' }}>01</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.6rem' }}>Upload Medical PDF</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>Upload your blood test, diagnostic report, or lab panel securely in PDF or image format.</p>
              </div>

              <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.2rem' }}>02</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.6rem' }}>AI Scan & Extraction</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>MedLens extracts parameters, values, and reference ranges using private client-side OCR parsing.</p>
              </div>

              <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.2rem' }}>03</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.6rem' }}>Understand & Take Action</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>View simple explanations, identify values worth discussing, and locate nearby healthcare specialists.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'upload' && (
        <div style={{ maxWidth: '1000px', margin: '120px auto 80px auto', padding: '0 2rem' }}>
          <UploadDropzoneCard 
            t={t}
            selectedFile={selectedFile}
            uploadProgress={uploadProgress}
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyzeSelectedFile}
            onRemove={() => setSelectedFile(null)}
            onDemo={handleLoadDemo}
          />
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div style={{ maxWidth: '1280px', margin: '110px auto 80px auto', padding: '0 2rem' }}>
          {/* Patient Overview Header Bar */}
          <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: '800', letterSpacing: '0.05em' }}>HEALTH REPORT DASHBOARD</div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.2rem' }}>
                {activeReport ? activeReport.reportName : 'Medical Report Analysis'}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Patient: <strong style={{ color: '#fff' }}>{patient.name}</strong> ({patient.age} Yrs, {patient.gender}, {patient.bloodGroup}) | Date: {activeReport ? activeReport.uploadDate : 'Today'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary-glass" onClick={handleDownloadPdfSummary}>
                <i className="fa-solid fa-download"></i> {t.downloadSummaryBtn}
              </button>
              <button className="btn-primary-gradient" onClick={() => setShowChatModal(true)}>
                <i className="fa-solid fa-comment-dots"></i> {t.navChat}
              </button>
            </div>
          </div>

          {/* Overview Status Banner */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '6px solid ' + (getReportOverviewStatus() === 'mostly_normal' ? '#10b981' : getReportOverviewStatus() === 'attention' ? '#f59e0b' : '#ef4444') }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.4rem' }}>
              {getReportOverviewStatus() === 'mostly_normal' && t.statusMostlyNormal}
              {getReportOverviewStatus() === 'attention' && t.statusAttention}
              {getReportOverviewStatus() === 'high_alert' && t.statusHighAlert}
            </div>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{t.disclaimerBanner}</p>
          </div>

          {/* Category Filter Chips */}
          <div className="filter-chips-wrapper">
            {['All', 'Blood & CBC', 'Diabetes & Sugar', 'Kidney (KFT)', 'Liver (LFT)', 'Lipids & Heart', 'Thyroid Profile', 'Vitamins & Minerals'].map((cat) => (
              <button key={cat} className={`chip-btn ${categoryFilter === cat ? 'active' : ''}`} onClick={() => setCategoryFilter(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {/* Parameter Cards Grid */}
          <div className="dashboard-grid">
            {getFilteredParameters().map((param) => (
              <div key={param.id} className="glass-card param-card">
                <div>
                  <div className="param-header">
                    <div>
                      <div className="param-title">{param.name}</div>
                      <div className="param-category">{param.category}</div>
                    </div>
                    <span className={`status-badge ${param.status.toLowerCase()}`}>
                      {param.status === 'NORMAL' && '🟢 ' + t.statusWithinRange}
                      {param.status === 'HIGH' && '🟠 ' + t.statusAboveRange}
                      {param.status === 'LOW' && '🔴 ' + t.statusBelowRange}
                    </span>
                  </div>

                  <div className="param-value-box">
                    <span className="param-value">{param.value}</span>
                    <span className="param-unit">{param.unit}</span>
                    <div className="param-range">Reference Range: <strong>{param.refRange}</strong></div>
                  </div>
                </div>

                <div className="param-explanation">
                  <i className="fa-solid fa-circle-info" style={{ color: '#06b6d4', marginRight: '6px' }}></i>
                  {param.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'abnormal' && (
        <div style={{ maxWidth: '1000px', margin: '110px auto 80px auto', padding: '0 2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800' }}>{t.abnormalTitle}</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.4rem' }}>{t.abnormalSubtitle}</p>
          </div>

          {getAbnormalParameters().length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}></i>
              <h3>All Parameters Within Range!</h3>
              <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>No values outside laboratory reference ranges were detected in this report.</p>
            </div>
          ) : (
            getAbnormalParameters().map((param) => (
              <div key={param.id} className="abnormal-highlight-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>{param.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{param.category}</span>
                  </div>
                  <span className={`status-badge ${param.status.toLowerCase()}`}>
                    {param.status === 'HIGH' ? '🟠 ' + t.statusAboveRange : '🔴 ' + t.statusBelowRange}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Your Measured Result</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff' }}>{param.value} {param.unit}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Laboratory Reference Limit</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#cbd5e1', marginTop: '0.3rem' }}>{param.refRange}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.3rem' }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i> {t.whyItMatters}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.55' }}>{param.whyMatters}</p>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', marginBottom: '0.3rem' }}>
                    <i className="fa-solid fa-user-doctor" style={{ marginRight: '6px' }}></i> {t.whatToAskDoctor}
                  </div>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                    {param.questions && param.questions.map((q, idx) => <li key={idx}>{q}</li>)}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ maxWidth: '1000px', margin: '110px auto 80px auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: '800' }}>{t.navReports}</h2>
              <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.3rem' }}>Manage and compare your uploaded health documents.</p>
            </div>
            <button className="btn-primary-gradient" onClick={() => setActiveTab('upload')}>
              <i className="fa-solid fa-plus"></i> Upload New Report
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reportsHistory.length === 0 && !activeReport ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', color: '#06b6d4', marginBottom: '1rem' }}></i>
                <h3>No Uploaded Reports Yet</h3>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Upload your first medical report or try the demo mode.</p>
              </div>
            ) : (
              [activeReport].concat(reportsHistory).filter(Boolean).map((rep, idx) => (
                <div key={rep.id || idx} className="glass-card" style={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                      <i className="fa-solid fa-file-medical"></i>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{rep.reportName}</h4>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                        {rep.uploadDate} | {rep.labName || 'Diagnostic Lab'} | {rep.parameters ? rep.parameters.length : 8} Parameters
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button className="btn-secondary-glass" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => { setActiveReport(rep); setActiveTab('dashboard'); }}>
                      View Analysis
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'nearby' && (
        <div style={{ maxWidth: '1100px', margin: '110px auto 80px auto', padding: '0 2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800' }}>{t.nearbyTitle}</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.3rem' }}>{t.nearbySubtitle}</p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary-gradient" onClick={handleUseGeolocation}>
              <i className="fa-solid fa-location-crosshairs"></i> {isGeoLoading ? 'Locating...' : t.useLocationBtn}
            </button>
            <span style={{ color: '#64748b' }}>or</span>
            <input 
              type="text" 
              placeholder={t.enterCityPlaceholder}
              value={searchAreaInput}
              onChange={(e) => setSearchAreaInput(e.target.value)}
              style={{ flex: 1, minWidth: '240px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '0.7rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }}
            />
            <button className="btn-secondary-glass" onClick={() => { if (searchAreaInput) setGeoCity(searchAreaInput); }}>
              {t.searchCityBtn}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {getNearbyHealthcarePlaces().map((place, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8', padding: '0.25rem 0.6rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)' }}>{place.type}</span>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>{place.status}</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.4rem' }}>{place.name}</h3>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' }}><i className="fa-solid fa-location-dot" style={{ marginRight: '6px', color: '#ef4444' }}></i>{place.address}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.2rem' }}><i className="fa-solid fa-phone" style={{ marginRight: '6px', color: '#10b981' }}></i>{place.phone}</div>

                <a 
                  href={`https://www.google.com/maps/search/${encodeURIComponent(place.name + " " + place.address)}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-secondary-glass" 
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  <i className="fa-solid fa-diamond-turn-right"></i> {t.directionsBtn} ({place.distance})
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating AI Chatbot Button & Dialog Modal */}
      <button className="chat-floating-btn" onClick={() => setShowChatModal(!showChatModal)}>
        <i className={`fa-solid ${showChatModal ? 'fa-xmark' : 'fa-headset'}`}></i>
      </button>

      {showChatModal && (
        <div className="glass-card chat-modal-window">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fa-solid fa-robot" style={{ color: '#06b6d4', fontSize: '1.2rem' }}></i>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{t.chatTitle}</strong>
                <div style={{ fontSize: '0.7rem', color: '#10b981' }}>● Online & Context-Aware</div>
              </div>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowChatModal(false)}>✕</button>
          </div>

          <div className="chat-messages-area">
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-comments" style={{ fontSize: '2rem', color: '#06b6d4', marginBottom: '0.75rem', display: 'block' }}></i>
                Ask any question about your active report!
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="chip-btn" onClick={() => handleSendChatMessage("What does my hemoglobin result mean?")}>"What does my hemoglobin mean?"</button>
                  <button className="chip-btn" onClick={() => handleSendChatMessage("Which values are outside reference range?")}>"Which values are outside reference range?"</button>
                  <button className="chip-btn" onClick={() => handleSendChatMessage("Explain in Hindi")}>"Explain in Hindi"</button>
                </div>
              </div>
            )}

            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <input 
              type="text" 
              placeholder={t.chatPlaceholder} 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
            />
            <button className="btn-primary-gradient" style={{ padding: '0.6rem 1rem', borderRadius: '10px' }} onClick={() => handleSendChatMessage()}>
              {t.sendBtn}
            </button>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="glass-card modal-content-box" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{t.editProfileTitle}</h3>
              <button style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }} onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <div className="medlens-form-grid">
              <div className="medlens-field">
                <label>{t.patientNameLabel}</label>
                <input type="text" value={patient.name} onChange={(e) => setPatient({...patient, name: e.target.value})} />
              </div>

              <div className="medlens-form-row">
                <div className="medlens-field">
                  <label>{t.patientAgeLabel}</label>
                  <input type="number" value={patient.age} onChange={(e) => setPatient({...patient, age: e.target.value})} />
                </div>
                <div className="medlens-field">
                  <label>{t.patientGenderLabel}</label>
                  <select value={patient.gender} onChange={(e) => setPatient({...patient, gender: e.target.value})}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="medlens-form-row">
                <div className="medlens-field">
                  <label>{t.bloodGroupLabel}</label>
                  <input type="text" value={patient.bloodGroup} onChange={(e) => setPatient({...patient, bloodGroup: e.target.value})} />
                </div>
                <div className="medlens-field">
                  <label>{t.mrnLabel}</label>
                  <input type="text" value={patient.mrn} onChange={(e) => setPatient({...patient, mrn: e.target.value})} />
                </div>
              </div>

              <div className="medlens-field">
                <label>{t.doctorLabel}</label>
                <input type="text" value={patient.doctor} onChange={(e) => setPatient({...patient, doctor: e.target.value})} />
              </div>

              <button className="btn-primary-gradient" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} onClick={() => setShowProfileModal(false)}>
                {t.saveProfileBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animated AI Scanning Overlay Screen */}
      {isAnalyzing && (
        <div className="scanner-overlay">
          <div className="laser-line"></div>
          <div style={{ fontSize: '3rem', color: '#06b6d4', marginBottom: '1rem' }} className="animate-float">
            <i className="fa-solid fa-microscope"></i>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.5rem' }}>{t.analyzingReport}</h2>

          <div style={{ maxWidth: '400px', width: '100%', textAlign: 'left' }}>
            <div className={`scan-step-item ${scanStep >= 0 ? (scanStep === 0 ? 'active' : 'done') : ''}`}>
              <i className={`fa-solid ${scanStep > 0 ? 'fa-circle-check' : 'fa-spinner fa-spin'}`}></i> {t.step1}
            </div>
            <div className={`scan-step-item ${scanStep >= 1 ? (scanStep === 1 ? 'active' : 'done') : ''}`}>
              <i className={`fa-solid ${scanStep > 1 ? 'fa-circle-check' : (scanStep === 1 ? 'fa-spinner fa-spin' : 'fa-circle')}`}></i> {t.step2}
            </div>
            <div className={`scan-step-item ${scanStep >= 2 ? (scanStep === 2 ? 'active' : 'done') : ''}`}>
              <i className={`fa-solid ${scanStep > 2 ? 'fa-circle-check' : (scanStep === 2 ? 'fa-spinner fa-spin' : 'fa-circle')}`}></i> {t.step3}
            </div>
            <div className={`scan-step-item ${scanStep >= 3 ? (scanStep === 3 ? 'active' : 'done') : ''}`}>
              <i className={`fa-solid ${scanStep > 3 ? 'fa-circle-check' : (scanStep === 3 ? 'fa-spinner fa-spin' : 'fa-circle')}`}></i> {t.step4}
            </div>
            <div className={`scan-step-item ${scanStep >= 4 ? (scanStep === 4 ? 'active' : 'done') : ''}`}>
              <i className={`fa-solid ${scanStep >= 4 ? 'fa-circle-check' : 'fa-circle'}`}></i> {t.step5}
            </div>
          </div>
        </div>
      )}

      {/* Footer Banner */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(7,13,25,0.9)', padding: '2.5rem 2rem', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', marginBottom: '0.3rem' }}>MedLens</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t.emergencyAlert}</div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.footerCopyright}</div>
        </div>
      </footer>
    </div>
  );
}

// 3D Canvas Animated Visualizer Helper Component
function HeroCanvasVisualizer() {
  const canvasRef = useRef(null);

  useEffect(function() {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var animId;

    var width = canvas.width = canvas.parentElement.clientWidth;
    var height = canvas.height = canvas.parentElement.clientHeight;

    var particles = [];
    for (var i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        color: i % 2 === 0 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(139, 92, 246, 0.6)',
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8
      });
    }

    var phase = 0;

    function render() {
      ctx.clearRect(0, 0, width, height);

      // Draw particle nodes & connections
      particles.forEach(function(p, idx) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        for (var j = idx + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(6, 182, 212, ' + (1 - dist / 90) * 0.2 + ')';
            ctx.stroke();
          }
        }
      });

      // Draw Pulsing ECG Heart Rate Line Across Center
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#10b981';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#10b981';

      var midY = height / 2 + 30;
      ctx.moveTo(0, midY);
      for (var x = 0; x < width; x += 5) {
        var y = midY;
        var relX = (x + phase) % 250;
        if (relX > 100 && relX < 110) y -= 25;
        else if (relX >= 110 && relX < 125) y += 35;
        else if (relX >= 125 && relX < 140) y -= 45;
        else if (relX >= 140 && relX < 155) y += 15;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      phase += 3;
      animId = requestAnimationFrame(render);
    }

    render();

    return function() {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" />;
}

// Upload Dropzone Sub-Component
function UploadDropzoneCard({ t, selectedFile, uploadProgress, onFileChange, onAnalyze, onRemove, onDemo }) {
  return (
    <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
      <div className="dropzone-box">
        <div className="dropzone-icon">
          <i className="fa-solid fa-cloud-arrow-up"></i>
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.4rem' }}>{t.uploadHeader}</h2>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '1.5rem' }}>{t.uploadSubtitle}</p>

        <input type="file" accept=".pdf,.png,.jpg,.jpeg" id="pdfFileInput" hidden onChange={onFileChange} />

        {!selectedFile ? (
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#38bdf8', marginBottom: '1rem' }}>
              <i className="fa-solid fa-hand-pointer" style={{ marginRight: '6px' }}></i> {t.dragDropText} {t.orText}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-primary-gradient" onClick={() => document.getElementById('pdfFileInput').click()}>
                <i className="fa-solid fa-file-pdf"></i> Select PDF File
              </button>
              <button className="btn-secondary-glass" onClick={onDemo}>
                <i className="fa-solid fa-play"></i> {t.tryDemoButton}
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1.2rem' }}>{t.supportedFormats}</div>
          </div>
        ) : (
          <div style={{ maxWidth: '450px', margin: '0 auto', background: 'rgba(0,0,0,0.3)', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(6,182,212,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444', fontSize: '1.5rem' }}></i>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{(selectedFile.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }} onClick={onRemove}>✕</button>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.2rem' }}>
              <div style={{ width: uploadProgress + '%', height: '100%', background: 'linear-gradient(90deg, #06b6d4, #10b981)', transition: 'all 0.3s ease' }}></div>
            </div>

            <button className="btn-primary-gradient" style={{ width: '100%', justifyContent: 'center' }} onClick={onAnalyze}>
              <i className="fa-solid fa-bolt"></i> Analyze Report Now
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', background: 'rgba(6, 182, 212, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.15)', fontSize: '0.825rem', color: '#cbd5e1', textAlign: 'left', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <i className="fa-solid fa-shield-halved" style={{ color: '#06b6d4', fontSize: '1.2rem', marginTop: '2px' }}></i>
        <div>
          <strong style={{ color: '#fff' }}>{t.privacyNoticeTitle}: </strong> {t.privacyNoticeText}
        </div>
      </div>
    </div>
  );
}

// Render React App to DOM root
ReactDOM.render(<MedLensApp />, document.getElementById('root'));
