import { Profile } from '../profile/profile.entity';

export class Wallet {
  _id?: string;
  balance?: number;
  profile_id?: string;
  profile?: Profile;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}
