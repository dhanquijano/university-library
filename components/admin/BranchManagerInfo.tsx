import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Info } from "lucide-react";
import { useAdminRole, useBranchMap } from "@/lib/admin-utils";

const BranchManagerInfo = () => {
  const { userRole, userBranch } = useAdminRole();
  const { getBranchName, isLoading } = useBranchMap();

  // Only show for managers with assigned branches
  if (userRole !== "MANAGER" || !userBranch) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Managing Branch:
            </span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {getBranchName(userBranch)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-blue-700">
            <Info className="h-4 w-4" />
            <span className="text-xs">
              Data is automatically filtered to show only your branch
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchManagerInfo;