module.exports = {
  apps: [
    {
      name: "qr-genie-next",
      cwd: "/var/www/qr-genie",
      script: "npm",
      args: "start",
      // DATABASE_URL and all other secrets come from /var/www/qr-genie/.env, which Next.js loads at startup
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
