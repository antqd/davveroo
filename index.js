// CommonJS compat + niente optional chaining
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

// ---------- CORS ----------
app.use(
  cors({
    origin: function (_origin, cb) {
      cb(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
  })
);
app.use(express.json());

// ---------- MySQL ----------
const pool = mysql.createPool({
  host: "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: "MP308075-EURO",
  password: "Expo2025@@@",
  database: "davveroo",
  waitForConnections: true,
  connectionLimit: 10,
});

async function query(sql, params) {
  if (!params) params = [];
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function getMonthYYYYMM(d) {
  const dd = d || new Date();
  const y = dd.getFullYear();
  const m = String(dd.getMonth() + 1).padStart(2, "0");
  return y + "-" + m;
}

// ---------- JWT helpers ----------
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function parseBearer(req) {
  const h =
    req.headers && req.headers.authorization
      ? String(req.headers.authorization)
      : "";
  if (!h) return null;
  const parts = h.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

function parseRoles(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  const s = String(val);
  if (!s) return [];
  return s
    .split(",")
    .map(function (r) {
      return r.trim();
    })
    .filter(Boolean);
}

function userRowToJson(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    roles: parseRoles(r.roles),
  };
}

// ---------- Auth middlewares ----------
async function requireAuth(req, res, next) {
  try {
    const token = parseBearer(req);
    if (!token)
      return res.status(401).json({ ok: false, error: "unauthorized" });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
    };
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
}

function requireRoles(allowed) {
  return function (req, res, next) {
    if (!req.user || !Array.isArray(req.user.roles)) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    for (var i = 0; i < allowed.length; i++) {
      if (req.user.roles.indexOf(allowed[i]) >= 0) return next();
    }
    return res.status(403).json({ ok: false, error: "forbidden" });
  };
}

// ---------- Health ----------
app.get(["/health/ping", "/api/health/ping"], function (_req, res) {
  res.json({ ok: true, ping: "pong" });
});
app.get(["/health/db", "/api/health/db"], async function (_req, res) {
  try {
    const [row] = await query("SELECT 1 AS ok");
    res.json({ ok: true, db: row });
  } catch (e) {
    res
      .status(500)
      .json({ ok: false, code: e.code || "db_error", message: e.message });
  }
});

// ---------- Auth ----------
const ALLOWED_ROLES = ["customer", "seller", "admin"];

app.post("/api/auth/register", async function (req, res) {
  try {
    const b = req.body || {};
    const name = (b.name || "").trim();
    const email = (b.email || "").trim().toLowerCase();
    const password = b.password || "";
    var roles = Array.isArray(b.roles) ? b.roles : [];

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "name_email_password_required" });
    }
    roles = roles.filter(function (r) {
      return ALLOWED_ROLES.indexOf(r) >= 0;
    });
    if (!roles.length) roles = ["customer"];

    const existing = await query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing && existing.length) {
      return res.status(409).json({ ok: false, error: "email_exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const rolesSet = roles.join(","); // MySQL SET accetta stringa comma-separated
    const ins = await query(
      "INSERT INTO users (name, email, password_hash, roles) VALUES (?,?,?,?)",
      [name, email, hash, rolesSet]
    );
    const [row] = await query(
      "SELECT id, name, email, roles FROM users WHERE id = ?",
      [ins.insertId]
    );
    const user = userRowToJson(row);
    const token = signToken({ sub: user.id, roles: user.roles });
    res.json({ ok: true, token: token, user: user });
  } catch (e) {
    res
      .status(500)
      .json({ ok: false, error: "server_error", message: e.message });
  }
});

app.post("/api/auth/login", async function (req, res) {
  try {
    const b = req.body || {};
    const email = (b.email || "").trim().toLowerCase();
    const password = b.password || "";
    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "email_password_required" });
    }
    const rows = await query(
      "SELECT id, name, email, roles, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!rows || !rows.length) {
      return res.status(401).json({ ok: false, error: "invalid_credentials" });
    }
    const u = rows[0];
    const ok = u.password_hash
      ? await bcrypt.compare(password, u.password_hash)
      : false;
    if (!ok) {
      return res.status(401).json({ ok: false, error: "invalid_credentials" });
    }
    const user = userRowToJson(u);
    const token = signToken({ sub: user.id, roles: user.roles });
    res.json({ ok: true, token: token, user: user });
  } catch (e) {
    res
      .status(500)
      .json({ ok: false, error: "server_error", message: e.message });
  }
});

app.get("/api/me", requireAuth, async function (req, res) {
  try {
    const [row] = await query(
      "SELECT id, name, email, roles FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );
    if (!row) return res.status(404).json({ ok: false, error: "not_found" });
    res.json({ ok: true, user: userRowToJson(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ---------- Liste di supporto (lasciate aperte) ----------
app.get("/api/agents", async (_req, res) => {
  try {
    const rows = await query(
      "SELECT id, display_name FROM agents ORDER BY id ASC"
    );
    res.json({ ok: true, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: "server_error" });
  }
});
app.get("/api/products", async (_req, res) => {
  try {
    const rows = await query(
      "SELECT id, name FROM products WHERE is_active IS NULL OR is_active=1 ORDER BY name"
    );
    res.json({ ok: true, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: "server_error" });
  }
});
app.get("/api/customers", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    var rows;
    if (q) {
      rows = await query(
        "SELECT id, full_name FROM customers WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY created_at DESC LIMIT 50",
        ["%" + q + "%", "%" + q + "%", "%" + q + "%"]
      );
    } else {
      rows = await query(
        "SELECT id, full_name FROM customers ORDER BY created_at DESC LIMIT 50"
      );
    }
    res.json({ ok: true, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ---------- Core ----------
app.post(
  "/api/customers",
  requireAuth,
  requireRoles(["seller", "admin"]),
  async function (req, res) {
    const conn = await pool.getConnection();
    try {
      const b = req.body || {};
      const full_name = b.full_name;
      const email = b.email || null;
      const phone = b.phone || null;
      var agent_id = b.agent_id || null;
      var registered_by_customer_id = b.registered_by_customer_id || null;

      if (!full_name) {
        conn.release();
        return res.status(400).json({ ok: false, error: "full_name required" });
      }

      if (agent_id != null) {
        const aid = Number(agent_id);
        if (!Number.isInteger(aid)) {
          conn.release();
          return res.status(400).json({ ok: false, error: "invalid agent_id" });
        }
        const a = await query("SELECT id FROM agents WHERE id = ?", [aid]);
        if (!a.length) {
          conn.release();
          return res.status(400).json({ ok: false, error: "agent_not_found" });
        }
        agent_id = aid;
      }

      var referrerAgentId = null;
      if (registered_by_customer_id != null) {
        const rid = Number(registered_by_customer_id);
        if (!Number.isInteger(rid)) {
          conn.release();
          return res
            .status(400)
            .json({ ok: false, error: "invalid registered_by_customer_id" });
        }
        const r = await query(
          "SELECT id, agent_id FROM customers WHERE id = ?",
          [rid]
        );
        if (!r.length) {
          conn.release();
          return res
            .status(400)
            .json({ ok: false, error: "registered_by_customer_not_found" });
        }
        registered_by_customer_id = rid;
        referrerAgentId = r[0].agent_id || null;
        if (agent_id == null) agent_id = referrerAgentId;
      }

      await conn.beginTransaction();

      const [ins] = await conn.execute(
        "INSERT INTO customers (full_name, email, phone, agent_id, registered_by_customer_id) VALUES (?,?,?,?,?)",
        [full_name, email, phone, agent_id, registered_by_customer_id]
      );
      const newCustomerId = ins.insertId;

      if (registered_by_customer_id != null) {
        const [exists] = await conn.execute(
          "SELECT id FROM referrals WHERE referred_customer_id = ? LIMIT 1",
          [newCustomerId]
        );
        if (!exists.length) {
          await conn.execute(
            "INSERT INTO referrals (referrer_customer_id, referred_customer_id, agent_id, promised_credit_cents, status) VALUES (?,?,?,?,'pending')",
            [registered_by_customer_id, newCustomerId, agent_id, 10000]
          );
        }
      }

      await conn.commit();
      res.json({ ok: true, id: newCustomerId });
    } catch (e) {
      try {
        await conn.rollback();
      } catch (_) {}
      res
        .status(500)
        .json({
          ok: false,
          error: e.code || "server_error",
          message: e.message,
        });
    } finally {
      conn.release();
    }
  }
);

app.post("/api/referrals", requireAuth, async function (req, res) {
  const conn = await pool.getConnection();
  try {
    const b = req.body || {};
    const referrer_customer_id = b.referrer_customer_id;
    const friend_full_name = b.friend_full_name;
    const friend_email = b.friend_email;
    const agent_id = b.agent_id;

    if (!referrer_customer_id || !friend_full_name) {
      conn.release();
      return res.status(400).json({
        ok: false,
        error: "referrer_customer_id & friend_full_name required",
      });
    }

    await conn.beginTransaction();

    const [refRows] = await conn.execute(
      "SELECT agent_id FROM customers WHERE id = ?",
      [referrer_customer_id]
    );
    const defaultAgentId =
      refRows && refRows[0] && refRows[0].agent_id ? refRows[0].agent_id : null;

    const [insCustomer] = await conn.execute(
      "INSERT INTO customers (full_name, email, status, agent_id, registered_by_customer_id) VALUES (?, ?, 'prospect', ?, ?)",
      [
        friend_full_name,
        friend_email || null,
        agent_id || defaultAgentId,
        referrer_customer_id,
      ]
    );
    const friendId = insCustomer.insertId;

    const [insRef] = await conn.execute(
      "INSERT INTO referrals (referrer_customer_id, referred_customer_id, agent_id, promised_credit_cents, status) VALUES (?, ?, ?, 10000, 'pending')",
      [referrer_customer_id, friendId, agent_id || defaultAgentId]
    );

    await conn.commit();
    res.json({
      ok: true,
      referral_id: insRef.insertId,
      friend_customer_id: friendId,
    });
  } catch (e) {
    try {
      await conn.rollback();
    } catch (_) {}
    res.status(500).json({ ok: false, error: "server_error" });
  } finally {
    conn.release();
  }
});

app.post(
  "/api/purchases",
  requireAuth,
  requireRoles(["seller", "admin"]),
  async function (req, res) {
    const conn = await pool.getConnection();
    try {
      const b = req.body || {};
      const customer_id = b.customer_id;
      const product_id = b.product_id;
      const status = b.status || "pending";
      const amount = b.amount;
      const purchased_at = b.purchased_at;

      if (!customer_id || !product_id) {
        conn.release();
        return res
          .status(400)
          .json({ ok: false, error: "customer_id & product_id required" });
      }

      await conn.beginTransaction();

      const [ins] = await conn.execute(
        "INSERT INTO purchases (customer_id, product_id, status, amount, purchased_at) VALUES (?, ?, ?, ?, ?)",
        [customer_id, product_id, status, amount || null, purchased_at || null]
      );

      if (status === "active") {
        const [rows] = await conn.execute(
          "SELECT id FROM referrals WHERE referred_customer_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1",
          [customer_id]
        );
        if (rows && rows.length > 0) {
          const referralId = rows[0].id;
          await conn.execute(
            "UPDATE referrals SET status = 'unlocked', unlock_purchase_id = ?, unlocked_at = NOW() WHERE id = ?",
            [ins.insertId, referralId]
          );
        }
        await conn.execute(
          "UPDATE customers SET status = 'active' WHERE id = ?",
          [customer_id]
        );
      }

      await conn.commit();
      res.json({ ok: true, id: ins.insertId });
    } catch (e) {
      try {
        await conn.rollback();
      } catch (_) {}
      res.status(500).json({ ok: false, error: "server_error" });
    } finally {
      conn.release();
    }
  }
);

// ===== TOP SELLERS =====
const ADMIN_TOKEN = "Expo2026@@";

// GET corrente (mese YYYY-MM) — pubblico
app.get("/api/top-sellers", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, agent_id, agent_name AS label, value, month_key AS month \
       FROM top_sellers \
       WHERE month_key = DATE_FORMAT(CURDATE(), '%Y-%m') \
       ORDER BY value DESC"
    );
    res.json({ ok: true, items: rows });
  } catch (e) {
    console.error("TOP SELLERS GET ERROR:", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// POST set (protetto: x-admin-token O admin JWT)
app.post("/api/top-sellers", async (req, res) => {
  try {
    var okAdmin = false;

    // 1) Token statico header o query
    var tokenHeader =
      req.headers && req.headers["x-admin-token"]
        ? String(req.headers["x-admin-token"])
        : "";
    var tokenQuery =
      req.query && req.query.token ? String(req.query.token) : "";
    var staticToken = (tokenHeader || tokenQuery).trim();
    if (staticToken && staticToken === ADMIN_TOKEN) okAdmin = true;

    // 2) Oppure JWT con ruolo admin
    if (!okAdmin) {
      try {
        const bearer = parseBearer(req);
        if (bearer) {
          const payload = jwt.verify(bearer, JWT_SECRET);
          const roles = Array.isArray(payload.roles) ? payload.roles : [];
          if (roles.indexOf("admin") >= 0) okAdmin = true;
        }
      } catch (_e) {}
    }

    if (!okAdmin)
      return res.status(401).json({ ok: false, error: "unauthorized" });

    const body = req.body || {};
    var items = Array.isArray(body.items) ? body.items : [];
    const month_key = (
      body.month_key || new Date().toISOString().slice(0, 7)
    ).slice(0, 7);

    const cleaned = [];
    for (var i = 0; i < items.length; i++) {
      const it = items[i] || {};
      const name = (
        it.label ? String(it.label) : it.agent_name ? String(it.agent_name) : ""
      ).trim();
      const val = Number(it.value || 0);
      const aid =
        it.agent_id !== undefined && it.agent_id !== null && it.agent_id !== ""
          ? Number(it.agent_id)
          : null;
      if (name && isFinite(val))
        cleaned.push({ agent_id: aid, agent_name: name, value: val });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute("DELETE FROM top_sellers WHERE month_key = ?", [
        month_key,
      ]);
      for (var j = 0; j < cleaned.length; j++) {
        const it2 = cleaned[j];
        await conn.execute(
          "INSERT INTO top_sellers (month_key, agent_id, agent_name, value) VALUES (?,?,?,?)",
          [month_key, it2.agent_id, it2.agent_name, it2.value]
        );
      }
      await conn.commit();
    } catch (err) {
      try {
        await conn.rollback();
      } catch (_) {}
      throw err;
    } finally {
      conn.release();
    }

    res.json({ ok: true, month_key: month_key, saved: cleaned.length });
  } catch (e) {
    console.error("TOP SELLERS POST ERROR:", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ---------- Dashboard ----------
app.get(
  "/api/dashboard",
  requireAuth,
  requireRoles(["seller", "admin"]),
  async function (_req, res) {
    try {
      const rows = await query(
        "SELECT c.id, c.full_name AS cliente, " +
          "       rb.full_name AS registrato_da, " +
          "       a.display_name AS agente_in_carica, " +
          "       (SELECT GROUP_CONCAT(DISTINCT p2.name ORDER BY p2.name SEPARATOR ', ') " +
          "          FROM purchases pu2 " +
          "          JOIN products p2 ON p2.id = pu2.product_id " +
          "         WHERE pu2.customer_id = c.id AND pu2.status='active') AS prodotti_acquistati, " +
          "       (SELECT COUNT(*) FROM referrals r WHERE r.referrer_customer_id = c.id) AS amici_aggiunti, " +
          "       ROUND((SELECT IFNULL(SUM(r.promised_credit_cents),0) FROM referrals r WHERE r.referrer_customer_id = c.id AND r.status='unlocked')/100, 2) AS credito " +
          "FROM customers c " +
          "LEFT JOIN customers rb ON rb.id = c.registered_by_customer_id " +
          "LEFT JOIN agents a ON a.id = c.agent_id " +
          "ORDER BY c.created_at DESC LIMIT 200"
      );
      res.json({ ok: true, items: rows });
    } catch (e) {
      res
        .status(500)
        .json({
          ok: false,
          error: e.code || "server_error",
          message: e.message,
        });
    }
  }
);

// ---------- Credito e referrals ----------
app.get("/api/customers/:id/credit", requireAuth, async function (req, res) {
  try {
    const id = req.params.id;
    const [sumUnlocked] = await query(
      "SELECT IFNULL(SUM(promised_credit_cents),0) AS cents FROM referrals WHERE referrer_customer_id = ? AND status='unlocked'",
      [id]
    );
    const [sumRedeemed] = await query(
      "SELECT IFNULL(SUM(amount_cents),0) AS cents FROM redemptions WHERE referral_id IN (SELECT id FROM referrals WHERE referrer_customer_id = ?)",
      [id]
    );
    const u = sumUnlocked && sumUnlocked.cents ? sumUnlocked.cents : 0;
    const r = sumRedeemed && sumRedeemed.cents ? sumRedeemed.cents : 0;
    res.json({ ok: true, credit_eur: Math.round(u - r) / 100 });
  } catch (e) {
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.get("/api/customers/:id/referrals", requireAuth, async function (req, res) {
  try {
    const id = req.params.id;
    const rows = await query(
      "SELECT r.id, r.status, r.promised_credit_cents, c.full_name AS amico, r.created_at, r.unlocked_at, r.redeemed_at " +
        "FROM referrals r LEFT JOIN customers c ON c.id = r.referred_customer_id " +
        "WHERE r.referrer_customer_id = ? ORDER BY r.id DESC LIMIT 100",
      [id]
    );
    res.json({ ok: true, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ---------- Start ----------
const port = Number(process.env.PORT || 8080);
app.listen(port, function () {
  console.log("API listening on :" + port);
});
