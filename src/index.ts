import { config } from "./lib/config";
import fastifyServer from "./server";
import { type FastifyServerOptions } from "fastify";

const PORT = config.PORT;

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

app.listen({ port: PORT }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
