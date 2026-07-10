# AI LaTeX Repair Engine

> Offline-first, privacy-focused LaTeX debugging platform that fixes AI-generated LaTeX errors and compiles PDFs directly in the browser using WebAssembly.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB)
![PWA](https://img.shields.io/badge/PWA-Enabled-purple)
![WebAssembly](https://img.shields.io/badge/WebAssembly-pdfLaTeX-orange)

---

## ✨ Features

- 📝 Monaco Editor powered LaTeX editor
- 📄 Browser-side PDF compilation using pdfLaTeX WebAssembly
- 🤖 AI repair prompt generation for fixing LaTeX errors
- 🔍 Human-readable error explanations
- ✂️ Minimal failing snippet extraction
- ⚡ Instant PDF preview
- 📦 Progressive Web App (PWA)
- 🌐 Fully offline capable
- 🔒 Privacy-first (everything runs locally)
- 🚫 No backend required
- 🚫 No telemetry or analytics
- ❤️ Open Source

---

# 🚀 Live Demo

[Demo link](https://latextopdf01.newhoster0002.workers.dev/)

---

# 🏗 Architecture

```
                 ┌──────────────────────────────┐
                 │        React Frontend        │
                 └──────────────┬───────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
  Monaco Editor         AI Prompt Generator      PDF Viewer
         │
         ▼
 LaTeX Source Editor
         │
         ▼
 pdfLaTeX WebAssembly
         │
         ▼
 Error Diagnostics
         │
         ▼
 Error Parser
         │
         ▼
 Minimal Snippet Extractor
         │
         ▼
 AI Repair Prompt
```

Everything executes inside the browser.

No servers.

No database.

No cloud processing.

---

# 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| React | Frontend |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Monaco Editor | Code Editor |
| pdfLaTeX WebAssembly | PDF Compiler |
| Tailwind CSS | Styling |
| PWA | Offline Support |

---

# 📂 Project Structure

```
LatextoPDF
│
├── public/
│
├── src/
│   ├── components/
│   ├── editor/
│   ├── compiler/
│   ├── parser/
│   ├── prompts/
│   ├── hooks/
│   ├── utils/
│   ├── pages/
│   └── assets/
│
├── docs/
│
├── package.json
├── vite.config.ts
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js 20+
- npm / pnpm / yarn

---

## Clone Repository

```bash
git clone https://github.com/ioarunkumar/LatextoPDF.git

cd LatextoPDF
```

---

## Install Dependencies

```bash
npm install
```

---

## Start Development Server

```bash
npm run dev
```

Open

```
http://localhost:5173
```

---

## Build for Production

```bash
npm run build
```

The production build will be generated inside

```
dist/
```

---

# 🌍 Self Hosting

The application is completely static after building.

You can deploy it anywhere.

---

## Nginx

Build the project

```bash
npm run build
```

Copy

```
dist/
```

to

```
/var/www/latex-repair
```

Example configuration

```nginx
server {

    listen 80;

    server_name your-domain.com;

    root /var/www/latex-repair;

    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location ~* \.(js|css|wasm|json|png|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public";
    }

}
```

Restart nginx

```bash
sudo systemctl restart nginx
```

---

## Apache

Enable Rewrite

```bash
sudo a2enmod rewrite
```

Create `.htaccess`

```apache
<IfModule mod_rewrite.c>

RewriteEngine On

RewriteBase /

RewriteRule ^index\.html$ - [L]

RewriteCond %{REQUEST_FILENAME} !-f

RewriteCond %{REQUEST_FILENAME} !-d

RewriteRule . /index.html [L]

</IfModule>
```

---

## Docker

```dockerfile
FROM node:22-alpine AS build

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx","-g","daemon off;"]
```

Build

```bash
docker build -t latexpdf .
```

Run

```bash
docker run -d \
-p 80:80 \
--restart always \
latexpdf
```

---

## Static Hosting

Compatible with

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3
- CloudFront

Simply upload the `dist` folder.

---

# 🤖 How It Works

```
Write LaTeX

      │

      ▼

Compile with pdfLaTeX WASM

      │

      ▼

Parse Compilation Errors

      │

      ▼

Extract Minimal Broken Code

      │

      ▼

Generate AI Repair Prompt

      │

      ▼

Paste into your AI Assistant

      │

      ▼

Receive Fixed LaTeX

      │

      ▼

Compile Again
```

---

# 📦 Available Scripts

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Creates the production build.

```bash
npm run preview
```

Runs the production build locally.

```bash
npm run lint
```

Checks for linting issues.

---

# 🔒 Privacy

Everything runs locally in your browser.

- No backend
- No login
- No cloud processing
- No analytics
- No cookies
- No telemetry
- No user tracking

Your LaTeX files never leave your device.

---

# 🚀 Roadmap

- [ ] Multi-file LaTeX projects
- [ ] BibTeX support
- [ ] TikZ improvements
- [ ] Theme support
- [ ] Project templates
- [ ] Auto-save history
- [ ] AI provider integrations
- [ ] Plugin architecture
- [ ] Keyboard shortcuts customization

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push your branch

```bash
git push origin feature/your-feature
```

5. Open a Pull Request

---

# 🐛 Reporting Issues

Please include:

- Browser version
- Operating System
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)

---

# 📄 License

This project is licensed under the MIT License.

See the **LICENSE** file for more information.

---

# ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

It helps the project reach more developers.

---

# 👨‍💻 Author

**Arun Kumar**

GitHub: https://github.com/ioarunkumar

Feel free to open issues, suggest improvements, or contribute to the project.
