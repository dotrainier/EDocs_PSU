// src/email-templates/RegistrationRejected.tsx
import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from 'react-email';
import * as React from 'react';

interface RegistrationRejectedEmailProps {
  userName: string;
  reason?: string | null;
}

export const RegistrationRejectedEmail = ({ userName, reason }: RegistrationRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>An update on your e-Docs registration</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={heading}>e-Docs</Text>
          <Text style={subheading}>Pampanga State University - Main Campus</Text>
        </Section>

        <Hr style={hr} />

        {/* Body */}
        <Section style={body}>
          <Text style={greeting}>Hello {userName},</Text>

          <Text style={paragraph}>
            We were unable to approve your e-Docs account registration at this time.
          </Text>

          <Section style={statusCard}>
            <Text style={statusTitle}>Registration Not Approved</Text>
            <Text style={statusText}>
              {reason ||
                'This is usually due to details that could not be verified against university records (e.g. Student ID, name, or program). Please contact the registrar or MIS office to clarify or correct your information.'}
            </Text>
          </Section>

          <Text style={paragraph}>
            Once the discrepancy is resolved, you're welcome to submit a new registration.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Questions? Contact the registrar office at{' '}
            <Link href='mailto:registrar@pampangastate.edu.ph'>registrar@pampangastate.edu.ph</Link>
          </Text>
        </Section>

        <Hr style={hr} />

        {/* Footer */}
        <Section style={bottomFooter}>
          <Text style={tiny}>
            This is an automated message from the e-Docs system. Do not reply to this email.
          </Text>
          <Text style={tiny}>
            © 2026 Pampanga State University - Main Campus. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// ──────────────────────────────────────────────────────────────

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#a81b1b',
  color: '#ffffff',
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const heading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
  padding: 0,
};

const subheading = {
  color: '#f0f0f0',
  fontSize: '14px',
  fontWeight: '500',
  margin: 0,
  padding: 0,
};

const body = {
  padding: '20px 32px',
};

const greeting = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#000',
  margin: '0 0 16px 0',
};

const paragraph = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.6',
  marginBottom: '16px',
};

const statusCard = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const statusTitle = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#991b1b',
  margin: '0 0 12px 0',
};

const statusText = {
  fontSize: '14px',
  color: '#b91c1c',
  margin: '8px 0',
  lineHeight: '1.5',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  fontSize: '13px',
  color: '#666',
  marginBottom: '12px',
};

const bottomFooter = {
  textAlign: 'center' as const,
  padding: '20px 32px',
};

const tiny = {
  fontSize: '12px',
  color: '#999',
  margin: '4px 0',
};
