import { KafkaServiceConstants } from '@constants/kafka.constants';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { decrypt, encrypt } from '@utils/encryption.util';
import { WalletResponse } from './wallet-response.entity';
import { Wallet } from './wallet.entity';

@Injectable()
export class WalletKafkaService implements OnModuleInit {
  constructor(
    @Inject(KafkaServiceConstants.PAY_SERVICE_NAME)
    private readonly kafkaClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(
      KafkaServiceConstants.TOPICS.GET_WALLET_BY_PROFILE_ID,
    );
    this.kafkaClient.subscribeToResponseOf(
      KafkaServiceConstants.TOPICS.DEBIT_WALLET,
    );
  }

  async getWalletByProfileId(profile_id: string) {
    return new Promise<Wallet>((resolve, reject) => {
      this.kafkaClient
        .send(
          KafkaServiceConstants.TOPICS.GET_WALLET_BY_PROFILE_ID,
          encrypt({ profile_id }),
        )
        .subscribe({
          next: (value) => {
            const response = decrypt(value) as WalletResponse;
            resolve(response.data[0]);
          },
          error: (error) => reject(error),
        });
    });
  }

  async debitWallet(payload: {
    profile_id: string;
    amount: number;
    currency?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }) {
    return new Promise<{ success: boolean; balance?: number }>(
      (resolve, reject) => {
        this.kafkaClient
          .send(KafkaServiceConstants.TOPICS.DEBIT_WALLET, encrypt(payload))
          .subscribe({
            next: (value) => {
              const response = decrypt(value) as WalletResponse;
              resolve({
                success: response.success,
                balance: response.data[0].balance,
              });
            },
            error: (error) => reject(error),
          });
      },
    );
  }
}
