import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { EmailService } from './services/email.service';

@Controller()
export class NotificationController {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('user.created')
  handleUserCreated(@Payload() data: { email: string }) {
    this.emailService.sendWelcomeMail(data.email);
  }

  @MessagePattern('auth.login_otp_requested')
  handleLoginOtpRequested(@Payload() data: { email: string; otp: string }) {
    this.emailService.sendVerifyOtpMail(data.email, data.otp);
  }
}
