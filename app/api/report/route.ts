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
    console.log('DEBUG: Retrieved rowData from local storage:', rowData);
    
    if (!rowData) {
      try {
        rowData = await getRowById(logId);
        console.log('DEBUG: Retrieved rowData from Google Sheets:', rowData);
      } catch (error) {
        console.log('Google Sheets not available, assessment data not found locally');
      }
    }
    
    if (!rowData) {
      console.log('DEBUG: No rowData found for logId:', logId);
      return NextResponse.json(
        { message: 'Assessment data not found' },
        { status: 404 }
      );
    }
    
    console.log('DEBUG: About to generate PDF with rowData:', JSON.stringify(rowData, null, 2));

    // Create PDF with proper Promise handling
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunk => {
        console.log('DEBUG: PDF chunk received, size:', chunk.length);
        chunks.push(chunk);
      });
      doc.on('end', () => {
        console.log('DEBUG: PDF generation ended, total chunks:', chunks.length, 'total size:', chunks.reduce((sum, chunk) => sum + chunk.length, 0));
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (err) => {
        console.log('DEBUG: PDF generation error:', err);
        reject(err);
      });

      // Header
      doc.fontSize(20).text('Compliance Risk Assessment Report', { align: 'center' });
      doc.fontSize(12).text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Summary Section
      doc.fontSize(16).text('Assessment Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
         .text(`Email: ${rowData.email}`)
         .text(`Country: ${rowData.country}`)
         .text(`Contract Type: ${rowData.contract_type}`)
         .text(`Contract Value: $${rowData.contract_value_usd?.toLocaleString()}`)
         .text(`Data Processing: ${rowData.data_processing ? 'Yes' : 'No'}`);
      
      doc.moveDown(1);

      // Risk Level Section
      doc.fontSize(16).text('Risk Assessment', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(18).text(`Risk Level: ${rowData.level}`, { 
        fillColor: rowData.level === 'Low' ? 'green' : 
                   rowData.level === 'Medium' ? 'orange' : 'red'
      });
      doc.fillColor('black');
      doc.fontSize(12).text(`Risk Score: ${rowData.score}/10`);
      doc.moveDown(1);

      // Reasons Section
      doc.fontSize(16).text('Assessment Rationale', { underline: true });
      doc.moveDown(0.5);
      const reasons = rowData.reasons?.split('|') || [];
      reasons.forEach((reason, index) => {
        doc.fontSize(12).text(`• ${reason}`);
      });

      doc.moveDown(2);

      // Footer
      doc.fontSize(10)
         .fillColor('gray')
         .text('DISCLAIMER: This is a pilot tool and does not constitute legal advice.', { align: 'center' })
         .text('Please consult with qualified legal professionals for compliance matters.', { align: 'center' });

      // Finalize the PDF
      doc.end();
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
