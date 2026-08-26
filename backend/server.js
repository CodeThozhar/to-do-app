const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: "Nexora API is running 🚀" });
});

app.listen(port, () => {
  console.log(`Nexora backend running on port ${port}`);
});
