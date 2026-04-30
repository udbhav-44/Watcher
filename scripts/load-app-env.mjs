import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

export const loadAppEnv = ({
  dev = process.env.NODE_ENV !== "production"
} = {}) => {
  loadEnvConfig(process.cwd(), dev);
};
