# Upload Not Working? Diagnostic Guide

## Issue: "Drop files or click / Any file type, encrypted end-to-end" doesn't respond to uploads

### Root Cause
The upload card is **disabled until you connect a wallet**. This is by design for wallet-based identity and key management.

### How to Fix (Step-by-Step)

1. **Start the dev server**
   ```bash
   pnpm dev
   ```

2. **Open http://localhost:3000 in your browser**

3. **Connect a wallet FIRST**
   - Look for the "Connect Wallet" button in the header (top right)
   - Click it
   - Select any wallet provider from the modal (MetaMask, Phantom, etc.)
   - The app will mock-connect and generate a local wallet address
   - You should see the wallet address displayed in the header

4. **Now upload files**
   - Once wallet is connected, the upload card becomes active
   - Drag files onto the card, OR click to open file picker
   - Files will encrypt client-side and upload
   - You'll see "Uploading..." spinner, then "Upload successful" toast

### If Upload Still Fails

**Check browser Console (F12 → Console tab) for error messages:**

1. **"WALLET_NOT_CONNECTED"** 
   → You forgot to connect wallet. See step 3 above.

2. **"READ_FAIL"**
   → File read error. Try a smaller file or different file format.

3. **Crypto error (Web Crypto unavailable)**
   → Use https:// or localhost (not http://). Web Crypto requires secure context.

4. **"MISSING_DECRYPTION_KEY"**
   → Key wasn't saved to browser storage. Check that localStorage is enabled.

### Verify localStorage is Enabled

Run this in browser console:
```javascript
localStorage.setItem("test", "1")
console.log(localStorage.getItem("test"))
localStorage.removeItem("test")
```

Should print `"1"`. If not, enable localStorage in browser privacy settings.

### Test Workflow (Step-by-Step)

1. **Connect wallet** → see address in header
2. **Upload a file** → see "Uploading...", then success toast
3. **See file in grid** → file card shows with "Encrypted" and "Verified" badges
4. **Download file** → click download button, file decrypts and downloads
5. **Generate secure link** → click share button, set expiry (hours) and max views (count), then "Generate Secure Link"
6. **Copy and test link** → click copy button, then paste URL in private window/new browser
7. **Opening secure link** → file auto-decrypts and downloads; link becomes invalid after 1 view

### Common Mistakes

| Mistake | Solution |
|---------|----------|
| Upload card is grayed out | Connect wallet first |
| Upload button doesn't respond to clicks | Disable adblock/extensions, clear browser cache |
| File uploads but disappears | Check browser storage quota is not full |
| Secure link doesn't work | Make sure URL includes `?share=...#k=...` |
| Link downloads wrong file | Clear browser storage and try fresh upload |

### Still Stuck?

1. Check TypeScript compile:
   ```bash
   pnpm exec tsc --noEmit
   ```

2. Check for JavaScript errors in browser console (F12)

3. Verify NextJS is running on correct port (default 3000):
   ```bash
   lsof -i :3000
   ```

4. Clear app data and start fresh:
   ```bash
   # Clear localStorage and reload
   # In browser console: localStorage.clear(); location.reload()
   ```

---

**TL;DR**: Click "Connect Wallet" first, then you can upload. Upload card is disabled until wallet is connected by design.
