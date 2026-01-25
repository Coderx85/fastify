export const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  HOSTNAME: process.env.HOSTNAME || "localhost",
};
