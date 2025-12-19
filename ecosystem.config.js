module.exports = {
  apps: [
    {
      name: "SIO",
      script: "server/server.js",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
      node_args: "--max-old-space-size=512",
      merge_logs: false,
      autorestart: true,
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      time: false
    }
  ]
};
