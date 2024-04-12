import express from 'express';
const port = 4450;
const app = express();
app.listen(port, () => {
    console.log(`Server is working on https://localhost:${port}`);
});
