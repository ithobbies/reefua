
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "firebase/auth";
import GoogleIcon from '@/components/icons/google-icon';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const returnUrl = searchParams.get('returnUrl') || '/';
        router.push(returnUrl);
      }
    });
    return () => unsubscribe();
  }, [router, searchParams]);


  const redirectOnSuccess = () => {
    const returnUrl = searchParams.get('returnUrl') || '/';
    toast({ title: "Успішний вхід!", description: "Ласкаво просимо!" });
    router.push(returnUrl);
  };

  const handleAuthOperation = async (authFunction: () => Promise<any>) => {
    setError(null);
    try {
      await authFunction();
      redirectOnSuccess();
    } catch (error: any) {
      switch (error.code) {
        case 'auth/wrong-password': setError('Неправильний пароль. Спробуйте ще раз.'); break;
        case 'auth/user-not-found': setError('Користувача з таким email не знайдено.'); break;
        case 'auth/email-already-in-use': setError('Цей email вже використовується іншим акаунтом.'); break;
        case 'auth/popup-closed-by-user': break;
        default: setError('Виникла помилка. Спробуйте пізніше.');
      }
      console.error("Auth error:", error);
    }
  };

  const handleGoogleSignIn = () => handleAuthOperation(() => signInWithPopup(auth, new GoogleAuthProvider()));
  const handleSignIn = () => handleAuthOperation(() => signInWithEmailAndPassword(auth, email, password));
  const handleSignUp = () => handleAuthOperation(() => createUserWithEmailAndPassword(auth, email, password));

  const GoogleSignInButton = ({ children }: { children: React.ReactNode }) => (
    <Button 
      variant="outline" 
      className="w-full border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-600 dark:hover:bg-slate-800 dark:text-slate-200"
      onClick={handleGoogleSignIn}
    >
      <GoogleIcon className="mr-2 h-5 w-5" />
      {children}
    </Button>
  );

  return (
    <div className="container mx-auto flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Автентифікація</CardTitle>
          <CardDescription>Увійдіть або зареєструйтесь, щоб продовжити.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Вхід</TabsTrigger>
              <TabsTrigger value="signup">Реєстрація</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label htmlFor="email-signin">Email</Label><Input id="email-signin" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="password-signin">Пароль</Label><Input id="password-signin" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                {error && <p className="text-red-500 text-sm px-1">{error}</p>}
                <Button className="w-full" onClick={handleSignIn}>Увійти</Button>
                <GoogleSignInButton>Продовжити з Google</GoogleSignInButton>
              </div>
            </TabsContent>
            <TabsContent value="signup">
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label htmlFor="email-signup">Email</Label><Input id="email-signup" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="password-signup">Пароль</Label><Input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                {error && <p className="text-red-500 text-sm px-1">{error}</p>}
                <Button className="w-full" onClick={handleSignUp}>Зареєструватися</Button>
                <GoogleSignInButton>Продовжити з Google</GoogleSignInButton>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
