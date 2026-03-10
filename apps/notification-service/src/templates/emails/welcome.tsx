import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

import { EmailFooter } from './_components/email-footer';
import { EmailHeader } from './_components/email-header';
import { DEFAULT_BASE_URL } from './_lib/constants';
import { tailwindConfig } from './_lib/tailwind.config';

interface WelcomeEmailProps {
  userFirstname?: string;
}

export const WelcomeEmail = ({ userFirstname = 'there' }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Tailwind config={tailwindConfig}>
      <Body className="text-foreground bg-white font-sans">
        <Preview>Welcome to Rekode — we're excited to have you here.</Preview>
        <Container className="mx-auto">
          {/* Header with Logo */}
          <EmailHeader />

          {/* Banner */}
          <Section>
            <Img
              src={`${DEFAULT_BASE_URL}/welcome-mail-banner.jpg`}
              width="600"
              height="98"
              alt="Welcome to Rekode"
              className="w-full object-contain object-left"
            />
          </Section>

          {/* Main Content */}
          <Section className="px-9 py-9">
            <Text className="m-0 text-sm">
              Welcome to Rekode — we're excited to have you here
              {userFirstname !== 'there' ? `, ${userFirstname}` : ''}.
            </Text>
            <Text className="mt-5 mb-0 text-sm">
              Your account has been successfully created, and you're now ready to start building,
              experimenting, and bringing your ideas to life directly from your browser.
            </Text>
            <Text className="mt-5 mb-0 text-sm">
              With Rekode, you can create projects, write and run code instantly, and collaborate
              without worrying about local setup or configuration. Everything you need to start
              coding is already available.
            </Text>
            <Text className="mt-5 mb-0 text-sm">
              If you're just getting started, the best next step is to{' '}
              <Link href="" className="text-primary underline">
                create your first project
              </Link>{' '}
              and explore the editor.
            </Text>
            <Text className="mt-5 mb-0 text-sm">
              If you ever run into issues or have questions, feel free to reach out to our support
              team at{' '}
              <Link href="mailto:support@rekode.xyz" className="text-primary underline">
                support@rekode.xyz
              </Link>
              . We're always happy to help.
            </Text>
            <Text className="mt-5 mb-0 text-sm">We're excited to see what you'll build.</Text>
            <Text className="mt-5 mb-0 text-sm">
              Happy building,
              <br />
              Rekode
            </Text>
          </Section>

          {/* Footer */}
          <EmailFooter />
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

WelcomeEmail.PreviewProps = {
  userFirstname: 'Alan',
} as WelcomeEmailProps;

export default WelcomeEmail;
