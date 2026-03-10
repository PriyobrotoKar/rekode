import { Img, Section } from '@react-email/components';

import { DEFAULT_BASE_URL } from '../_lib/constants';

export const EmailHeader = () => (
  <Section className="px-9 py-6">
    <Img src={`${DEFAULT_BASE_URL}/rekode-logo.png`} width="120" height="34" alt="Rekode" />
  </Section>
);

export default EmailHeader;
