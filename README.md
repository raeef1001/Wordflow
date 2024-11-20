# 📝 Modern Blogging Platform | Next.js Medium Clone

A modern, feature-rich blogging platform built with Next.js 13+, TypeScript, and Prisma. This application provides a seamless writing and reading experience with a beautiful, responsive design.

![Next.js](https://img.shields.io/badge/Next.js-13+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Prisma](https://img.shields.io/badge/Prisma-4.0+-2D3748)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38B2AC)

## ✨ Features

- 🎨 Modern and responsive design with dark mode support
- 📱 Mobile-first approach
- 🔒 Secure authentication with NextAuth.js
- 📝 Rich text editor for writing articles
- 🏷️ Tag-based article organization
- 💬 Interactive comment system
- 👍 Article reactions (claps)
- 🔍 Full-text search capabilities
- 📊 User dashboard for article management
- 🌐 SEO optimized
- ⚡ Server-side rendering for optimal performance

## 🚀 Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/medium-clone.git
cd medium-clone
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables in the `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/medium_clone"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_ID="your-github-oauth-id"
GITHUB_SECRET="your-github-oauth-secret"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` to see your application running.

## 🏗️ Tech Stack

- **Framework**: [Next.js 13+](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: Custom components with modern design
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Date Formatting**: [date-fns](https://date-fns.org/)

## 📁 Project Structure

```
medium-clone/
├── app/                    # Next.js 13 app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── write/             # Article editor
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── styles/               # Global styles
```

## 🔑 Key Features Explained

### Authentication
- Secure user authentication using NextAuth.js
- Support for multiple providers (GitHub, Google, etc.)
- Protected routes and API endpoints

### Article Management
- Create, edit, and delete articles
- Rich text editor with markdown support
- Cover image upload
- Tag management
- Draft and published states

### User Dashboard
- Overview of user's articles
- Article statistics
- Draft management
- Profile settings

### Interactive Features
- Comment system with real-time updates
- Article reactions (claps)
- User profiles
- Follow system

## 🎨 Design Philosophy

The application follows these key design principles:
- Clean and minimal interface
- Consistent spacing and typography
- Smooth animations and transitions
- Dark mode support
- Responsive design for all devices

## 🛠️ Development

### Running Tests
```bash
npm run test
# or
yarn test
```

### Building for Production
```bash
npm run build
# or
yarn build
```

### Linting
```bash
npm run lint
# or
yarn lint
```

## 📦 Deployment

The application can be deployed to various platforms:

- [Vercel](https://vercel.com/) (Recommended)
- [Railway](https://railway.app/)
- [Heroku](https://heroku.com/)
- Any platform supporting Next.js

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
