const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const PORT = 3001;

app.use(cors());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Backend do Read.y funcionando!");
});

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const filePath = req.file.path;

    console.log("PDF recebido no backend:", req.file.originalname);

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), req.file.originalname);

    const pythonResponse = await axios.post(
      "http://127.0.0.1:8000/process-pdf",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    console.log("Resposta recebida do Python:", pythonResponse.data.blocks?.length, "blocos");

    res.json({
      title: req.file.originalname.replace(/\.pdf$/i, ""),
      filename: pythonResponse.data.filename,
      blocks: pythonResponse.data.blocks,
    });

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      error: "Erro ao processar PDF",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});