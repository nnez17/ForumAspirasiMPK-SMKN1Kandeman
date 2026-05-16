# Forum Aspirasi MPK SMKN 1 Kandeman

A modern web application designed for students of SMKN 1 Kandeman to communicate their aspirations, suggestions, and feedback to the Student Representative Body (MPK - Majelis Perwakilan Kelas).

## Overview

This project serves as a digital bridge between the student body and the MPK. It allows students to submit their concerns or ideas through a structured platform, which can then be managed and processed by the MPK administrators.

## Tech Stack

The application is built using a modern and high-performance technology stack:

- **Frontend**: [Astro](https://astro.build/) - A web framework for building fast, content-driven websites.
- **UI Components**: [Svelte 5](https://svelte.dev/) - For interactive and reactive user interface elements.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) - For a clean, responsive, and utility-first design.
- **Backend/API**: [ElysiaJS](https://elysiajs.com/) - A fast and type-safe backend framework.
- **Runtime**: [Bun](https://bun.sh/) - A fast all-in-one JavaScript runtime and package manager.
- **Database/Storage**: [Firebase](https://firebase.google.com/) and [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).
- **Deployment**: [Vercel](https://vercel.com/) - Optimized for Astro and high availability.

## Features

- **Student Aspirations**: Secure submission form for students to provide feedback.
- **Admin Dashboard**: Comprehensive management system for MPK administrators to track and respond to aspirations.
- **Information Hub**: A blog/news section to share updates and school information.
- **Organizational Structure**: Interactive display of the MPK management and committees.
- **Responsive Design**: Optimized for viewing on both desktop and mobile devices.

## Project Structure

The project follows a standard Astro and Svelte organization:

```text
/
├── public/              # Static assets (images, fonts, favicon)
├── src/
│   ├── api/             # ElysiaJS backend API definitions and routes
│   ├── components/      # Shared Svelte and Astro components
│   │   └── ui/          # Shadcn UI component library
│   ├── data/            # Static data, schemas, and constant definitions
│   ├── hooks/           # Svelte runes and custom hooks
│   ├── layouts/         # Common page layouts (Header, Footer, Meta tags)
│   ├── lib/             # Core logic, Firebase config, and utility functions
│   ├── pages/           # File-based routing for the application
│   │   ├── admin/       # Management dashboard routes
│   │   ├── api/         # API endpoint mounting
│   │   └── blog/        # Public news and information routes
│   └── styles/          # Global CSS and Tailwind CSS configuration
├── astro.config.mjs     # Astro integration and build settings
├── biome.json           # Linting and formatting configuration
├── package.json         # Dependencies and project scripts
└── tsconfig.json        # TypeScript compiler configuration
```s

## License

This project is developed for SMKN 1 Kandeman.
