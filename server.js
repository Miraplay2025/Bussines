const express = require('express');
const multer = require('multer');
const path = require('path');
const Tesseract = require('tesseract.js');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Cria a pasta uploads se não existir
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Servir arquivos estáticos
app.use(express.static('public'));

// Endpoint para extrair texto
app.post('/extract-text', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

  const imagePath = req.file.path;

  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'por');
    // Apaga a imagem após processamento
    fs.unlinkSync(imagePath);
    res.json({ text });
  } catch (err) {
    // Apaga a imagem mesmo em caso de erro
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    res.status(500).json({ error: 'Erro ao extrair texto' });
  }
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
