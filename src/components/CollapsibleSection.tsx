import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  initialOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  initialOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white rounded-xl shadow-custom-medium border border-neutral-100 w-full">
      <div
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={toggleOpen}
      >
        <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-neutral-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-600" />
        )}
      </div>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
