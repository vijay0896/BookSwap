const app = require("./app");
const cluster = require('cluster');
const os = require('os');

const PORT = process.env.PORT || 3000;

if (cluster.isMaster) {
  const cpuCount = os.cpus().length;
  console.log(`Master ${process.pid} is running`);
  console.log(`Forking ${cpuCount} workers...`);

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  // Optional: Restart a worker if it crashes
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking a new one.`);
    cluster.fork();
  });

} else {
  // Workers share the same server port
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Worker ${process.pid} is running on port ${PORT}`);
  });
}
