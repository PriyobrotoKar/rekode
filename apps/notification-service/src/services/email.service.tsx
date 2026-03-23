import VerifyOtpEmail from '@/templates/emails/verify-otp-email';
import { WelcomeEmail } from '@/templates/emails/welcome';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.getOrThrow('SMTP_USER'),
        pass: this.configService.getOrThrow('SMTP_PASS'),
      },
    });
  }

  async sendVerifyOtpMail(email: string, otp: string) {
    this.logger.log(`Sending verify OTP email to ${email}`);

    const body = await render(<VerifyOtpEmail otp={otp} />);

    await this.sendMail({
      email,
      subject: 'Verify your OTP',
      body,
    });
  }

  async sendWelcomeMail(email: string) {
    this.logger.log(`Sending welcome email to ${email}`);

    const body = await render(<WelcomeEmail />);

    await this.sendMail({
      email,
      subject: 'Welcome to Rekode',
      body,
    });
  }

  private async sendMail({
    email,
    subject,
    body,
  }: {
    email: string;
    subject: string;
    body: string;
  }) {
    const isProd = this.configService.get('APP_ENV') === 'production';

    if (!isProd) {
      this.logger.debug(`Skipping sending email to ${email} in non-production environment`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.getOrThrow('FROM_EMAIL'),
        to: email,
        subject,
        html: body,
      });

      this.logger.log(`Email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${email}`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}
