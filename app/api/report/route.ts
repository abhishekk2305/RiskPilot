import { NextRequest, NextResponse } from 'next/server';
import { getRowById, updateRowById } from '../../../lib/sheets';
import { getAssessment, updateAssessment } from '../../../lib/localStorage';
import PDFDocument from 'pdfkit';
import fs from 'fs';

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
    console.log('PDF DEBUG - Retrieved data:', JSON.stringify(rowData, null, 2));
    
    if (!rowData) {
      try {
        rowData = await getRowById(logId);
        console.log('PDF DEBUG - Retrieved from sheets:', JSON.stringify(rowData, null, 2));
      } catch (error) {
        console.log('Google Sheets not available, assessment data not found locally');
      }
    }
    
    if (!rowData) {
      console.log('PDF DEBUG - No data found for logId:', logId);
      return NextResponse.json(
        { message: 'Assessment data not found' },
        { status: 404 }
      );
    }

    // Create PDF with correct buffer handling  
    const chunks: Buffer[] = [];
    
    const doc = new PDFDocument({ margin: 50 });
    
    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
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
    
    // Close the document
    doc.end();
    
    // Wait for PDF completion and get buffer
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log('PDF DEBUG - Final buffer size:', buffer.length);
        console.log('PDF DEBUG - First 50 bytes:', buffer.subarray(0, 50).toString());
        
        // Save debug file to verify content
        fs.writeFileSync(`debug-${logId}.pdf`, buffer);
        console.log('PDF DEBUG - Saved debug file');
        
        resolve(buffer);
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

    // Return PDF using standard Response instead of NextResponse
    console.log('PDF DEBUG - Sending buffer of size:', pdfBuffer.length);
    
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Compliance-Risk-Report-${logId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
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
