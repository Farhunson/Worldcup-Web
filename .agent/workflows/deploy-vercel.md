---
description: How to deploy the World Cup Scoreboard to Vercel
---

# Deploying to Vercel

Since this is a static website (HTML, CSS, and Vanilla JavaScript), deploying to Vercel is extremely simple and fast.

## Option 1: Using the Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   - Initialize a local Git repository: `git init`
   - Add your files: `git add .`
   - Commit: `git commit -m "Initial commit"`
   - Create a new repository on [GitHub](https://github.com/new).
   - Follow the instructions on GitHub to push your local repository to the remote one.

2. **Connect to Vercel:**
   - Go to [Vercel](https://vercel.com/new).
   - Sign in with your GitHub account.
   - You should see your repository in the list. Click **Import**.
   - Vercel will automatically detect that it's a static site. No need to change any build settings.
   - Click **Deploy**.

## Option 2: Using the Vercel CLI (Fastest)

If you have Node.js installed, you can deploy directly from your terminal:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   - Run the following command in your project's root directory:
     ```bash
     vercel
     ```
   - Follow the prompts to log in and set up your project.
   - Once the preview deployment is finished, run:
     ```bash
     vercel --prod
     ```
   - Your site will be live at a custom `.vercel.app` URL!

## Important Notes

- **Assets:** Ensure that all files in the `assets/` folder (images, fonts, videos) are correctly committed to your repository.
- **Base Path:** Since everything is at the root, you don't need to configure any base paths or output directories. Vercel serves `index.html` by default.
