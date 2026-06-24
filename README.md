# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

Dưới đây là các bước để cài đặt dependencies và chạy project ở môi trường local bằng `npm`.

### 1. Cài đặt các gói phụ thuộc (Installation)
Mở terminal tại thư mục gốc của dự án và chạy câu lệnh sau:
```bash
npm install

```

### 2. Chạy ứng dụng (Development Mode)

Để khởi động server phát triển, hãy chạy câu lệnh:

```bash
npm run dev

```

> 🌐 **Địa chỉ truy cập (URL & Port mặc định của Vite):**
> * **Local:** `http://localhost:5173/`
> * *Lưu ý: Nếu port `5173` đã bị chiếm dụng bởi ứng dụng khác, Vite sẽ tự động đổi sang port tiếp theo (ví dụ: `5174`). Bạn hãy kiểm tra chính xác đường dẫn hiển thị ở Terminal sau khi chạy lệnh nhé.*
> 
> 

### 3. Các câu lệnh khác (Other Scripts)

* **Build ứng dụng cho Production:**
```bash
npm run build

```


* **Xem trước bản Build ở Local (Preview):**
```bash
npm run preview

```


*(Mặc định chạy tại link: `http://localhost:4173/`)*
* **Kiểm tra lỗi Code (Linting):**
```bash
npm run lint

```



---

## Plugins chính thức hiện có

Currently, two official plugins are available:

* [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
* [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```