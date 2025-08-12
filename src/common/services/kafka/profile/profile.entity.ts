import { IRole } from '@interfaces/role.interface';

export class Profile {
  kid?: string;
  _id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  national_code?: string;
  birth_date?: string;
  mobile?: {
    prefix?: string;
    mobile_number?: string;
    country_code?: string;
  };
  mobile_verified?: boolean;
  enabled?: boolean;
  gender?: string;
  groups?: string[];
  clients?: string[];
  roles?: IRole[];
  username?: string;
  language?: string;
  branch?: string;
  timestamps?: number[];
  third_party_provider?: string;
  is_verified_via_third_party?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
