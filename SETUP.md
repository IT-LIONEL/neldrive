# NelTech - Setup Guide

Welcome to NelTech! This guide will help you get started with your cloud storage application.

## 🚀 Features

- **User Authentication**: Secure email/password login and signup
- **File Management**: Upload, download, delete, and organize files
- **Folder Organization**: Create, rename, delete, and navigate folders
- **File Preview**: View images, videos, PDFs, and text files
- **Search**: Quickly find files and folders by name
- **Drag & Drop**: Easy file uploading with drag-and-drop support
- **Shareable Links**: Generate secure links to share files
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 📋 Prerequisites

- Node.js 18+ and npm installed ([Download here](https://nodejs.org/))
- A Lovable account (for Cloud backend)

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd neltech
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

The `.env` file is already configured with your Lovable Cloud credentials:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_URL="your-supabase-url"
```

These are automatically set up when you enable Lovable Cloud.

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### 5. Build for Production

```bash
npm run build
```

The production build will be created in the `dist` folder.

## 🌐 Deployment

### Deploy via Lovable

1. Open your project in [Lovable](https://lovable.dev)
2. Click the **Publish** button in the top right
3. Your app will be deployed automatically
4. You'll receive a live URL to share

### Deploy to Other Platforms

#### Vercel

```bash
npm install -g vercel
vercel
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Make sure to set the build command to `npm run build` and the publish directory to `dist`.

## 🔧 Project Structure

```
neltech/
├── src/
│   ├── components/
│   │   ├── dashboard/      # Dashboard components
│   │   └── ui/             # UI components (shadcn)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Supabase integration
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   │   ├── Index.tsx       # Landing page
│   │   ├── Auth.tsx        # Authentication
│   │   └── Dashboard.tsx   # Main dashboard
│   └── index.css           # Global styles
├── supabase/               # Database migrations
└── public/                 # Static assets
```

## 🎨 Customization

### Design System

The design system is configured in:
- `src/index.css` - CSS variables and theme colors
- `tailwind.config.ts` - Tailwind configuration

### Branding

To customize branding:
1. Update the app name in `src/pages/Index.tsx` and `src/components/dashboard/DashboardHeader.tsx`
2. Change colors in `src/index.css` by modifying HSL values
3. Update the `<title>` and meta tags in `index.html`

## 🗄️ Database Schema

### Tables

#### `folders`
- `id` - UUID (Primary Key)
- `name` - Folder name
- `parent_id` - Parent folder reference
- `user_id` - Owner user reference
- `created_at` - Timestamp
- `updated_at` - Timestamp

#### `files`
- `id` - UUID (Primary Key)
- `name` - File name
- `folder_id` - Folder reference
- `user_id` - Owner user reference
- `storage_path` - Storage location
- `file_type` - MIME type
- `file_size` - Size in bytes
- `is_shareable` - Sharing status
- `shareable_token` - Share link token
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Storage Buckets

- `user-files` - Stores all uploaded files (private)
  - Max file size: 50MB
  - User-specific folders: `{user_id}/{timestamp}.{extension}`

## 🔐 Security

- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only access their own files and folders
- **Secure Authentication**: Powered by Lovable Cloud
- **Private Storage**: Files are stored in user-specific directories

## 📱 Usage

### First Time Setup

1. Navigate to the landing page
2. Click "Get Started Free"
3. Sign up with your email and password
4. You'll be redirected to your dashboard

### Uploading Files

1. Drag and drop files onto the upload zone, or
2. Click the upload zone to browse files
3. Files will be uploaded to the current folder

### Managing Folders

1. Click "New Folder" in the sidebar
2. Enter a folder name
3. Click folders to navigate into them
4. Use the actions menu to delete folders

### Sharing Files

1. Click the ⋮ menu on any file
2. Select "Enable Sharing"
3. A shareable link will be copied to your clipboard

### Search

Use the search bar in the header to find files and folders by name.

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Authentication Issues

- Email confirmation is disabled for testing
- Check that Lovable Cloud is properly configured
- Verify `.env` file has correct credentials

### File Upload Issues

- Max file size is 50MB
- Ensure you're logged in
- Check browser console for errors

## 📚 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **Storage**: Lovable Cloud Storage
- **Authentication**: Lovable Cloud Auth
- **Build Tool**: Vite
- **Icons**: Lucide React

## 🤝 Contributing

This project was built with [Lovable](https://lovable.dev). To make changes:

1. Open the project in Lovable
2. Use natural language to request changes
3. Changes are committed automatically to your repository

## 📄 License

This project is open source and available under the MIT License.

## 💬 Support

For questions or issues:
- Check the [Lovable Documentation](https://docs.lovable.dev)
- Visit the [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)

---

Built with ❤️ using [Lovable](https://lovable.dev)
