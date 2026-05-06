# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev        # Start Vite dev server (host: 0.0.0.0, port 5173)
npm run build      # Production build
npm run preview    # Preview production build locally
```

## Architecture

A Vue 3 member management SPA (会员管理系统) for a chain store, using Element Plus for UI and SCSS for styles.

**Stack**: Vue 3 (Composition API + `<script setup>`) · Vite 8 · Element Plus 2 · Vue Router 5 · Axios 1. No Vuex/Pinia — auth state is stored directly in localStorage.

**Multi-tenant**: The `multi_tenant` branch adds store-scoping. Every API request includes `X-Store-Id` header from `localStorage.getItem('currentStoreId')`. The layout header has a store selector dropdown; changing it writes to localStorage and dispatches a `store-changed` custom event on `window`.

**Auth flow**: Phone + password + captcha login → JWT token saved to `localStorage('token')`, user object to `localStorage('user')`. Axios request interceptor attaches `Authorization: Bearer <token>`. The response interceptor checks for `code !== 200` (shows `ElMessage.error`) and 401 status (clears token, redirects to `/login`). Route guard (`router.beforeEach`) redirects to `/login` if no token.

**API layer** (`src/api/`): Axios instance in `index.js` creates the base client with interceptors. Each domain module (member, store, staff, etc.) imports this instance and exports named functions. Paginated endpoints use `{ page, size }` params. API responses follow `{ code: 200, data, msg }` shape.

**Routing**: `/login` (standalone, no layout). All other routes are children of `/` with the layout shell (`views/layout/index.vue`). The layout has a collapsible sidebar, breadcrumbs (driven by `meta.title`/`meta.parent`), page-tag tabs (router-link-based visited views with close/close-all/close-other), and a top header bar. Routes use lazy-loading.

**Module structure** (`src/views/`): Each business domain has its own directory (member, memberCard, cardTemplate, store, staff, serviceItem, consume, recharge, points). List views use Element Plus tables with search form + pagination. Detail/edit views use `el-form` with validation.

**State** (`src/store/auth.js`): Token get/set/remove via `localStorage('token')`. User get/set/remove via `localStorage('user')` (JSON serialized). `isLoggedIn()` returns `!!getToken()`.

**SCSS** (`src/styles/index.scss`): Global styles including layout classes (`.sidebar`, `.content-wrapper`, `.top-header`, `.main-content`), shared page patterns (`.page-header`, `.data-card`, `.stat-card`, `.form-container`, `.search-bar`), and status tag colors.

**Path alias**: `@` maps to `./src` (configured in both Vite and jsconfig.json).
