require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const prisma = require("./prisma");
const { GoogleGenAI } = require("@google/genai");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || "ready-dev-secret";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const upload = multer({ dest: "uploads/" });

// Configuração do multer para upload de avatares
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const avatarDir = "uploads/avatars";

    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }

    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const extension = file.originalname.split(".").pop();
    const fileName = `${req.user.id}-${Date.now()}.${extension}`;

    cb(null, fileName);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Arquivo inválido. Envie uma imagem."));
    }

    cb(null, true);
  },
});

app.get("/", (req, res) => {
  res.send("Backend do Read.y funcionando!");
});

// Endpoint para cadastro de usuário
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "E-mail e senha são obrigatórios.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter pelo menos 6 caracteres.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Já existe uma conta com esse e-mail.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: normalizedEmail,
        password: hashedPassword,
        settings: {
          create: {},
        },
      },
      include: {
        settings: true,
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao cadastrar usuário",
      details: error.message,
    });
  }
});

// Endpoint para login de usuário
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "E-mail e senha são obrigatórios.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "E-mail ou senha inválidos.",
      });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({
        error: "E-mail ou senha inválidos.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao fazer login",
      details: error.message,
    });
  }
});

// Middleware para autenticação de rotas protegidas
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Token não informado.",
      });
    }

    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({
        error: "Token inválido.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Usuário não encontrado.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Token inválido ou expirado.",
    });
  }
};

// Endpoint para buscar usuário autenticado
app.get("/auth/me", authenticateUser, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl,
    },
  });
});

// Endpoint para upload de PDF
app.post("/upload-pdf", authenticateUser, upload.single("pdf"), async (req, res) => {
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
        userId: req.user.id,
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
app.get("/documents", authenticateUser, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        userId: req.user.id,
      },
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

// Endpoint para buscar ou criar configurações do leitor do usuário autenticado
app.get("/reader-settings", authenticateUser, async (req, res) => {
  try {
    const settings = await prisma.readerSettings.upsert({
      where: {
        userId: req.user.id,
      },
      update: {},
      create: {
        userId: req.user.id,
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

// Endpoint para atualizar configurações do leitor do usuário autenticado
app.patch("/reader-settings", authenticateUser, async (req, res) => {
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
        userId: req.user.id,
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
        userId: req.user.id,
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

// Endpoint para simplificar o texto da página atual de um documento com IA
app.post("/documents/:id/simplify", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { page } = req.body;

    const pageNumber = Number(page);

    if (Number.isNaN(pageNumber)) {
      return res.status(400).json({
        error: "Página inválida",
      });
    }

    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        blocks: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        error: "Documento não encontrado",
      });
    }

    const updatedBlocks = [...document.blocks];

    const blocksToSimplify = document.blocks
      .sort((a, b) => a.order - b.order)
      .filter((block) => {
        const originalText = block.originalText?.trim();

        if (!originalText) return false;

        const blockPage = block.page ?? 1;

        if (blockPage !== pageNumber) return false;

        // Ignora apenas títulos. Notas podem ser simplificadas.
        if (block.type === "title") return false;

        // Evita gastar IA com fragmentos muito pequenos.
        if (originalText.length < 40) return false;

        const alreadyHasRealSimplification =
          block.simplifiedText &&
          !block.simplifiedText.startsWith("[Simplificado]");

        if (alreadyHasRealSimplification) return false;

        return true;
      })
      .slice(0, 3);

    if (blocksToSimplify.length === 0) {
      return res.json({
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        progress: document.progress,
        favorite: document.favorite,
        currentPage: document.currentPage,
        scrollPercent: document.scrollPercent,
        blocks: updatedBlocks.sort((a, b) => a.order - b.order),
      });
    }

    let successCount = 0;

for (const block of blocksToSimplify) {
  try {
    const originalText = block.originalText.trim();

    const prompt = `
Você é um assistente de acessibilidade textual.

Reescreva o texto abaixo em linguagem mais simples, clara e acessível.

Regras:
- Mantenha o sentido original.
- Mantenha títulos e subtítulos.
- Substitua palavras difíceis por alternativas mais simples quando isso não mudar o sentido do texto.
- Preserve nomes próprios, datas, citações, conceitos importantes e termos técnicos necessários.
- Não faça um resumo ou uma versão muito curta do texto. Mantenha o máximo possível do conteúdo original, apenas reescrevendo para ser mais fácil de entender.
- Não adicione informações novas.
- Não dê várias opções.
- Não explique o que você fez.
- Não use markdown.
- Retorne somente uma versão final do texto simplificado.

Texto:
${originalText}
`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const simplifiedText = aiResponse.text?.trim();

    const updatedBlock = await prisma.documentBlock.update({
      where: {
        id: block.id,
      },
      data: {
        simplifiedText: simplifiedText || originalText,
      },
    });

    const updatedBlockIndex = updatedBlocks.findIndex(
      (item) => item.id === updatedBlock.id
    );

    if (updatedBlockIndex !== -1) {
      updatedBlocks[updatedBlockIndex] = updatedBlock;
    }

    successCount++;
  } catch (blockError) {
    console.error("Erro ao simplificar bloco:", block.id, blockError.message);
  }
}

if (successCount === 0) {
  return res.status(503).json({
    error: "Não foi possível simplificar agora. Tente novamente em alguns instantes.",
  });
}

    res.json({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      progress: document.progress,
      favorite: document.favorite,
      currentPage: document.currentPage,
      scrollPercent: document.scrollPercent,
      blocks: updatedBlocks.sort((a, b) => a.order - b.order),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao simplificar documento",
      details: error.message,
    });
  }
});

// Endpoint para upload temporário de PDF, usado na leitura rápida sem login
app.post("/upload-pdf/temporary", upload.single("pdf"), async (req, res) => {
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
    const temporaryDocumentId = `temporary-${Date.now()}`;

    res.json({
      id: temporaryDocumentId,
      title: originalName.replace(/\.pdf$/i, ""),
      fileName: originalName,
      progress: 0,
      favorite: false,
      currentPage: 0,
      scrollPercent: 0,
      temporary: true,
      blocks: blocks.map((block, index) => ({
        id: `temporary-block-${index}`,
        documentId: temporaryDocumentId,
        order: block.order ?? index,
        type: block.type ?? "paragraph",
        originalText: block.originalText ?? "",
        simplifiedText: null,
        page: block.page ?? null,
        sourceType: block.sourceType ?? null,
      })),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao processar PDF temporário",
      details: error.message,
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Endpoint para excluir a conta do usuário autenticado
app.delete("/auth/account", authenticateUser, async (req, res) => {
  try {
    await prisma.user.delete({
      where: {
        id: req.user.id,
      },
    });

    res.json({
      message: "Conta excluída com sucesso.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao excluir conta",
      details: error.message,
    });
  }
});

// Endpoint para atualizar perfil do usuário autenticado
app.patch("/auth/profile", authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Nome inválido.",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        name: name.trim(),
      },
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao atualizar perfil",
      details: error.message,
    });
  }
});

// Endpoint para atualizar foto de perfil do usuário autenticado
app.patch(
  "/auth/avatar",
  authenticateUser,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Nenhuma imagem foi enviada.",
        });
      }

      const avatarUrl = `http://localhost:3001/uploads/avatars/${req.file.filename}`;

      const user = await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          avatarUrl,
        },
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Erro ao atualizar foto de perfil",
        details: error.message,
      });
    }
  }
);





app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});