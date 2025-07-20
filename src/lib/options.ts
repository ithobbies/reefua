
// src/lib/options.ts

export const FLOW_OPTIONS = [
  { 
    value: "LOW",    
    label: "Низька",
    description: "Легке, майже непомітне коливання поліпів. Орієнтовна швидкість: < 10× обʼєм акваріума / год."
  },
  { 
    value: "MEDIUM", 
    label: "Помірна",
    description: "Поліпи плавно похитуються, немає прямого струменя. Орієнтовна швидкість: 10 – 20× обʼєм / год."
  },
  { 
    value: "HIGH",   
    label: "Висока",
    description: "Сильне, турбулентне, багатонаправлене течення. Орієнтовна швидкість: > 20× обʼєм / год."
  }
];

export const PAR_OPTIONS = [
  { 
    value: "PAR_LOW",        
    label: "Низький",
    description: "Діапазон: 0–100 µmol/m²/s. Підходить для м'яких коралів (Soft)."
  },
  { 
    value: "PAR_MEDIUM",     
    label: "Середній",
    description: "Діапазон: 100–200 µmol/m²/s. Підходить для LPS та світлолюбивих м'яких коралів."
  },
  { 
    value: "PAR_HIGH",       
    label: "Високий",
    description: "Діапазон: 200–400 µmol/m²/s. Підходить для більшості SPS та вимогливих LPS."
  },
  { 
    value: "PAR_VERY_HIGH",  
    label: "Дуже високий",
    description: "Діапазон: > 400 µmol/m²/s. Підходить для світлолюбивих Acropora та інших «High-end» SPS."
  }
];

// Helper to get a label from a value for display purposes
export const getLabelByValue = (
    options: { value: string; label: string }[], 
    value: string
): string => {
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value; // Return value itself if not found
};
