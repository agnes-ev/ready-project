const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const prisma = require("./prisma");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Backend do Read.y funcionando!");
});

// Endpoint para upload de PDF
app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Nenhum arquivo PDF foi enviado.",
      });
    }

    filePath = req.file.path;

      const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");

      const form = new FormData();
      form.append("file", fs.createReadStream(filePath), originalName);

    const pythonResponse = await axios.post(
      "http://127.0.0.1:8000/process-pdf",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    const blocks = pythonResponse.data.blocks || [];

    const savedDocument = await prisma.document.create({
      data: {
        title: originalName.replace(/\.pdf$/i, ""),
        fileName: originalName,
        blocks: {
          create: blocks.map((block, index) => ({
            order: block.order ?? index,
            type: block.type ?? "paragraph",
            originalText: block.originalText ?? "",
            simplifiedText: null,
            page: block.page ?? null,
            sourceType: block.sourceType ?? null,
          })),
        },
      },
      include: {
        blocks: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });




    res.json({
      id: savedDocument.id,
      title: savedDocument.title,
      fileName: savedDocument.fileName,
      filename: pythonResponse.data.filename,
      progress: savedDocument.progress,
      favorite: savedDocument.favorite,
      currentPage: savedDocument.currentPage,
      scrollPercent: savedDocument.scrollPercent,
      blocks: savedDocument.blocks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao processar PDF",
      details: error.message,
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Endpoint para buscar todos os documentos
app.get("/documents", async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: [
        {
          lastOpenedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      include: {
        blocks: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    res.json(
      documents.map((document) => ({
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        progress: document.progress,
        favorite: document.favorite,
        currentPage: document.currentPage,
        scrollPercent: document.scrollPercent,
        blocks: document.blocks,
      }))
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao buscar documentos",
      details: error.message,
    });
  }
});

// Endpoint para deletar um documento
app.delete("/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.document.delete({
      where: { id },
    });

    res.json({
      message: "Documento apagado com sucesso",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao apagar documento",
      details: error.message,
    });
  }
});

// Endpoint para atualizar o último acesso do documento
app.patch("/documents/:id/open", async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.update({
      where: { id },
      data: {
        lastOpenedAt: new Date(),
      },
      include: {
        blocks: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    res.json({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      progress: document.progress,
      favorite: document.favorite,
      blocks: document.blocks,
      currentPage: document.currentPage,
      scrollPercent: document.scrollPercent,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao atualizar último acesso",
      details: error.message,
    });
  }
});

// Endpoint para atualizar o status de favorito do documento
app.patch("/documents/:id/favorite", async (req, res) => {
  try {
    const { id } = req.params;
    const { favorite } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        favorite: Boolean(favorite),
      },
      include: {
        blocks: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    res.json({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      progress: document.progress ?? 0,
      favorite: document.favorite,
      blocks: document.blocks,
      currentPage: document.currentPage,
      scrollPercent: document.scrollPercent,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao atualizar favorito",
      details: error.message,
    });
  }
});

// Endpoint para atualizar o título do documento
app.patch("/documents/:id/title", async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Título inválido",
      });
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        title: title.trim(),
      },
      include: {
        blocks: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    res.json({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      progress: document.progress ?? 0,
      favorite: document.favorite,
      blocks: document.blocks,
      currentPage: document.currentPage,
      scrollPercent: document.scrollPercent,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao atualizar título",
      details: error.message,
    });
  }
});

// Endpoint para atualizar o progresso de leitura do documento
app.patch("/documents/:id/progress", async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    const safeProgress = Math.max(0, Math.min(100, Number(progress)));

    if (Number.isNaN(safeProgress)) {
      return res.status(400).json({
        error: "Progresso inválido",
      });
    }

    const currentDocument = await prisma.document.findUnique({
      where: { id },
    });

    if (!currentDocument) {
      return res.status(404).json({
        error: "Documento não encontrado",
      });
    }

    const nextProgress = Math.max(currentDocument.progress, safeProgress);

    const document = await prisma.document.update({
      where: { id },
      data: {
        progress: nextProgress,
      },
      include: {
        blocks: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    res.json({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      progress: document.progress,
      favorite: document.favorite,
      blocks: document.blocks,
      currentPage: document.currentPage,
      scrollPercent: document.scrollPercent,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao atualizar progresso",
      details: error.message,
    });
  }
});

// Endpoint para buscar ou criar configurações do leitor
app.get("/reader-settings", async (req, res) => {
  try {
    const settings = await prisma.readerSettings.upsert({
      where: {
        userKey: "default-user",
      },
      update: {},
      create: {
        userKey: "default-user",
      },
    });

    res.json(settings);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao buscar configurações do leitor",
      details: error.message,
    });
  }
});

// Endpoint para atualizar configurações do leitor
app.patch("/reader-settings", async (req, res) => {
  try {
    const {
      fontSize,
      lineHeight,
      letterSpacing,
      contrast,
      readingMode,
      focusMode,
      fontFamily,
      bold,
      italic,
    } = req.body;

    const settings = await prisma.readerSettings.upsert({
      where: {
        userKey: "default-user",
      },
      update: {
        fontSize,
        lineHeight,
        letterSpacing,
        contrast,
        readingMode,
        focusMode,
        fontFamily,
        bold,
        italic,
      },
      create: {
        userKey: "default-user",
        fontSize,
        lineHeight,
        letterSpacing,
        contrast,
        readingMode,
        focusMode,
        fontFamily,
        bold,
        italic,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao salvar configurações do leitor",
      details: error.message,
    });
  }
});

// Endpoint para atualizar a posição de leitura do documento
app.patch("/documents/:id/position", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPage, scrollPercent } = req.body;

    const dataToUpdate = {};

    if (typeof currentPage === "number") {
      dataToUpdate.currentPage = Math.max(0, currentPage);
    }

    if (typeof scrollPercent === "number") {
      dataToUpdate.scrollPercent = Math.max(
        0,
        Math.min(100, scrollPercent)
      );
    }

    const document = await prisma.document.update({
      where: { id },
      data: dataToUpdate,
      include: {
        blocks: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    res.json({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      progress: document.progress,
      favorite: document.favorite,
      currentPage: document.currentPage,
      scrollPercent: document.scrollPercent,
      blocks: document.blocks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao salvar posição de leitura",
      details: error.message,
    });
  }
});

// Endpoint temporário para testar simplificação de texto
app.post("/documents/:id/simplify", async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        blocks: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        error: "Documento não encontrado",
      });
    }

    const updatedBlocks = await Promise.all(
      document.blocks.map((block) => {
        if (!block.originalText || block.originalText.trim().length === 0) {
          return block;
        }

        if (block.simplifiedText) {
          return block;
        }

        return prisma.documentBlock.update({
          where: {
            id: block.id,
          },
          data: {
            simplifiedText: `[Simplificado] ${block.originalText}`,
          },
        });
      })
    );

    res.json({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      progress: document.progress,
      favorite: document.favorite,
      currentPage: document.currentPage,
      scrollPercent: document.scrollPercent,
      blocks: updatedBlocks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao simplificar documento",
      details: error.message,
    });
  }
});



app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});