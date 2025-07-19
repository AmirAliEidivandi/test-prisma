type User = {
  readonly exp?: number;
  readonly iat?: number;
  readonly jti?: string;
  readonly iss?: string;
  readonly aud?: string[];
  readonly sub: string;
  readonly typ?: string;
  readonly azp?: string;
  readonly session_state?: string;
  readonly acr?: string;
  readonly realm_access?: RealmAccess;
  readonly resource_access?: ResourceAccess;
  readonly scope?: string;
  readonly sid?: string;
  readonly email_verified?: boolean;
  readonly name?: string;
  readonly groups?: string[];
  readonly preferred_username?: string;
  readonly given_name?: string;
  readonly family_name?: string;
  readonly email: string;
  roles?: string[];
  readonly profile_id: string;
};

type RealmAccess = {
  readonly roles?: string[];
};

type ResourceAccess = {
  readonly [key: string]: RealmAccess;
};
