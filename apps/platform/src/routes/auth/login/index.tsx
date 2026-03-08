import { SignInForm } from '@/features/auth/components/sign-in-form';
import LogoIconSvg from '@rekode/ui/assets/logo-icon.svg';
import { IconBrandGithub, IconBrandGoogle } from '@tabler/icons-react';
import { createFileRoute } from '@tanstack/react-router';

import { Button } from '@rekode/ui/components/button';
import { Field, FieldLabel } from '@rekode/ui/components/field';
import { Input } from '@rekode/ui/components/input';
import { Label } from '@rekode/ui/components/label';

export const Route = createFileRoute('/auth/login/')({
  component: SignInPage,
});

function SignInPage() {
  return <SignInForm />;
}
