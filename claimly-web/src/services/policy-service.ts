import axios from "axios";

import { Policy } from "@/constraints/types/claim-types";
import { routes } from "@/utils/api";
import { keysToCamelCase } from "@/utils/core-utils";

export const fetchPolicy = async (): Promise<Policy> => {
  const response = await axios.get(routes.policy);
  return { rules: keysToCamelCase(response.data.rules), currencyRates: response.data.currency_rates };
};
