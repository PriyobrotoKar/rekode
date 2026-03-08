import { Logo } from '@rekode/ui/components/logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="bg-background flex h-screen w-full">
      {/* Left Panel - Background Image */}
      <div className="hidden flex-1 p-2 lg:block">
        <img
          src={'/images/auth-bg.jpg'}
          alt="Auth background"
          className="h-full w-full rounded-lg object-cover"
        />
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-full max-w-100 flex-col gap-20 px-6">
          {/* Logo */}
          <Logo />

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
