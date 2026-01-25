import { config } from "./lib/config.js";
import fastifyServer from "./server.js";
import { type FastifyServerOptions } from "fastify";

const PORT = config.PORT;
const HOSTNAME = config.HOSTNAME;

const isProduction = process.env.NODE_ENV === "production";

const opt: FastifyServerOptions = {
  logger: {
    transport: isProduction
      ? undefined
      : {
          target: "pino-pretty",
        },
  },
  routerOptions: {
    ignoreTrailingSlash: true,
  },
};

const app = await fastifyServer(opt);

app.listen({ port: PORT, host: HOSTNAME }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
