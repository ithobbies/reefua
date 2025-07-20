
import { Suspense } from 'react';
import LoginForm from '@/components/login/login-form';
import LoginSkeleton from '@/components/login/login-skeleton';

const LoginPage = () => {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
