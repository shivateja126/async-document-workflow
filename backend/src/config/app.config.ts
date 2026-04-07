export default () => ({
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000"
});
