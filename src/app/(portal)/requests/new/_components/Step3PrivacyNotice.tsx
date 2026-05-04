'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Step3Props {
  agreed: boolean;
  onToggle: (checked: boolean) => void;
}

const DATA_PRIVACY_NOTICE = `REPUBLIC ACT NO. 10173 — DATA PRIVACY ACT OF 2012

Pampanga State University – Main Campus (PSU Main) is committed to protecting the privacy and personal data of all its stakeholders in accordance with Republic Act No. 10173, otherwise known as the Data Privacy Act of 2012, its Implementing Rules and Regulations, and the policies of the National Privacy Commission.

PURPOSE OF DATA COLLECTION
The personal data you provide through this electronic document request portal is collected solely for the purpose of processing your document request, verifying your identity, and facilitating communication throughout the request lifecycle.

DATA PROCESSED
By submitting this request, you acknowledge that PSU Main may collect and process the following personal data:
• Full name and identification numbers (Student ID, Employee ID)
• Contact information (email address, phone number)
• Academic or employment records as relevant to the document type requested
• Purpose, number of copies, and preferred release mode of the document requested
• Timestamps and system logs related to your request

DATA SHARING
Your personal data may be shared internally among authorized offices involved in processing your request (e.g., Registrar's Office, Human Resources Office, Accounting Office). PSU Main does not sell, rent, or share your personal data with external third parties except as required by law or with your explicit consent.

DATA RETENTION
Personal data collected through this portal shall be retained in accordance with the university's records management policies and applicable laws. Once the retention period lapses, data shall be securely disposed of.

YOUR RIGHTS AS DATA SUBJECT
Under R.A. 10173, you have the right to:
• Be informed of how your data is being processed
• Access your personal data held by PSU Main
• Object to the processing of your personal data
• Rectify inaccurate or outdated personal data
• Erasure or blocking of personal data under certain conditions
• File a complaint with the National Privacy Commission

DATA PROTECTION OFFICER
For inquiries, requests, or complaints regarding your personal data, you may contact the PSU Main Data Protection Officer at dpo@psu.edu.ph.

By ticking the checkbox below, you confirm that you have read, understood, and agree to the collection and processing of your personal data as described in this notice.`;

export default function Step3PrivacyNotice({ agreed, onToggle }: Step3Props) {
  return (
    <div className='space-y-5'>
      <div>
        <h2 className='text-base font-semibold text-foreground'>Data Privacy Notice</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Please read the following notice carefully before proceeding.
        </p>
      </div>

      <Card>
        <CardContent className='p-0'>
          <div className='h-72 overflow-y-auto rounded-lg p-5'>
            <pre className='whitespace-pre-wrap font-sans text-sm text-muted-foreground leading-relaxed'>
              {DATA_PRIVACY_NOTICE}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className='flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3'>
        <Checkbox
          id='privacy-agree'
          checked={agreed}
          onCheckedChange={(checked) => onToggle(checked === true)}
          className='mt-0.5'
        />
        <Label htmlFor='privacy-agree' className='text-sm leading-relaxed cursor-pointer'>
          I have read and agree to the data privacy notice as outlined under Republic Act No. 10173.
        </Label>
      </div>
    </div>
  );
}
