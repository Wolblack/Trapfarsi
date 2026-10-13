# Updating TRAPFARSI on GitHub

This guide is for updating the project after you change code on your Mac.

## One-time setup

1. Install Git if it is not already installed: `git --version`.
2. Download the TRAPFARSI v1.3 project ZIP from the ChatGPT conversation and extract it.
3. Open Terminal and move into the extracted project folder (the folder containing `index.html` and `package.json`).
4. Clone your GitHub repository in a separate folder:

   ```bash
   git clone https://github.com/amiralisetareh/Trapfarsi.git
   ```

5. Copy the extracted project files into the cloned `Trapfarsi` folder, replacing files with the same names. Keep the `.git` folder in the cloned repository. Do not copy the extracted `TRAPFARSI` folder as a nested folder; copy its contents into the repository root.

6. In Terminal, enter the repository and check the changes:

   ```bash
   cd Trapfarsi
   git status
   ```

## Every time you change something

After editing and saving your code:

1. Open Terminal in the repository folder.
2. Check what changed:

   ```bash
   git status
   git diff
   ```

3. Run the project's checks:

   ```bash
   npm test
   npm run check
   ```

   If you changed only documentation and the repository has no test script yet, inspect `package.json` and use the checks it defines.

4. Stage the changes. Use `git add -A` to include all intended changes, or add specific paths instead:

   ```bash
   git add index.html phase12.js phase12.css
   ```

   Review exactly what will be committed:

   ```bash
   git diff --cached
   git status
   ```

5. Save a commit with a short description:

   ```bash
   git commit -m "Improve lyric search and player"
   ```

6. Upload the commit to GitHub:

   ```bash
   git push origin main
   ```

   If you are working on a branch, push that branch instead, for example `git push -u origin my-feature-branch`.

## Recommended workflow for bigger changes

Create a branch first:

```bash
git switch -c feature/describe-your-change
```

Make the change, run tests, then commit and push:

```bash
npm test
npm run check
git add -A
git diff --cached
git commit -m "Describe the change"
git push -u origin feature/describe-your-change
```

Then open the repository on GitHub and create a Pull Request to merge your branch into `main`. This lets you review changes before they become the main version.

## Important safety rules

- Never commit passwords, API secrets, Supabase service-role keys, private tokens, or a real `.env` file.
- Put provider secrets in your hosting provider or Supabase Edge Function secrets, not in browser JavaScript.
- Check `git status` and `git diff --cached` before every commit.
- A successful `git push` uploads code to GitHub; it does not automatically deploy the website unless deployment is configured.
- If Git reports a conflict or rejects a push, stop and inspect the message rather than force-pushing.
