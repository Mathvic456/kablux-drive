export type CREATEACCOUNT_TYPE = {
  email: string;
  password: string;
  role: "rider";
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
};
export type ProfileResponse = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: string;
  referral_code: string;
  phone_number: string
};