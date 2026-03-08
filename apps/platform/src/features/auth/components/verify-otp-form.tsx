import { Controller, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';

import { Button } from '@rekode/ui/components/button';
import { Field, FieldError } from '@rekode/ui/components/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@rekode/ui/components/input-otp';

import { verifyOtpMutationOptions } from '../queries';
import { type VerifyOtpSchema, verifyOtpSchema } from '../schema/verify-otp';
import { FormHeader } from './form-header';

interface VerifyOtpFormProps {
  email: string;
}

export function VerifyOtpForm({ email }: VerifyOtpFormProps) {
  const navigate = useNavigate();
  const form = useForm<VerifyOtpSchema>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const mutation = useMutation({
    ...verifyOtpMutationOptions,
    onSuccess: () => {
      navigate({
        to: '/auth/profile',
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate({
      email,
      otp: data.otp,
    });
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <FormHeader
        title="Verify OTP"
        description={
          <>
            We have sent a code to <span className="text-foreground">{email}</span>
            <br />
            Enter it below to continue.
          </>
        }
      />

      {/* OTP Form */}
      <form className="flex flex-col gap-7" onSubmit={onSubmit}>
        <Controller
          control={form.control}
          name="otp"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <InputOTP
                maxLength={6}
                value={field.value}
                onChange={field.onChange}
                aria-invalid={fieldState.invalid}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button isLoading={mutation.isPending} type="submit">
          Continue
        </Button>
      </form>

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
