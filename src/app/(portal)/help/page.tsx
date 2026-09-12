import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  FilePlus2,
  Search,
  CreditCard,
  Download,
  AlertCircle,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  icon: React.ElementType;
  title: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    icon: FilePlus2,
    title: 'Requesting Documents',
    items: [
      {
        question: 'How do I request a document?',
        answer:
          'Go to "Request Document" from the sidebar, select the document type you need, fill in the required details, review the privacy notice, and submit your request. You will receive a tracking number once submitted.',
      },
      {
        question: 'What documents can I request?',
        answer:
          'Available documents depend on your role and the office that handles them. Common requests include Transcript of Records, Certificates of Enrollment, Clearances, and other official school documents.',
      },
      {
        question: 'How long does processing take?',
        answer:
          'Processing time varies by document type and office. You can check the average processing time shown on the dashboard. Most requests are processed within 3–7 working days.',
      },
    ],
  },
  {
    icon: Search,
    title: 'Tracking Requests',
    items: [
      {
        question: 'How do I track my request?',
        answer:
          'Go to "My Requests" to see all your document requests and their current status. Click "View" on any request to see the full status timeline and details.',
      },
      {
        question: 'What do the statuses mean?',
        answer:
          'Pending — received and queued. In Process — being worked on by the office. Action Required — you need to provide additional information or payment. Ready for Release — document is ready for pickup or download. Released — completed. Cancelled — request was cancelled.',
      },
      {
        question: 'What does "Action Required" mean?',
        answer:
          'This means the office needs something from you — this could be a payment, additional documents, or a clarification. Check your request details and notifications for specific instructions.',
      },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments',
    items: [
      {
        question: 'How do I pay for my request?',
        answer:
          'When a payment is required, you will receive a notification and your request status will change to "Action Required". Click on your request to find the payment link and complete the transaction online.',
      },
      {
        question: 'What payment methods are accepted?',
        answer:
          'Online payments are processed through a secure payment gateway. Accepted methods may include GCash, Maya, and credit/debit cards depending on current configuration.',
      },
    ],
  },
  {
    icon: Download,
    title: 'Receiving Documents',
    items: [
      {
        question: 'How do I download my document?',
        answer:
          'When your document is ready and has been released digitally, a "Download" button will appear on the "My Requests" page and on the individual request page. Click it to open the PDF.',
      },
      {
        question: 'Can I pick up my document in person?',
        answer:
          'Yes. Some document types may require in-person pickup. When your request is marked "Ready for Release", visit the issuing office with a valid ID to claim your document.',
      },
    ],
  },
];

const CONTACT_ITEMS = [
  { label: 'Office of the University Registrar', detail: 'OUR — Main Building, Room 101' },
  { label: 'MIS / IT Office', detail: 'MIS — ICT Building, Room 302' },
];

export default function HelpPage() {
  return (
    <div className='mx-auto max-w-2xl space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight text-foreground'>Help & FAQs</h1>
        <p className='mt-0.5 text-sm text-muted-foreground'>
          Answers to common questions about using e-Docs.
        </p>
      </div>

      {/* Quick links */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {FAQ_SECTIONS.map(({ icon: Icon, title }) => (
          <a
            key={title}
            href={`#${title.toLowerCase().replace(/\s+/g, '-')}`}
            className='flex flex-col items-center gap-2 rounded-xl border bg-card px-3 py-4 text-center text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
          >
            <Icon className='h-5 w-5' />
            {title}
          </a>
        ))}
      </div>

      {/* FAQ sections */}
      {FAQ_SECTIONS.map(({ icon: Icon, title, items }) => (
        <Card key={title} id={title.toLowerCase().replace(/\s+/g, '-')}>
          <CardHeader className='pb-2 pt-5'>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <Icon className='h-4 w-4 text-primary' />
              {title}
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className='px-0 py-0'>
            {items.map(({ question, answer }, i) => (
              <div key={question}>
                <div className='px-6 py-4'>
                  <p className='text-sm font-semibold text-foreground'>{question}</p>
                  <p className='mt-1.5 text-sm leading-relaxed text-muted-foreground'>{answer}</p>
                </div>
                {i < items.length - 1 && <Separator className='mx-6 w-auto' />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Contact section */}
      <Card>
        <CardHeader className='pb-2 pt-5'>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            <MessageSquare className='h-4 w-4 text-primary' />
            Still need help?
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Contact the relevant office directly for assistance.
          </p>
        </CardHeader>
        <Separator />
        <CardContent className='px-0 py-0'>
          {CONTACT_ITEMS.map(({ label, detail }, i) => (
            <div key={label}>
              <div className='flex items-center gap-3 px-6 py-3.5'>
                <AlertCircle className='h-4 w-4 shrink-0 text-muted-foreground' />
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium text-foreground'>{label}</p>
                  <p className='text-xs text-muted-foreground'>{detail}</p>
                </div>
              </div>
              {i < CONTACT_ITEMS.length - 1 && <Separator className='mx-6 w-auto' />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Back to dashboard */}
      <div className='flex justify-center pb-4'>
        <Link
          href='/dashboard'
          className='flex items-center gap-1.5 text-xs font-medium text-primary hover:underline'
        >
          Back to Dashboard
          <ChevronRight className='h-3.5 w-3.5' />
        </Link>
      </div>
    </div>
  );
}
