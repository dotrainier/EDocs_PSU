// src/email-templates/ClearanceApproved.tsx
import { Body, Button, Container, Head, Hr, Html, Link, Preview, Section, Text } from 'react-email';
import * as React from 'react';

interface ClearanceApprovedEmailProps {
  userName: string;
  documentType: string;
  officeName: string;
  trackingUrl: string;
}

export const ClearanceApprovedEmail = ({
  userName,
  documentType,
  officeName,
  trackingUrl,
}: ClearanceApprovedEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Your {documentType} request has been cleared by {officeName}
    </Preview>
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
            Great news! Your request for a <strong>{documentType}</strong> has been{' '}
            <span style={approved}>✓ APPROVED</span> by the <strong>{officeName}</strong> office.
          </Text>

          <Section style={statusCard}>
            <Text style={statusTitle}>Clearance Status Update</Text>
            <Text style={statusText}>
              <span style={{ color: '#10b981' }}>✓ All clearances complete!</span> Your request is
              now moving to the issuing office.
            </Text>
          </Section>

          <Text style={paragraph}>
            Your request is progressing smoothly through our processing system. You'll receive
            another notification once the next stage is complete.
          </Text>

          <Section style={ctaSection}>
            <Button style={button} href={trackingUrl}>
              View Full Request Status
            </Button>
          </Section>

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

const approved = {
  backgroundColor: '#d1fae5',
  color: '#065f46',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 'bold' as const,
};

const statusCard = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const statusTitle = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#065f46',
  margin: '0 0 12px 0',
};

const statusText = {
  fontSize: '14px',
  color: '#047857',
  margin: '8px 0',
  lineHeight: '1.5',
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
