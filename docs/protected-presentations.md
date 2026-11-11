# Publishing protected workshop presentations

The public GitHub repository must contain only encrypted presentation files. Plain PDFs belong in the ignored local folder `private-presentations/` and must never be committed.

## Source filenames

Place all seven talk PDFs in `private-presentations/` using these names:

- `anastasia-borovykh.pdf`
- `orderflowdit.pdf`
- `beyond-supra-competitive-outcomes.pdf`
- `herding-or-racing.pdf`
- `same-exposure-different-clocks.pdf`
- `chat2lob.pdf`
- `when-proofs-are-abundant.pdf`

Then run `npm run encrypt:presentations` from the project root. The command asks for a password without echoing it, requires a 20 character minimum, and writes the encrypted outputs to `public/presentations/encrypted/`. It uses AES-256-GCM with PBKDF2-SHA-256 and 600,000 iterations. Each run encrypts the files as one set with a shared salt and distinct random nonces.

Commit only the generated `.pdf.enc` files. The browser asks for the password once, decrypts the selected presentation locally, and stores a non-extractable derived key in IndexedDB for that browser profile. The password itself is neither stored nor sent to GitHub. Clearing the browser's site data or using another browser/device requires entering it again.

Anyone who obtains both the encrypted files and the password can decrypt them. Use a strong password and distribute it to workshop participants through a separate channel.
