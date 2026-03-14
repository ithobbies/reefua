"use client";

import { useState } from "react";
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function SetAdminRolePage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSetAdminRole = async () => {
    if (!email) {
      setResult({ type: 'error', message: 'Будь ласка, введіть електронну адресу.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Make sure you have deployed the 'addAdminRole' function
      const addAdminRole = httpsCallable(functions, 'addAdminRole');
      const response = await addAdminRole({ email });
      const data = response.data as { message: string };
      setResult({ type: 'success', message: data.message });
    } catch (error: any) {
      console.error("Error setting admin role:", error);
      // It's useful to display the server's error message if available
      const errorMessage = error.details?.message || error.message || 'Сталася невідома помилка.';
      setResult({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Призначити роль Адміністратора</CardTitle>
          <CardDescription>
            Введіть email користувача, щоб надати йому права адміністратора. 
            Ця сторінка є тимчасовим інструментом.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Button
              onClick={handleSetAdminRole}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Призначення..." : "Призначити Адміністратором"}
            </Button>
          </div>
          {result && (
            <Alert className="mt-4" variant={result.type === 'error' ? 'destructive' : 'default'}>
              <Terminal className="h-4 w-4" />
              <AlertTitle>
                {result.type === 'success' ? 'Успіх!' : 'Помилка!'}
              </AlertTitle>
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>
          )}
           <div className="text-center mt-6 text-sm text-muted-foreground">
                <p>Після успішного призначення ролі, користувачу необхідно <strong>вийти з системи та увійти знову</strong>, щоб зміни набули чинності.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
