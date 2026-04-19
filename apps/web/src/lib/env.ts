const envDefaults = {
  VITE_APP_NAME: "EcoBairro",
  VITE_API_BASE_URL: "/api",
  VITE_ANALYTICS_BASE_URL: "/analytics",
} as const;

export type ClientEnv = {
  appName: string;
  apiBaseUrl: string;
  analyticsBaseUrl: string;
};

function readString(
  env: ImportMetaEnv,
  key: keyof typeof envDefaults,
  fallback: string,
) {
  const rawValue = env[key] ?? fallback;

  if (typeof rawValue !== "string") {
    throw new Error(`Expected ${key} to be a string.`);
  }

  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    throw new Error(`Expected ${key} to be defined.`);
  }

  return trimmedValue;
}

export function readClientEnv(env: ImportMetaEnv = import.meta.env): ClientEnv {
  return {
    appName: readString(env, "VITE_APP_NAME", envDefaults.VITE_APP_NAME),
    apiBaseUrl: readString(
      env,
      "VITE_API_BASE_URL",
      envDefaults.VITE_API_BASE_URL,
    ),
    analyticsBaseUrl: readString(
      env,
      "VITE_ANALYTICS_BASE_URL",
      envDefaults.VITE_ANALYTICS_BASE_URL,
    ),
  };
}

export const clientEnv = readClientEnv();
