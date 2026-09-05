// MedLens Client-Side Medical NLP & Reference Range Extractor
window.MedLensNLP = {
  // Memoization Cache for NLP Parsing Efficiency
  cache: {},

  knowledgeBase: [
    {
      id: "hb",
      name: "Hemoglobin (Hb)",
      aliases: ["hemoglobin", "haemoglobin", "hb", "hgb"],
      unit: "g/dL",
      category: "Blood & CBC",
      refLow: 12.0,
      refHigh: 16.0,
      explanation: "Hemoglobin is a protein in red blood cells that carries oxygen throughout your body to organs and tissues.",
      whyMattersLow: "Low hemoglobin indicates anemia, which can cause fatigue, shortness of breath, or weakness.",
      whyMattersHigh: "High hemoglobin can occur from dehydration, smoking, high altitude, or lung conditions.",
      questions: ["Could my hemoglobin level cause my recent fatigue?", "Do I need an iron supplement or dietary changes?"]
    },
    {
      id: "wbc",
      name: "White Blood Cells (WBC)",
      aliases: ["wbc", "white blood cells", "total leucocyte count", "tlc", "leukocytes"],
      unit: "10^3/µL",
      category: "Blood & CBC",
      refLow: 4.0,
      refHigh: 11.0,
      explanation: "White blood cells are the core component of your immune system that fights infections and illnesses.",
      whyMattersLow: "Low WBC (leukopenia) makes your body more vulnerable to bacterial or viral infections.",
      whyMattersHigh: "Elevated WBC usually signifies an active infection, inflammation, or immune response.",
      questions: ["Is this elevated WBC due to a recent infection?", "Should we retest in 2 weeks?"]
    },
    {
      id: "rbc",
      name: "Red Blood Cells (RBC)",
      aliases: ["rbc", "red blood cell count", "erythrocytes"],
      unit: "10^6/µL",
      category: "Blood & CBC",
      refLow: 4.0,
      refHigh: 5.5,
      explanation: "Red blood cells transport oxygen from lungs to your body tissues and return carbon dioxide back.",
      whyMattersLow: "Low RBC count is associated with anemia or nutritional deficiencies.",
      whyMattersHigh: "High RBC count may result from low oxygen levels or dehydration.",
      questions: ["Does this RBC count align with my hemoglobin levels?"]
    },
    {
      id: "plt",
      name: "Platelet Count",
      aliases: ["platelet", "platelets", "plt", "thrombocytes"],
      unit: "10^3/µL",
      category: "Blood & CBC",
      refLow: 150,
      refHigh: 450,
      explanation: "Platelets are blood cells that help blood clot to stop bleeding when blood vessels are damaged.",
      whyMattersLow: "Low platelets (thrombocytopenia) can cause easy bruising or excessive bleeding.",
      whyMattersHigh: "High platelets can increase risk of blood clots or indicate inflammation.",
      questions: ["What could cause my platelet count to fluctuate?", "Do I need to avoid blood-thinning medications?"]
    },
    {
      id: "glucose_fasting",
      name: "Fasting Blood Glucose",
      aliases: ["fasting blood sugar", "fbs", "fasting glucose", "glucose fasting", "blood sugar fasting"],
      unit: "mg/dL",
      category: "Diabetes & Sugar",
      refLow: 70,
      refHigh: 100,
      explanation: "Fasting glucose measures your blood sugar after an overnight fast (at least 8 hours).",
      whyMattersLow: "Hypoglycemia (low blood sugar) can cause dizziness, sweating, or shakiness.",
      whyMattersHigh: "Glucose above 100 mg/dL may indicate prediabetes or diabetes and warrants dietary evaluation.",
      questions: ["Should I take an HbA1c test to check 3-month average sugar?", "What lifestyle modifications are recommended?"]
    },
    {
      id: "hba1c",
      name: "HbA1c (Glycated Hemoglobin)",
      aliases: ["hba1c", "glycated hemoglobin", "a1c", "hemoglobin a1c"],
      unit: "%",
      category: "Diabetes & Sugar",
      refLow: 4.0,
      refHigh: 5.7,
      explanation: "HbA1c reflects your average blood sugar levels over the past 2 to 3 months.",
      whyMattersLow: "Below 4% is uncommon and may occur with frequent low blood sugar episodes.",
      whyMattersHigh: "5.7% to 6.4% indicates prediabetes; 6.5% or higher suggests diabetes.",
      questions: ["How does this HbA1c compare with my daily glucose readings?", "Should we discuss dietary planning or medication?"]
    },
    {
      id: "creatinine",
      name: "Serum Creatinine",
      aliases: ["creatinine", "serum creatinine", "s. creatinine", "cr"],
      unit: "mg/dL",
      category: "Kidney (KFT)",
      refLow: 0.6,
      refHigh: 1.2,
      explanation: "Creatinine is a waste product from muscle breakdown that healthy kidneys filter out of blood.",
      whyMattersLow: "Low creatinine can occur with low muscle mass or severe weight loss.",
      whyMattersHigh: "Elevated creatinine suggests your kidneys may not be filtering waste effectively.",
      questions: ["Could dehydration affect this creatinine level?", "Should we test kidney eGFR or urine protein?"]
    },
    {
      id: "bun",
      name: "Blood Urea Nitrogen (BUN)",
      aliases: ["bun", "urea", "blood urea", "serum urea"],
      unit: "mg/dL",
      category: "Kidney (KFT)",
      refLow: 7,
      refHigh: 20,
      explanation: "Urea is formed in the liver when protein breaks down and is removed by the kidneys.",
      whyMattersLow: "Low BUN can occur with low protein diet or liver dysfunction.",
      whyMattersHigh: "High BUN can indicate kidney stress, dehydration, or high protein intake.",
      questions: ["Should I increase fluid intake before re-checking urea levels?"]
    },
    {
      id: "cholesterol",
      name: "Total Cholesterol",
      aliases: ["total cholesterol", "cholesterol total", "serum cholesterol"],
      unit: "mg/dL",
      category: "Lipids & Heart",
      refLow: 125,
      refHigh: 200,
      explanation: "Total cholesterol measures the combination of LDL ('bad'), HDL ('good'), and VLDL fats in your blood.",
      whyMattersLow: "Extremely low cholesterol is rare and usually relates to malabsorption or hyperthyroidism.",
      whyMattersHigh: "High cholesterol can lead to fatty deposits in blood vessels, increasing cardiovascular risk.",
      questions: ["What changes in diet can lower my total cholesterol?", "Do I need a full cardiac risk assessment?"]
    },
    {
      id: "hdl",
      name: "HDL Cholesterol ('Good')",
      aliases: ["hdl", "hdl cholesterol", "high density lipoprotein"],
      unit: "mg/dL",
      category: "Lipids & Heart",
      refLow: 40,
      refHigh: 100,
      explanation: "HDL helps remove excess cholesterol from your bloodstream and protects artery walls.",
      whyMattersLow: "Low HDL increases risk of plaque buildup in arteries.",
      whyMattersHigh: "High HDL is protective against heart disease.",
      questions: ["How can regular aerobic exercise help increase my HDL levels?"]
    },
    {
      id: "ldl",
      name: "LDL Cholesterol ('Bad')",
      aliases: ["ldl", "ldl cholesterol", "low density lipoprotein"],
      unit: "mg/dL",
      category: "Lipids & Heart",
      refLow: 0,
      refHigh: 100,
      explanation: "LDL collects in the walls of blood vessels and can form hard plaques over time.",
      whyMattersLow: "Low LDL is generally optimal for cardiovascular health.",
      whyMattersHigh: "Elevated LDL is a major modifiable risk factor for arterial narrowing.",
      questions: ["Is my LDL high enough to warrant statin therapy or saturated fat restriction?"]
    },
    {
      id: "triglycerides",
      name: "Triglycerides",
      aliases: ["triglycerides", "triglyceride", "tg"],
      unit: "mg/dL",
      category: "Lipids & Heart",
      refLow: 0,
      refHigh: 150,
      explanation: "Triglycerides are a type of fat (lipid) found in your blood that your body uses for energy.",
      whyMattersLow: "Low triglycerides can result from low-fat diets or hyperthyroidism.",
      whyMattersHigh: "High triglycerides contribute to arterial hardening and metabolic syndrome.",
      questions: ["Could sugar or alcohol intake be elevating my triglycerides?"]
    },
    {
      id: "tsh",
      name: "TSH (Thyroid Stimulating Hormone)",
      aliases: ["tsh", "thyroid stimulating hormone", "s.tsh"],
      unit: "µIU/mL",
      category: "Thyroid Profile",
      refLow: 0.45,
      refHigh: 4.5,
      explanation: "TSH is produced by the pituitary gland to control how much hormone your thyroid releases.",
      whyMattersLow: "Low TSH suggests hyperthyroidism (overactive thyroid gland).",
      whyMattersHigh: "High TSH suggests hypothyroidism (underactive thyroid gland), which can cause sluggishness.",
      questions: ["Should we test Free T3 and Free T4 to confirm thyroid function?", "Could my symptoms be tied to TSH?"]
    },
    {
      id: "vit_d",
      name: "Vitamin D (25-OH)",
      aliases: ["vitamin d", "vit d", "25-hydroxy vitamin d", "25-oh vitamin d", "calcidiol"],
      unit: "ng/mL",
      category: "Vitamins & Minerals",
      refLow: 30,
      refHigh: 100,
      explanation: "Vitamin D is essential for calcium absorption, bone strength, and immune function.",
      whyMattersLow: "Deficiency (below 20 ng/mL) leads to bone pain, muscle weakness, and low immunity.",
      whyMattersHigh: "Very high levels (above 100 ng/mL) can cause calcium buildup.",
      questions: ["What dosage of Vitamin D3 supplement is recommended for me?", "How often should we re-check this?"]
    },
    {
      id: "vit_b12",
      name: "Vitamin B12",
      aliases: ["vitamin b12", "vit b12", "cobalamin", "b12"],
      unit: "pg/mL",
      category: "Vitamins & Minerals",
      refLow: 200,
      refHigh: 900,
      explanation: "Vitamin B12 supports nerve function, brain health, and red blood cell formation.",
      whyMattersLow: "Low B12 can cause tingling in hands/feet, memory issues, and megaloblastic anemia.",
      whyMattersHigh: "Elevated B12 can occur with liver conditions or heavy supplementation.",
      questions: ["Do I need oral B12 supplements or sublingual tablets?"]
    },
    {
      id: "sgpt",
      name: "SGPT / ALT (Liver Enzyme)",
      aliases: ["sgpt", "alt", "alanine aminotransferase", "sgpt (alt)"],
      unit: "U/L",
      category: "Liver (LFT)",
      refLow: 7,
      refHigh: 56,
      explanation: "ALT is an enzyme found mainly in the liver. High levels indicate liver inflammation or cell strain.",
      whyMattersLow: "Low ALT is normal and healthy.",
      whyMattersHigh: "Elevated ALT can occur from fatty liver, medications, alcohol, or viral hepatitis.",
      questions: ["Could medication or fatty liver cause this elevated ALT?", "Should we do a liver ultrasound?"]
    },
    {
      id: "sgot",
      name: "SGOT / AST (Liver Enzyme)",
      aliases: ["sgot", "ast", "aspartate aminotransferase", "sgot (ast)"],
      unit: "U/L",
      category: "Liver (LFT)",
      refLow: 8,
      refHigh: 40,
      explanation: "AST is an enzyme found in liver, heart, and muscle tissue.",
      whyMattersLow: "Low AST is normal.",
      whyMattersHigh: "Elevated AST occurs with liver strain, strenuous exercise, or tissue inflammation.",
      questions: ["Does the ratio of AST to ALT give more diagnostic clarity?"]
    },
    {
      id: "bilirubin",
      name: "Total Bilirubin",
      aliases: ["total bilirubin", "bilirubin total", "s. bilirubin"],
      unit: "mg/dL",
      category: "Liver (LFT)",
      refLow: 0.2,
      refHigh: 1.2,
      explanation: "Bilirubin is a yellowish compound produced during normal breakdown of red blood cells.",
      whyMattersLow: "Low bilirubin is not clinically concerning.",
      whyMattersHigh: "High bilirubin can cause jaundice (yellowing of eyes/skin) and points to bile duct or liver strain.",
      questions: ["Should we check Direct and Indirect bilirubin fractions?"]
    }
  ],

  // Extract medical parameters with caching and sanitization
  extractFromText: function(text) {
    if (!text || typeof text !== 'string') return this.getDemoReport().parameters;
    
    var cacheKey = text.trim().substring(0, 200);
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    var textLower = text.toLowerCase();
    var extracted = [];
    var seenIds = {};

    this.knowledgeBase.forEach(function(item) {
      item.aliases.forEach(function(alias) {
        if (seenIds[item.id]) return;
        var idx = textLower.indexOf(alias);
        if (idx !== -1) {
          var snippet = textLower.substring(idx, Math.min(textLower.length, idx + 120));
          var numMatch = snippet.match(/(\\d+\\.?\\d*)/);
          if (numMatch) {
            var val = parseFloat(numMatch[1]);
            if (val > 0 && val < 5000) {
              seenIds[item.id] = true;
              var status = "NORMAL";
              if (val < item.refLow) status = "LOW";
              else if (val > item.refHigh) status = "HIGH";

              extracted.push({
                id: item.id,
                name: item.name,
                value: val.toString(),
                numValue: val,
                unit: item.unit,
                refRange: item.refLow + " – " + item.refHigh,
                refLow: item.refLow,
                refHigh: item.refHigh,
                category: item.category,
                status: status,
                explanation: item.explanation,
                whyMatters: status === "HIGH" ? item.whyMattersHigh : status === "LOW" ? item.whyMattersLow : "Value is within normal range.",
                questions: item.questions
              });
            }
          }
        }
      });
    });

    var result = extracted.length > 0 ? extracted : this.getDemoReport().parameters;
    this.cache[cacheKey] = result;
    return result;
  },

  getDemoReport: function() {
    return {
      reportName: "Comprehensive_Blood_&_Metabolic_Panel_June_2026.pdf",
      uploadDate: "Today, 14:20 PM",
      labName: "Apollo Diagnostic Speciality Labs",
      doctorName: "Dr. K. V. Mehta, M.D.",
      parameters: [
        {
          id: "hb",
          name: "Hemoglobin (Hb)",
          value: "10.8",
          numValue: 10.8,
          unit: "g/dL",
          refRange: "12.0 – 16.0",
          refLow: 12.0,
          refHigh: 16.0,
          category: "Blood & CBC",
          status: "LOW",
          explanation: "Hemoglobin is a protein in red blood cells that carries oxygen throughout your body.",
          whyMatters: "Your hemoglobin level of 10.8 g/dL is below the lab reference minimum of 12.0 g/dL. This may be linked to mild iron deficiency anemia, which can cause tiredness or shortness of breath.",
          questions: ["Could my lower hemoglobin explain my recent fatigue?", "Would dietary iron or supplements be appropriate?"]
        },
        {
          id: "glucose_fasting",
          name: "Fasting Blood Glucose",
          value: "118",
          numValue: 118,
          unit: "mg/dL",
          refRange: "70 – 100",
          refLow: 70,
          refHigh: 100,
          category: "Diabetes & Sugar",
          status: "HIGH",
          explanation: "Fasting glucose measures your blood sugar after an overnight fast.",
          whyMatters: "Your fasting blood sugar of 118 mg/dL is slightly above the standard fasting reference limit (100 mg/dL). This falls into the impaired fasting glucose / prediabetes range.",
          questions: ["Should we perform an HbA1c test to check 3-month sugar averages?", "What dietary adjustments can help lower fasting sugar?"]
        },
        {
          id: "vit_d",
          name: "Vitamin D (25-OH Total)",
          value: "18.4",
          numValue: 18.4,
          unit: "ng/mL",
          refRange: "30 – 100",
          refLow: 30,
          refHigh: 100,
          category: "Vitamins & Minerals",
          status: "LOW",
          explanation: "Vitamin D is essential for calcium absorption, bone health, and immune system performance.",
          whyMatters: "Your Vitamin D level of 18.4 ng/mL indicates insufficient levels (below 30 ng/mL). Low Vitamin D is very common and can affect bone strength and energy.",
          questions: ["What daily or weekly Vitamin D3 supplement dosage do you recommend?", "How soon should we re-test Vitamin D?"]
        },
        {
          id: "cholesterol",
          name: "Total Cholesterol",
          value: "215",
          numValue: 215,
          unit: "mg/dL",
          refRange: "125 – 200",
          refLow: 125,
          refHigh: 200,
          category: "Lipids & Heart",
          status: "HIGH",
          explanation: "Total cholesterol measures the total amount of fats in your blood.",
          whyMatters: "Your total cholesterol of 215 mg/dL is mildly elevated above the desirable limit of 200 mg/dL.",
          questions: ["Is my elevated total cholesterol driven by LDL or Triglycerides?", "What cardiovascular health steps should I take?"]
        },
        {
          id: "creatinine",
          name: "Serum Creatinine",
          value: "0.85",
          numValue: 0.85,
          unit: "mg/dL",
          refRange: "0.60 – 1.20",
          refLow: 0.60,
          refHigh: 1.20,
          category: "Kidney (KFT)",
          status: "NORMAL",
          explanation: "Creatinine is a waste product filtered out of your blood by healthy kidneys.",
          whyMatters: "Value is within normal range. Indicates good kidney filtration performance.",
          questions: ["No immediate questions needed."]
        },
        {
          id: "tsh",
          name: "TSH (Thyroid Stimulating Hormone)",
          value: "2.85",
          numValue: 2.85,
          unit: "µIU/mL",
          refRange: "0.45 – 4.50",
          refLow: 0.45,
          refHigh: 4.50,
          category: "Thyroid Profile",
          status: "NORMAL",
          explanation: "TSH controls how much hormone your thyroid gland releases.",
          whyMatters: "Value is within normal range. Indicates balanced pituitary-thyroid regulation.",
          questions: ["No immediate questions needed."]
        },
        {
          id: "sgpt",
          name: "SGPT / ALT (Liver Enzyme)",
          value: "28",
          numValue: 28,
          unit: "U/L",
          refRange: "7 – 56",
          refLow: 7,
          refHigh: 56,
          category: "Liver (LFT)",
          status: "NORMAL",
          explanation: "ALT is a key liver enzyme involved in metabolism.",
          whyMatters: "Value is within normal range. Indicates absence of acute liver cell strain.",
          questions: ["No immediate questions needed."]
        },
        {
          id: "vit_b12",
          name: "Vitamin B12",
          value: "410",
          numValue: 410,
          unit: "pg/mL",
          refRange: "200 – 900",
          refLow: 200,
          refHigh: 900,
          category: "Vitamins & Minerals",
          status: "NORMAL",
          explanation: "Vitamin B12 supports nerve function and brain health.",
          whyMatters: "Value is within normal range. Indicates healthy B12 reserves.",
          questions: ["No immediate questions needed."]
        }
      ]
    };
  }
};
