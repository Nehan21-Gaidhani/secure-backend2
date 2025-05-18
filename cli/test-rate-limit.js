const axios = require('axios');
const yargs = require('yargs');

const argv = yargs
  .option('count', { type: 'number', default: 20 })
  .option('type', { type: 'string', default: 'login' })
  .argv;

const endpoint = argv.type === 'register'
  ? 'http://localhost:5000/api/auth/register'
  : 'http://localhost:5000/api/auth/login';

async function run() {
  for (let i = 1; i <= argv.count; i++) {
    try {
      const res = await axios.post(endpoint, {
        email: `test${i}@email.com`,
        password: "test123"
      });
      console.log(`[${i}] ✅ ${res.status} - ${res.data.message || "OK"}`);
    } catch (err) {
      console.log(`[${i}] ❌ ${err.response?.status || "ERR"} - ${err.response?.data?.message}`);
    }
  }
}
run();
