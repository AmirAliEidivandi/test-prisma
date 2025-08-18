import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

export interface KafkaLogEvent {
  service: string;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  metadata?: Record<string, any>;
  error?: { name: string; message: string; stack?: string };
  timestamp?: string;
}

@Injectable()
export class LogKafkaService implements OnModuleInit {
  constructor(
    @Inject(KafkaServiceConstants.LOG_SERVICE_NAME)
    private readonly client: ClientKafka,
  ) {}

  onModuleInit() {
    // no request/response patterns; fire-and-forget emit
  }

  async emit(event: KafkaLogEvent): Promise<void> {
    try {
      const payload = {
        ...event,
        timestamp: event.timestamp ?? new Date().toISOString(),
      };
      this.client.emit('log', payload);
    } catch (error) {
      // avoid throwing to not break request flow
    }
  }
}
