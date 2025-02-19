import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Head from 'next/head';  // Import Head

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'AGM ChatBot',
    description: 'AI Chatbot for Evaluation',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
          <Head>
              <link rel="icon" href="/favicon.ico" sizes="any" />
          </Head>
            <body className={inter.className}>{children}</body>
        </html>
    );
}