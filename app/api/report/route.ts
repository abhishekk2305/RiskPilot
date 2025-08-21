import { NextRequest } from 'next/server';
import { getRowById } from '../../../lib/sheets';
import { getAssessment, updateAssessment } from '../../../lib/localStorage';
import PDFDocument from 'pdfkit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('logId');

    if (!logId) {
      return new Response('Missing logId parameter', { status: 400 });
    }

    // Get the assessment data
    let rowData = getAssessment(logId);
    if (!rowData) {
      try {
        rowData = await getRowById(logId);
      } catch (error) {
        console.log('Google Sheets not available');
      }
    }
    
    if (!rowData) {
      return new Response('Assessment data not found', { status: 404 });
    }

    // Create simple PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // Add content
    doc.fontSize(20).text('Compliance Risk Assessment Report', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(16).text('Assessment Details');
    doc.fontSize(12);
    doc.text(`Email: ${rowData.email}`);
    doc.text(`Country: ${rowData.country}`);
    doc.text(`Contract Type: ${rowData.contract_type}`);
    doc.text(`Contract Value: $${rowData.contract_value_usd}`);
    doc.text(`Data Processing: ${rowData.data_processing ? 'Yes' : 'No'}`);
    doc.moveDown();
    doc.fontSize(16).text('Risk Assessment');
    doc.fontSize(12);
    doc.text(`Risk Level: ${rowData.level}`);
    doc.text(`Risk Score: ${rowData.score}/10`);
    doc.moveDown();
    
    if (rowData.reasons) {
      doc.fontSize(16).text('Assessment Rationale');
      doc.fontSize(12);
      const reasons = rowData.reasons.split('|');
      reasons.forEach(reason => {
        doc.text(`• ${reason}`);
      });
    }
    
    doc.end();
    
    // Get buffer
    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Mark as downloaded
    try {
      updateAssessment(logId, { downloaded_pdf: true });
    } catch (error) {
      console.log('Failed to update status');
    }

    // Return as file download
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${logId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Report API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
