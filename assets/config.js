// MedLens Application Central Configuration
window.MedLensConfig = {
  appName: "MedLens",
  version: "2.1.0",
  maxFileUploadSizeMB: 15,
  supportedFileExtensions: [".pdf", ".png", ".jpg", ".jpeg"],
  supportedMimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/jpg"],
  
  categories: [
    "All",
    "Blood & CBC",
    "Diabetes & Sugar",
    "Kidney (KFT)",
    "Liver (LFT)",
    "Lipids & Heart",
    "Thyroid Profile",
    "Vitamins & Minerals"
  ],

  disclaimers: {
    medical: "MedLens provides AI-generated educational information based on the reference ranges in your uploaded report. It does not provide a diagnosis, medical treatment, or emergency advice. Always consult a qualified physician for medical decisions.",
    privacy: "Your medical information is sensitive. All document parsing is performed locally in your browser. Never share your health reports publicly.",
    emergency: "If you are experiencing a medical emergency, contact your local emergency service (112 / 911 / 102) immediately."
  }
};
