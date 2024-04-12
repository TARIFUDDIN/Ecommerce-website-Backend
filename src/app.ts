import express from 'express'
const port=4450;
const app=express();
app.listen(port,()=>{
    console.log(`Express is working on https://localhost:${port}`)
});