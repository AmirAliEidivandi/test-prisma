import { KafkaResponse } from '@dto/kafka-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Wallet } from './wallet.entity';

export class WalletResponse extends KafkaResponse<Wallet> {
  @ApiProperty({
    type: Wallet,
    description: 'Wallet',
  })
  @Type(() => Wallet)
  data: Wallet[];
}
