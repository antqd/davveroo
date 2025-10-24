# 🚀 Davveroo

> **Davveroo** è una piattaforma web/app che permette alle attività commerciali di creare e gestire sistemi di **fidelizzazione e referral** per i propri clienti.  
> Ogni attività ottiene una **dashboard personalizzata** da cui può:
> - creare programmi a punti,
> - gestire premi e affiliazioni,
> - monitorare l’andamento dei clienti,
> - aumentare la retention e il passaparola digitale.

---

## 🧩 Obiettivo del progetto
Costruire un MVP solido e scalabile che consenta:
- Registrazione attività (Business)
- Registrazione clienti (User)
- Sistema di referral (inviti e crediti)
- Dashboard per attività e utenti
- Gestione premi, punti e statistiche

---

## 🧠 Stack Tecnico
| Livello | Tecnologie |
|----------|-------------|
| **Frontend** | Next.js 14 (App Router), TailwindCSS, shadcn/ui |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | Supabase Postgres |
| **Auth** | Supabase Auth / Clerk (da decidere in MVP) |
| **Deploy** | Vercel |
| **Versioning** | GitHub |
| **Docs** | Markdown (`/docs` folder) |

---

## 🧱 Struttura MVP
1. **Dashboard Attività**
   - Crea premi, gestisci clienti, controlla statistiche.
2. **App Cliente**
   - Visualizza punti, premi, inviti.
3. **Referral Tracking**
   - Link univoco per ogni cliente.
4. **Gestione punti**
   - Assegna punti manualmente o tramite transazioni future.
5. **Landing Page Pubblica**
   - Presentazione di Davveroo + form di registrazione.

---

## ⚙️ Setup Locale

```bash
# 1. Clona la repo
git clone https://github.com/<username>/davveroo.git

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env.local

# 4. Esegui il server di sviluppo
npm run dev
