// src/app/admin/layout.tsx
"use client";

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/context/auth-context"; // Correctly import the useAuth hook
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, firestoreUser, loading } = useAuth(); // Use the hook
  const roles = firestoreUser?.roles || []; // Safely access roles

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !roles.includes("admin")) {
    redirect("/");
  }

  return <>{children}</>;
}
