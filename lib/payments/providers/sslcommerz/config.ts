import "server-only";

import {
  serverEnv,
} from "@/lib/env/server";

import {
  sslCommerzEnv,
} from "@/lib/payments/providers/sslcommerz/env";


const SANDBOX_BASE_URL =
  "https://sandbox.sslcommerz.com";

const PRODUCTION_BASE_URL =
  "https://securepay.sslcommerz.com";


function normalizeBaseUrl(
  value: string
) {
  return value.replace(
    /\/+$/,
    ""
  );
}


const providerBaseUrl =
  sslCommerzEnv.SSLCOMMERZ_MODE ===
  "production"
    ? PRODUCTION_BASE_URL
    : SANDBOX_BASE_URL;


const appBaseUrl =
  normalizeBaseUrl(
    serverEnv.APP_BASE_URL
  );


export const sslCommerzConfig = {
  mode:
    sslCommerzEnv.SSLCOMMERZ_MODE,

  storeId:
    sslCommerzEnv.SSLCOMMERZ_STORE_ID,

  storePassword:
    sslCommerzEnv.SSLCOMMERZ_STORE_PASSWORD,

  initiateUrl:
    `${providerBaseUrl}/gwprocess/v4/api.php`,

  validationUrl:
    `${providerBaseUrl}/validator/api/validationserverAPI.php`,

  successUrl:
    `${appBaseUrl}/api/payments/sslcommerz/success`,

  failureUrl:
    `${appBaseUrl}/api/payments/sslcommerz/fail`,

  cancelUrl:
    `${appBaseUrl}/api/payments/sslcommerz/cancel`,

  ipnUrl:
    `${appBaseUrl}/api/payments/sslcommerz/ipn`,

  expectedGatewayHostname:
    new URL(
      providerBaseUrl
    ).hostname,
} as const;