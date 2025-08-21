interface RiskAlert {
  id: string;
  email: string;
  country: string;
  contractType: string;
  contractValue: number;
  riskLevel: string;
  riskScore: number;
  reasons: string[];
  timestamp: string;
}

interface NotificationConfig {
  enabled: boolean;
  highRiskThreshold: number;
  adminEmails: string[];
  webhookUrl?: string;
  includeDetails: boolean;
  rateLimit: number; // max notifications per hour
}

// In-memory rate limiting storage (in production, use Redis or database)
const notificationCounts = new Map<string, { count: number; lastReset: number }>();

export class EmailNotificationService {
  private config: NotificationConfig;

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
      highRiskThreshold: parseInt(process.env.HIGH_RISK_THRESHOLD || '8'),
      adminEmails: (process.env.ADMIN_NOTIFICATION_EMAILS || '').split(',').filter(email => email.trim()),
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      includeDetails: process.env.INCLUDE_ALERT_DETAILS !== 'false',
      rateLimit: parseInt(process.env.NOTIFICATION_RATE_LIMIT || '10'),
      ...config,
    };
  }

  async sendHighRiskAlert(alert: RiskAlert): Promise<void> {
    if (!this.config.enabled || alert.riskScore < this.config.highRiskThreshold) {
      return;
    }

    // Check rate limiting
    if (!this.isWithinRateLimit()) {
      console.log('Notification rate limit exceeded, skipping alert');
      return;
    }

    // Send notifications via multiple channels
    const promises = [];

    // Email notifications
    if (this.config.adminEmails.length > 0) {
      promises.push(this.sendEmailAlert(alert));
    }

    // Slack webhook notification
    if (this.config.webhookUrl) {
      promises.push(this.sendSlackAlert(alert));
    }

    // Log notification attempt
    promises.push(this.logNotification(alert));

    await Promise.allSettled(promises);
  }

  private async sendEmailAlert(alert: RiskAlert): Promise<void> {
    try {
      const subject = `🚨 High Risk Assessment Alert - ${alert.riskLevel} Risk (Score: ${alert.riskScore})`;
      const htmlContent = this.generateEmailHTML(alert);
      const textContent = this.generateEmailText(alert);

      // In a production environment, you would use a service like:
      // - SendGrid, Mailgun, AWS SES, etc.
      // For now, we'll simulate the email sending and log it
      
      console.log('HIGH RISK ALERT EMAIL NOTIFICATION:');
      console.log('To:', this.config.adminEmails.join(', '));
      console.log('Subject:', subject);
      console.log('Content (preview):', textContent.substring(0, 200) + '...');

      // Simulate email service API call
      await this.simulateEmailService({
        to: this.config.adminEmails,
        subject,
        html: htmlContent,
        text: textContent,
      });

    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  private async sendSlackAlert(alert: RiskAlert): Promise<void> {
    try {
      const slackMessage = {
        text: `🚨 High Risk Assessment Alert`,
        attachments: [
          {
            color: alert.riskLevel === 'High' ? 'danger' : 'warning',
            fields: [
              {
                title: 'Risk Level',
                value: `${alert.riskLevel} (Score: ${alert.riskScore}/15)`,
                short: true,
              },
              {
                title: 'Country',
                value: alert.country,
                short: true,
              },
              {
                title: 'Contract Type',
                value: alert.contractType.toUpperCase(),
                short: true,
              },
              {
                title: 'Contract Value',
                value: `$${alert.contractValue.toLocaleString()}`,
                short: true,
              },
              {
                title: 'Timestamp',
                value: new Date(alert.timestamp).toLocaleString(),
                short: false,
              },
            ],
          },
        ],
      };

      // Simulate webhook call (in production, use actual HTTP request)
      console.log('SLACK WEBHOOK NOTIFICATION:');
      console.log('Webhook URL:', this.config.webhookUrl);
      console.log('Message:', JSON.stringify(slackMessage, null, 2));

      await this.simulateWebhookCall(this.config.webhookUrl!, slackMessage);

    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  private async logNotification(alert: RiskAlert): Promise<void> {
    // Log to Google Sheets or another persistent store for audit trail
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'high_risk_alert',
      assessment_id: alert.id,
      risk_level: alert.riskLevel,
      risk_score: alert.riskScore,
      country: alert.country,
      contract_value: alert.contractValue,
      notification_channels: this.getActiveChannels(),
    };

    console.log('NOTIFICATION LOG:', logEntry);
    
    // In production, save to database or append to logging sheet
    // await appendNotificationLog(logEntry);
  }

  private isWithinRateLimit(): boolean {
    const now = Date.now();
    const hourKey = Math.floor(now / (60 * 60 * 1000)).toString();
    
    const current = notificationCounts.get(hourKey) || { count: 0, lastReset: now };
    
    // Reset if we're in a new hour
    if (now - current.lastReset > 60 * 60 * 1000) {
      current.count = 0;
      current.lastReset = now;
    }

    if (current.count >= this.config.rateLimit) {
      return false;
    }

    current.count++;
    notificationCounts.set(hourKey, current);
    return true;
  }

  private generateEmailHTML(alert: RiskAlert): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .alert-high { color: #dc2626; font-weight: bold; }
            .alert-medium { color: #f59e0b; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .info-item { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
            .reasons { background: white; padding: 15px; border-radius: 6px; margin-top: 15px; }
            .footer { font-size: 12px; color: #6b7280; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 High Risk Assessment Alert</h1>
              <p>A contractor assessment has been flagged as <span class="${alert.riskLevel === 'High' ? 'alert-high' : 'alert-medium'}">${alert.riskLevel} Risk</span></p>
            </div>
            <div class="content">
              <div class="info-grid">
                <div class="info-item">
                  <strong>Risk Score</strong><br>
                  ${alert.riskScore}/15
                </div>
                <div class="info-item">
                  <strong>Country</strong><br>
                  ${alert.country}
                </div>
                <div class="info-item">
                  <strong>Contract Type</strong><br>
                  ${alert.contractType.toUpperCase()}
                </div>
                <div class="info-item">
                  <strong>Contract Value</strong><br>
                  $${alert.contractValue.toLocaleString()}
                </div>
              </div>
              ${this.config.includeDetails ? `
                <div class="reasons">
                  <strong>Risk Factors:</strong>
                  <ul>
                    ${alert.reasons.map(reason => `<li>${reason}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              <div class="footer">
                <p>Assessment ID: ${alert.id}</p>
                <p>Timestamp: ${new Date(alert.timestamp).toLocaleString()}</p>
                <p>This is an automated alert from the Compliance Risk Pilot system.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateEmailText(alert: RiskAlert): string {
    return `
🚨 HIGH RISK ASSESSMENT ALERT

A contractor assessment has been flagged as ${alert.riskLevel} Risk

ASSESSMENT DETAILS:
- Risk Score: ${alert.riskScore}/15
- Country: ${alert.country}
- Contract Type: ${alert.contractType.toUpperCase()}
- Contract Value: $${alert.contractValue.toLocaleString()}
- Assessment ID: ${alert.id}
- Timestamp: ${new Date(alert.timestamp).toLocaleString()}

${this.config.includeDetails ? `
RISK FACTORS:
${alert.reasons.map(reason => `• ${reason}`).join('\n')}
` : ''}

This is an automated alert from the Compliance Risk Pilot system.
    `.trim();
  }

  private getActiveChannels(): string[] {
    const channels = [];
    if (this.config.adminEmails.length > 0) channels.push('email');
    if (this.config.webhookUrl) channels.push('slack');
    return channels;
  }

  // Simulation methods (replace with actual implementations in production)
  private async simulateEmailService(emailData: any): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In production, replace with actual email service:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.sendMultiple(emailData);
    */
  }

  private async simulateWebhookCall(url: string, data: any): Promise<void> {
    // Simulate webhook call delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // In production, replace with actual HTTP request:
    /*
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    */
  }

  // Configuration methods
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService();