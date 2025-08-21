import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../../lib/auth';
import { getAggregates } from '../../../../lib/sheets';
import PDFDocument from 'pdfkit';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = checkAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get aggregated data
    const aggregates = await getAggregates();

    // Create PDF
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));

    // Title
    const currentDate = new Date();
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    doc.fontSize(24).text('Contractor Compliance Risk Micro-Pilot', { align: 'center' });
    doc.fontSize(18).text(`Case Study (${monthYear})`, { align: 'center' });
    doc.moveDown(2);

    // Problem
    doc.fontSize(16).text('Problem', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      'Organizations struggle with rapid, accurate assessment of contractor compliance risks, leading to delays in onboarding and potential regulatory exposure.'
    );
    doc.moveDown(1);

    // Hypothesis
    doc.fontSize(16).text('Hypothesis', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      'A simple, rule-based tool can provide instant compliance risk assessment, reducing time-to-decision while maintaining accuracy for most common contractor scenarios.'
    );
    doc.moveDown(1);

    // Pilot Setup
    doc.fontSize(16).text('Pilot Setup', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text(`• Duration: ${monthYear}`)
       .text(`• Participants: ${aggregates.totalUsers} unique users`)
       .text(`• Total Assessments: ${aggregates.totalSubmissions}`)
       .text('• Target: 60-second assessment completion');
    doc.moveDown(1);

    // Results
    doc.fontSize(16).text('Key Results', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text(`• Average Time to Result: ${aggregates.avgTimeToResult.toFixed(1)} seconds`)
       .text(`• PDF Download Rate: ${aggregates.pdfDownloadRate}%`)
       .text(`• User Satisfaction: ${aggregates.feedbackUsefulRate}% found tool useful`)
       .text(`• Repeat Usage: ${((aggregates.totalSubmissions / aggregates.totalUsers) - 1).toFixed(1)} assessments per user on average`);
    doc.moveDown(1);

    // Distribution Analysis
    doc.fontSize(16).text('Time Distribution Analysis', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    
    const timeDistrib = aggregates.timeDistribution;
    const total = Object.values(timeDistrib).reduce((a, b) => a + b, 0);
    
    doc.text(`• Under 15s: ${timeDistrib.under15s} (${((timeDistrib.under15s / total) * 100).toFixed(1)}%)`);
    doc.text(`• 15-30s: ${timeDistrib.from15to30s} (${((timeDistrib.from15to30s / total) * 100).toFixed(1)}%)`);
    doc.text(`• 30-60s: ${timeDistrib.from30to60s} (${((timeDistrib.from30to60s / total) * 100).toFixed(1)}%)`);
    doc.text(`• 60-120s: ${timeDistrib.from60to120s} (${((timeDistrib.from60to120s / total) * 100).toFixed(1)}%)`);
    doc.text(`• Over 120s: ${timeDistrib.over120s} (${((timeDistrib.over120s / total) * 100).toFixed(1)}%)`);
    doc.moveDown(1);

    // Next Steps
    doc.fontSize(16).text('Next Steps', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text('• Expand rule engine based on user feedback and edge cases')
       .text('• Integrate with existing HR systems and workflows')
       .text('• Add jurisdiction-specific compliance modules')
       .text('• Develop advanced analytics and reporting features');

    doc.moveDown(2);

    // Footer
    doc.fontSize(10)
       .fillColor('gray')
       .text(`Generated on ${currentDate.toLocaleDateString()}`, { align: 'center' })
       .text('Compliance Risk Micro-Pilot - Internal Use Only', { align: 'center' });

    doc.end();

    // Wait for PDF generation to complete
    await new Promise<void>((resolve) => {
      doc.on('end', resolve);
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Case-Study-Micro-Pilot.pdf"',
      },
    });

  } catch (error) {
    console.error('Case study API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
