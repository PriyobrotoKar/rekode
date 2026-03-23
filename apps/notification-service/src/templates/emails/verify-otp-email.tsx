import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

import { EmailFooter } from './_components/email-footer';
import { EmailHeader } from './_components/email-header';
import { tailwindConfig } from './_lib/tailwind.config';

interface VerifyOtpEmailProps {
  otp: string;
  expiryMinutes?: number;
}

export const VerifyOtpEmail = ({ otp, expiryMinutes = 1 }: VerifyOtpEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind config={tailwindConfig}>
        <Body className="text-foreground m-0 bg-white font-sans">
          <Preview>Your Rekode verification code: {otp}</Preview>
          <Container className="mx-auto">
            <EmailHeader />

            {/* Main Content */}
            <Section className="px-9 py-9">
              {/*<Text className="m-0 mb-7 text-sm">Hi there,</Text>*/}
              <Text className="m-0 mb-7 text-sm">
                Hi there,
                <br />
                We received a request to sign in to your Rekode account.
              </Text>
              <Text>Use the verification code below to complete your login:</Text>

              {/* OTP Code Box */}
              <Section className="bg-muted mb-7 py-11 text-center">
                <Text className="m-0 font-mono text-xl tracking-[0.2em] text-black">{otp}</Text>
              </Section>

              <Text className="m-0 mb-7 text-sm">
                This code will expire in{' '}
                <b>
                  {expiryMinutes} minute{expiryMinutes > 1 ? 's' : ''}
                </b>
                . For security reasons, please do not share this code with anyone.
              </Text>
              <Text className="m-0 mb-7 text-sm">
                If you did not attempt to log in, you can safely ignore this email. Your account
                remains secure. If you continue to receive unexpected verification emails, please
                contact our support team at{' '}
                <Link href="mailto:support@rekode.xyz" className="text-primary underline">
                  support@rekode.xyz
                </Link>
                .
              </Text>
              <Text className="m-0 text-sm">
                Best regards,
                <br />
                Rekode
              </Text>
            </Section>

            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

VerifyOtpEmail.PreviewProps = {
  otp: '643145',
  expiryMinutes: 1,
} as VerifyOtpEmailProps;

export default VerifyOtpEmail;
