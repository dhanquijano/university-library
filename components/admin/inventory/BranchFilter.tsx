import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";

interface BranchFilterProps {
  branches: string[];
  selectedBranches: string[];
  onBranchChange: (branches: string[]) => void;
  className?: string;
}

const BranchFilter = ({ 
  branches, 
  selectedBranches, 
  onBranchChange, 
  className = "" 
}: BranchFilterProps) => {
  const handleBranchSelect = (branch: string) => {
    if (branch === "all") {
      onBranchChange([]);
    } else if (!selectedBranches.includes(branch)) {
      onBranchChange([...selectedBranches, branch]);
    }
  };

  const handleBranchRemove = (branch: string) => {
    onBranchChange(selectedBranches.filter(b => b !== branch));
  };

  const clearAllFilters = () => {
    onBranchChange([]);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filter by Branch:</span>
        </div>
        
        <Select onValueChange={handleBranchSelect}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select branch to filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches
              .filter(branch => !selectedBranches.includes(branch))
              .map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {selectedBranches.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Selected Branches */}
      {selectedBranches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center">Filtering by:</span>
          {selectedBranches.map((branch) => (
            <Badge
              key={branch}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {branch}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleBranchRemove(branch)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {selectedBranches.length === 0 && (
        <div className="text-xs text-gray-500">
          Showing data from all branches
        </div>
      )}
    </div>
  );
};

export default BranchFilter;