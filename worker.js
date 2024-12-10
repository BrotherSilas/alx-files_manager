const dbClient = require('./utils/dbClient');
const redisClient = require('./utils/redisClient');

class Worker {
  constructor() {
    this.isRunning = false;
  }

  async processJob(job) {
    try {
      // Example: Fetch data from MongoDB based on the job
      const collection = await dbClient.collection('tasks');
      const task = await collection.findOne({ _id: job.taskId });

      if (!task) {
        console.log(`Task with ID ${job.taskId} not found.`);
        return;
      }

      console.log(`Processing task: ${JSON.stringify(task)}`);

      // Example: Update task status in Redis
      await redisClient.set(`task:${job.taskId}:status`, 'completed', 3600);
      console.log(`Task ${job.taskId} marked as completed in Redis.`);
    } catch (error) {
      console.error('Error processing job:', error);
    }
  }

  async run() {
    if (this.isRunning) {
      console.log('Worker is already running.');
      return;
    }

    console.log('Worker started.');
    this.isRunning = true;

    while (this.isRunning) {
      try {
        // Example: Fetch job data from Redis (simulate a job queue)
        const jobData = await redisClient.get('job:queue');

        if (jobData) {
          const job = JSON.parse(jobData);
          console.log(`Fetched job: ${JSON.stringify(job)}`);

          // Process the fetched job
          await this.processJob(job);

          // Remove the job from the queue
          await redisClient.del('job:queue');
          console.log('Job processed and removed from the queue.');
        } else {
          console.log('No jobs in the queue. Worker is idle...');
        }
      } catch (error) {
        console.error('Worker error:', error);
      }

      // Pause for a short duration before checking the queue again
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds
    }
  }

  stop() {
    console.log('Stopping worker...');
    this.isRunning = false;
  }
}

const worker = new Worker();

// Gracefully handle process termination
process.on('SIGINT', () => {
  worker.stop();
  dbClient.close();
  console.log('Worker stopped.');
  process.exit(0);
});

worker.run();

