module.exports = {
  apps: [
    {
      name: "qr-genie-next",
      cwd: "/var/www/qr-genie",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://qr_genie:QrGenie123!@localhost:5432/qr_genie?schema=public"
      }
    }
  ]
};
