import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../../lib/auth';
import { emailNotificationService } from '../../../../lib/emailNotifications';

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

    // Get current notification configuration
    const config = emailNotificationService.getConfig();

    return NextResponse.json({
      config,
      status: 'active',
    });

  } catch (error) {
    console.error('Notifications config API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = checkAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, config } = body;

    if (action === 'update-config') {
      // Update notification configuration
      emailNotificationService.updateConfig(config);
      
      return NextResponse.json({
        message: 'Configuration updated successfully',
        config: emailNotificationService.getConfig(),
      });
    }

    if (action === 'test-notification') {
      // Send a test notification
      const testAlert = {
        id: 'test-' + Date.now(),
        email: 'test@example.com',
        country: 'US',
        contractType: 'independent',
        contractValue: 150000,
        riskLevel: 'High',
        riskScore: 12,
        reasons: [
          'High-value independent contract increases misclassification risk',
          'Contract value >$100k requires enhanced due diligence',
          'Test notification - this is not a real assessment'
        ],
        timestamp: new Date().toISOString(),
      };

      await emailNotificationService.sendHighRiskAlert(testAlert);

      return NextResponse.json({
        message: 'Test notification sent successfully',
      });
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}