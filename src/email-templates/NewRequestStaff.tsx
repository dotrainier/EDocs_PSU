import { Body, Button, Container, Head, Hr, Html, Link, Preview, Section, Text } from 'react-email';
import * as React from 'react';

interface NewRequestStaffEmailProps {
  documentType: string;
  trackingNumber: string;
  dashboardUrl: string;
}

export const NewRequestStaffEmail = ({
  documentType,
  trackingNumber,
  dashboardUrl,
}: NewRequestStaffEmailProps) => (
  <Html>
    <Head />
    <Preview>New {documentType} request submitted — Tracking: {trackingNumber}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={heading}>e-Docs</Text>
          <Text style={subheading}>Pampanga State University - Main Campus</Text>
        </Section>

        <Hr style={hr} />

        <Section style={body}>
          <Text style={greeting}>New Document Request Received</Text>

          <Text style={paragraph}>
            A new <strong>{documentType}</strong> request has been submitted and is awaiting your
            review.
          </Text>

          <Section style={infoCard}>
            <Text style={infoTitle}>Request Details</Text>
            <Text style={infoRow}>
              <strong>Document Type:</strong> {documentType}
            </Text>
            <Text style={infoRow}>
              <strong>Tracking Number:</strong> {trackingNumber}
            </Text>
            <Text style={infoRow}>
              <strong>Status:</strong>{' '}
              <span style={badge}>Pending</span>
            </Text>
          </Section>

          <Text style={paragraph}>
            Please log in to the e-Docs portal to review and process this request within the
            required SLA period.
          </Text>

          <Section style={ctaSection}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Questions? Contact the system administrator at{' '}
            <Link href='mailto:registrar@pampangastate.edu.ph'>registrar@pampangastate.edu.ph</Link>
          </Text>
        </Section>

        <Hr style={hr} />

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

const infoCard = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const infoTitle = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#7f1d1d',
  margin: '0 0 12px 0',
};

const infoRow = {
  fontSize: '14px',
  color: '#333',
  margin: '6px 0',
  lineHeight: '1.5',
};

const badge = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 'bold' as const,
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#a81b1b',
  color: '#ffffff',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  border: 'none',
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
