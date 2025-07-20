
import type React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getLabelByValue, FLOW_OPTIONS, PAR_OPTIONS, difficultyOptions } from '@/lib/options';

interface ParameterItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const ParameterItem: React.FC<ParameterItemProps> = ({ label, value, icon }) => {
  
  let displayValue = value;

  // Determine which options to use based on the label
  if (label === 'Течія' && value) {
    displayValue = getLabelByValue(FLOW_OPTIONS, value);
  } else if (label === 'PAR' && value) {
    displayValue = getLabelByValue(PAR_OPTIONS, value);
  } else if (label === 'Складність' && value) {
    displayValue = getLabelByValue(difficultyOptions, value);
  }

  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-md border">
      <div className="flex items-center">
        {icon && <span className="mr-2 text-primary">{icon}</span>}
        <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      </div>
      <span className="text-sm font-semibold text-foreground text-right">{displayValue}</span>
    </div>
  );
};

export default ParameterItem;
