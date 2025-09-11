const express = require('express');
const multer = require('multer');
const path = require('path');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const sharp = require('sharp');

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
  const processedPath = imagePath.replace(path.extname(imagePath), '_processed.png');

  try {
    // Pré-processar imagem para melhorar OCR
    await sharp(imagePath)
      .grayscale()
      .normalize()
      .threshold(150)
      .toFile(processedPath);

    // Extrair texto com Tesseract (português + inglês)
    const { data: { text } } = await Tesseract.recognize(processedPath, 'por+eng');

    // Apaga arquivos temporários
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);

    res.json({ text });
  } catch (err) {
    // Apaga arquivos mesmo em caso de erro
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
    res.status(500).json({ error: 'Erro ao extrair texto', details: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
