"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export function QuickActionsWidget() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard/lots/new">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Створити оголошення
        </Button>
      </Link>
    </div>
  );
}
