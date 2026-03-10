import { Controller, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { OAuthProvider } from '@rekode/types/client/proto/auth';
import { IconBrandGithub, IconBrandGoogleFilled, IconLoader2 } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { Link, useLoaderData, useNavigate, useSearch } from '@tanstack/react-router';

import { Badge } from '@rekode/ui/components/badge';
import { Button, buttonVariants } from '@rekode/ui/components/button';
import { Field, FieldError, FieldLabel } from '@rekode/ui/components/field';
import { Input } from '@rekode/ui/components/input';
import { cn } from '@rekode/ui/lib/utils';

import { loginWithEmailMutationOptions } from '../queries';
import { type SignInSchema, signInSchema } from '../schema/sign-in';
import { FormHeader } from './form-header';

export function SignInForm() {
  const { prevSession } = useLoaderData({
    from: '/auth/login/',
  });
  const search = useSearch({
    from: '/auth/login/',
  });
  const navigate = useNavigate();
  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = useMutation({
    ...loginWithEmailMutationOptions,
    onSuccess: (_, email) => {
      navigate({
        to: '/auth/verify-otp',
        search: {
          email,
        },
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data.email);
  });

  console.log(prevSession);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <FormHeader
        title="Log in"
        description="Welcome back to your workspace. Sign in to continue building and collaborating."
      />

      {/* Email Form */}
      <form className="flex flex-col gap-7" onSubmit={onSubmit}>
        <Controller
          control={form.control}
          name="email"
          disabled={search.success}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id={field.name}
                type="email"
                placeholder="Enter your email address"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button isLoading={mutation.isPending} disabled={search.success} type="submit">
          Continue
          {prevSession.provider === OAuthProvider.UNRECOGNIZED && <LastUsedBadge />}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="bg-background relative px-2.5">
          <span className="text-muted-foreground text-md">OR</span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="flex flex-col gap-4">
        <a
          className={cn(
            'relative',
            buttonVariants({ variant: 'secondary' }),
            search.success && 'pointer-events-none opacity-50',
          )}
          href="http://localhost:8000/auth/google"
        >
          {search.provider === OAuthProvider.O_AUTH_PROVIDER_GOOGLE ? (
            <IconLoader2 className="animate-spin" />
          ) : (
            <IconBrandGoogleFilled />
          )}
          Continue with Google
          {prevSession.provider === OAuthProvider.O_AUTH_PROVIDER_GOOGLE && <LastUsedBadge />}
        </a>
        <Button disabled={search.success} variant="secondary">
          <IconBrandGithub />
          Continue with Github
        </Button>
      </div>

      {/* Terms */}
      <p className="text-muted-foreground mx-auto max-w-72 text-center text-xs leading-relaxed font-medium">
        By creating account you agree to company{' '}
        <Link to="/" className="text-primary hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link className="text-primary hover:underline" to="/">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

function LastUsedBadge() {
  return (
    <Badge
      variant={'secondary'}
      className="absolute top-0 right-0 translate-x-1/8 -translate-y-1/3"
    >
      Last used
    </Badge>
  );
}
