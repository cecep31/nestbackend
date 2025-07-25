import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [EmailModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}