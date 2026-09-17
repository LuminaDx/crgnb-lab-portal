# CR-GNB laboratory access portal — development concept

Unofficial mock-up of a **no-charge kit portal** for Australian hospital / NATA labs.  
Styled after Link Healthcare / Clinigen (dark teal + lime).  
Does **not** name a medicine. Describes infections and the two laboratory tests only.

This is **not** an official Link or Clinigen site. Do not put live patient or customer data in it.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Infections (cUTI, HABP/VABP, last-line Gram-negatives) |
| `labs.html` | Pack contents and what each line does |
| `register.html` | Lab requests an account → status `pending` |
| `login.html` | Sign-in; pending accounts cannot order |
| `order.html` | Quantity form for approved labs |
| `admin.html` | Supplier approves / declines accounts and sees orders |

## Demo accounts (this build)

- Lab (already approved): `Test@lab.demo` / `Testlab2026`
- Reviewer: `Dsmit@PharmaCommercialConsulting.com` / `Approve2026`

Auth and orders live in **browser localStorage** so the demo runs on GitHub Pages with no server. That is fine for a pitch. It is **not** fine for production.

## Get it on the internet (fastest path)

### 1. GitHub Pages

```bash
cd crgnb-lab-portal
git init
git add .
git commit -m "CR-GNB lab portal mock"
gh repo create crgnb-lab-portal --public --source=. --remote=origin --push
```

GitHub → Settings → Pages → Deploy from branch `main` / root.  
Site URL: `https://<you>.github.io/crgnb-lab-portal/`

If the repo is a project site (not user site), links are already relative (`css/styles.css`) so they work.

### 2. Email of registrations and orders (same pattern as a quote form)

1. Create a free form at [formspree.io](https://formspree.io).
2. Point it at the operations mailbox you want (e.g. the Link AU medical or supply inbox — **not** a personal Gmail long term).
3. Replace `REPLACE_ME` in `register.html` and `order.html`:

```html
window.FORMSPREE_ENDPOINT = "https://formspree.io/f/xxxxxxxx";
```

Until that ID is set, the demo still stores requests locally and the reviewer can approve them on `admin.html`.

Netlify Forms is an alternative: add `netlify` to the `<form>` tags and host on Netlify instead of Pages.

### 3. Custom domain later

`labaccess.linkhealthcare.com.au` (example) → CNAME to `youruser.github.io`. Needs Link/Clinigen IT and a certificate. Do not do this until they own the build.

## What this demo is missing (needed before a real launch)

| Need | Suggested app |
|---|---|
| Real user database + password reset | Firebase Auth, Auth0, or Clerk |
| Approval workflow with audit | Firebase + a small Cloud Function, or a private Notion/Airtable + Make.com |
| Email “your account is approved” | Formspree + Zapier, or Resend / Postmark |
| Stock / lot / expiry | Airtable or Xero inventory — not this site |
| ARTG / privacy / TGA advertising | Legal review. This page is educational + B2B supply, still needs their counsel |
| Official logo files | Request SVG from Clinigen brand team; current wordmark is a reconstruction |

## How to show it in a meeting

Open `index.html` locally, or run:

```bash
cd crgnb-lab-portal
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

Walk: Home → For laboratories → Register → (switch to admin login) Approve → Log in as lab → Order.

## Brand notes used

From Link AU and Clinigen global sites (Sep 2026): dark teal header/footer, lime capsule buttons, white LINK wordmark with “A CLINIGEN COMPANY” in green, photography-style dark hero. Cookie banners and photography were not copied.
