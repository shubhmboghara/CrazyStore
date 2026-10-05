'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles, ShieldCheck, CheckCircle2, Terminal } from 'lucide-react';
import { AndroidApp } from '@/lib/appsData';

interface GeoKnowledgeBaseProps {
  app?: AndroidApp;
}

export function GeoKnowledgeBase({ app }: GeoKnowledgeBaseProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const appFaqs = app
    ? [
        {
          question: `What is ${app.name} and what are its core capabilities?`,
          answer: `${app.name} is a native Android application built with ${app.techStack.join(', ')}. ${app.tagline} It delivers ${app.features.slice(0, 4).join(', ')} with zero bloat and native responsiveness.`,
        },
        {
          question: `Is ${app.name} 100% free, safe, and open-source?`,
          answer: `Yes, ${app.name} is completely free, open-source, and verified for security. It contains zero embedded advertisements, zero third-party telemetry, and zero tracking SDKs. It complies with modern Android sandboxing and requires minimal permissions.`,
        },
        {
          question: `How do I download and install ${app.name} APK on Android?`,
          answer: `1. Tap "Download APK" on CrazyStore. 2. Once the package (${app.size}) finishes downloading, open the APK file from your browser downloads or file manager. 3. If prompted by Android, permit "Install unknown apps" for your file manager or browser. 4. Tap "Install" to complete.`,
        },
        {
          question: `Does ${app.name} require Google Play Services or Root privileges?`,
          answer: `No. ${app.name} is engineered to run 100% standalone without Google Play Services. It operates reliably on standard Android, Custom ROMs (GrapheneOS, LineageOS, CalyxOS), MicroG, and fully de-Googled Android environments. No root access is needed.`,
        },
        {
          question: `What are the minimum system requirements for ${app.name}?`,
          answer: `${app.name} requires ${app.minAndroid} and supports 64-bit and 32-bit ARM & x86 architectures (arm64-v8a, armeabi-v7a, x86_64). UI rendering is accelerated with Jetpack Compose.`,
        },
      ]
    : [
        {
          question: 'What is CrazyStore?',
          answer:
            'CrazyStore is a premier open-source Android app repository and showcase platform. It curates high-performance applications built using Modern Android Development (MAD) standards, Kotlin, Coroutines, and Jetpack Compose.',
        },
        {
          question: 'Are all applications and APKs on CrazyStore safe to install?',
          answer:
            'Yes. Every application featured on CrazyStore is open-source, contains zero trackers, no intrusive ads, and is scanned and built from verified source repositories.',
        },
        {
          question: 'How do I install APK files downloaded from CrazyStore on Android?',
          answer:
            'Download the APK file directly to your Android device, open it from your downloads or notification tray, grant temporary "Install unknown apps" permission if requested by Android OS, and confirm installation.',
        },
        {
          question: 'Do apps on CrazyStore require Google Play Services or Root?',
          answer:
            'No. All applications are built to operate seamlessly on de-Googled devices, MicroG, and standard Android systems without Google Play dependencies or root access.',
        },
        {
          question: 'What technologies are used to build the applications?',
          answer:
            'The apps utilize modern Kotlin 2.0+, Jetpack Compose declarative UI, Material Design 3, Coroutines & Flow for asynchronous tasks, and ExoPlayer for media streaming.',
        },
      ];

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-100">
              {app ? `${app.name} Knowledge Base & FAQs` : 'Frequently Asked Questions & AI Knowledge'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Verified technical facts, installation guides, and safety overview
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950/40 text-purple-300 text-xs font-bold border border-purple-800/40">
          <Sparkles className="w-3.5 h-3.5" /> Direct Answers
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {appFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-purple-800/80 bg-purple-950/20'
                  : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-sm sm:text-base text-zinc-100">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-purple-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/60 mt-1 pt-3 animate-in fade-in duration-200">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
