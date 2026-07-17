import React from 'react';
import Header from '@/components/crm-website/Header';
import Footer from '@/components/crm-website/Footer';
import ContactHero from './components/ContactHero';
import ContactForm from './components/ContactForm';
import ContactInfo from './components/ContactInfo';
import { contactMetadata, contactSchemas, JsonLd } from '../seo';

export const metadata = contactMetadata;

export default function ContactPage() {
  return (
    <>
      <JsonLd data={contactSchemas} />
      <main className="min-h-screen bg-background">
        <Header />
        <ContactHero />
        <section className="py-8 md:py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
              <div className="lg:col-span-2">
                <ContactForm />
              </div>
              <div>
                <ContactInfo />
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
