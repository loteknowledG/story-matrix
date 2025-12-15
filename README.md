# Story Matrix

A clean, fast photo gallery that supports drag-and-drop from your computer or the web.

## Troubleshooting Git Push

If you are seeing errors when pushing to GitHub (like "file too large" or timeouts), it is likely because `node_modules` was accidentally tracked.

Run these commands in your terminal to fix it:

```bash
# 1. Untrack the node_modules folder (keeps files locally, removes from git)
git rm -r --cached node_modules

# 2. Add the .gitignore file changes
git add .

# 3. Commit the fix
git commit -m "Fix: remove node_modules from git"

# 4. Push again
git push
```

## How to Deploy to GitHub Pages

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Deploy**
   ```bash
   npm run deploy
   ```

This will build the project and push the `dist` folder to a `gh-pages` branch on your repository.

## Development

To run locally:
```bash
npm run dev
```
