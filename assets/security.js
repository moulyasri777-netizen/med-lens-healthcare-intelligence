// MedLens Security & Input Validation Utilities
window.MedLensSecurity = {
  // Prevent XSS Injection by escaping special HTML characters
  escapeHTML: function(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Sanitize user inputs and trim whitespace
  sanitizeInput: function(str) {
    if (typeof str !== 'string') return '';
    return this.escapeHTML(str.trim());
  },

  // Validate patient profile details
  validatePatientProfile: function(patient) {
    var errors = {};
    if (!patient.name || patient.name.trim().length < 2) {
      errors.name = "Patient name must be at least 2 characters.";
    }
    var ageNum = parseInt(patient.age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
      errors.age = "Please provide a valid age between 0 and 130.";
    }
    var validBloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    if (patient.bloodGroup && validBloodGroups.indexOf(patient.bloodGroup.toUpperCase().trim()) === -1) {
      errors.bloodGroup = "Invalid blood group specified.";
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  },

  // Validate file upload size & format
  validateFile: function(file) {
    if (!file) return { isValid: false, error: "No file selected." };
    
    var maxBytes = (window.MedLensConfig ? window.MedLensConfig.maxFileUploadSizeMB : 15) * 1024 * 1024;
    if (file.size > maxBytes) {
      return { isValid: false, error: "File size exceeds the 15 MB limit." };
    }

    var ext = "." + file.name.split('.').pop().toLowerCase();
    var validExts = window.MedLensConfig ? window.MedLensConfig.supportedFileExtensions : [".pdf", ".png", ".jpg", ".jpeg"];
    if (validExts.indexOf(ext) === -1) {
      return { isValid: false, error: "Unsupported file format. Please upload a PDF or image file (.pdf, .png, .jpg)." };
    }

    return { isValid: true, error: null };
  }
};
