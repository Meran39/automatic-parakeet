import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  initialOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, initialOpen = true }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="bg-neutral-50 rounded-xl shadow-custom-medium p-4 border border-neutral-100 w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-bold text-primary-700"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <div className="mt-4 transition-all duration-300 ease-in-out overflow-hidden">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;