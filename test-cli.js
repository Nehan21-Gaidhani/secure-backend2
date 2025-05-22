const axios = require('axios');

const email = "nehanshugaidhani@gmail.com";
const password = process.env.EMAIL_PASS; 
const TOTAL_ATTEMPTS = 10;

(async () => {
  for (let i = 0; i < TOTAL_ATTEMPTS; i++) {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password
      });
      console.log(`[${i + 1}] ✅ Success:`, res.data);
    } catch (err) {
      console.log(`[${i + 1}] ❌ Error:`, err.response?.data || err.message);
    }
  }
})();
