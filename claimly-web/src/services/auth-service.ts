import axios from "axios";

import { User } from "@/constraints/types/claim-types";
import { routes } from "@/utils/api";
import { keysToCamelCase } from "@/utils/core-utils";

export const signIn = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  const response = await axios.post(routes.auth.login, { email, password });
  return { token: response.data.access_token, user: keysToCamelCase(response.data.user) };
};

export const fetchMe = async (): Promise<User> => {
  const response = await axios.get(routes.auth.me);
  return keysToCamelCase(response.data);
};
