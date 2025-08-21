import { NextRequest, NextResponse } from 'next/server';
import { getRowById, updateRowById } from '../../../lib/sheets';
import { getAssessment, updateAssessment } from '../../../lib/localStorage';
import PDFDocument from 'pdfkit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('logId');

    if (!logId) {
      return NextResponse.json(
        { message: 'Missing logId parameter' },
        { status: 400 }
      );
    }

    // Get the assessment data (try local storage first, then Google Sheets)
    let rowData = getAssessment(logId);
    if (!rowData) {
      try {
        rowData = await getRowById(logId);
      } catch (error) {
        console.log('Google Sheets not available, assessment data not found locally');
      }
    }
    
    if (!rowData) {
      return NextResponse.json(
        { message: 'Assessment data not found' },
        { status: 404 }
      );
    }

    // Create a simple PDF that actually works
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    
    // Add content synchronously
    doc.fontSize(20).text('Compliance Risk Assessment Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Assessment Details:', { underline: true });
    doc.fontSize(12)
       .text(`Email: ${rowData.email}`)
       .text(`Country: ${rowData.country}`)
       .text(`Contract Type: ${rowData.contract_type}`)
       .text(`Contract Value: $${rowData.contract_value_usd}`)
       .text(`Data Processing: ${rowData.data_processing ? 'Yes' : 'No'}`);
    
    doc.moveDown();
    doc.fontSize(14).text('Risk Assessment:', { underline: true });
    doc.fontSize(12)
       .text(`Risk Level: ${rowData.level}`)
       .text(`Risk Score: ${rowData.score}/10`);
    
    if (rowData.reasons) {
      doc.moveDown();
      doc.fontSize(14).text('Reasons:', { underline: true });
      const reasons = rowData.reasons.split('|');
      reasons.forEach(reason => {
        doc.fontSize(12).text(`• ${reason}`);
      });
    }
    
    // End the document
    doc.end();
    
    // Wait for completion
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Mark as downloaded (try both local storage and Google Sheets)
    try {
      updateAssessment(logId, { downloaded_pdf: true });
      await updateRowById(logId, { downloaded_pdf: true });
    } catch (error) {
      console.error('Failed to update download status:', error);
      // Don't fail the request if we can't update the status
    }

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Compliance-Risk-Report-${logId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
