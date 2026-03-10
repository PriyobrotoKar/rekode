import { Img, Link, Section, Text } from '@react-email/components';

import { DEFAULT_BASE_URL } from '../_lib/constants';

export const EmailFooter = () => {
  return (
    <Section className="bg-muted border-border border-t px-9 py-9">
      <Img
        src={`${DEFAULT_BASE_URL}/rekode-logo.png`}
        width="83"
        height="23"
        alt="Rekode"
        className="mb-7"
      />
      <Section className="mb-4">
        <Link href="#" className="text-secondary text-xs font-medium underline">
          View as Webpage
        </Link>
      </Section>
      <Text className="text-secondary m-0 mb-4 text-xs font-medium">
        You're receiving this email because an account was created using this email address.
        <br />
        If this wasn't you, please contact{' '}
        <Link href="mailto:support@rekode.xyz" className="text-secondary underline">
          support@rekode.xyz
        </Link>{' '}
        immediately.
      </Text>
      <Section>
        <Link href="#" className="text-secondary mr-2.5 text-xs font-medium underline">
          privacy policy
        </Link>
        <Link href="#" className="text-secondary text-xs font-medium underline">
          terms of service
        </Link>
      </Section>
    </Section>
  );
};

export default EmailFooter;
