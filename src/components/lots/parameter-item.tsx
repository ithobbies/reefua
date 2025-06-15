import type React from 'react';
import { Card, CardContent } from '@/components/ui/card'; // Using Card for consistent styling if needed, or just divs

interface ParameterItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const ParameterItem: React.FC<ParameterItemProps> = ({ label, value, icon }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-md border">
      <div className="flex items-center">
        {icon && <span className="mr-2 text-primary">{icon}</span>}
        <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
};

export default ParameterItem;
