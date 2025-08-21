import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Compliance Risk Micro-Pilot',
  description: 'Instant contractor compliance risk assessment and PDF reporting tool for HR/Compliance teams.',
  keywords: ['compliance', 'risk assessment', 'contractor', 'HR', 'legal'],
  openGraph: {
    title: 'Compliance Risk Micro-Pilot',
    description: 'Check contractor compliance risk in under 60 seconds. Get instant risk score and downloadable PDF report.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        {process.env.PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={process.env.PLAUSIBLE_DOMAIN}
            src={process.env.PLAUSIBLE_SCRIPT_URL || "https://plausible.io/js/script.js"}
          />
        )}
      </head>
      <body className={`${inter.variable} font-inter`}>
        {children}
      </body>
    </html>
  )
}
