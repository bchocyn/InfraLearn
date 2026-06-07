export default {
  "sec-cia-triad": {
    "sections": [
      {
        "heading": "The only three things you protect",
        "body": [
          {
            "type": "p",
            "text": "**Every security control on Earth defends one of three properties:** Confidentiality (the right people see it), Integrity (it hasn't been tampered with), Availability (it's there when needed). That's the CIA triad — and if a proposed control doesn't map to one of those three, you're protecting nothing."
          },
          {
            "type": "p",
            "text": "**Security is a property of the whole system, not a feature you bolt on.** A perfectly encrypted database behind a login form with `admin/admin` is not secure. Every layer must hold, or none of them do."
          }
        ]
      },
      {
        "heading": "STRIDE in 30 seconds",
        "body": [
          {
            "type": "p",
            "text": "**STRIDE is Microsoft's threat-model checklist** — six attack categories you walk through for every component. Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. Use it as a forcing function: for every box on your architecture diagram, ask which of the six it's vulnerable to."
          },
          {
            "type": "table",
            "headers": [
              "Threat",
              "Breaks which CIA leg",
              "Real-world example"
            ],
            "rows": [
              ["Spoofing", "Confidentiality", "SIM-swap → reset victim's Gmail"],
              ["Tampering", "Integrity", "MITM rewrites `amount=10` to `amount=1000`"],
              ["Repudiation", "Integrity", "User denies action; no audit log to prove it"],
              ["Info disclosure", "Confidentiality", "S3 bucket left public → 100M records leaked"],
              ["Denial of service", "Availability", "L7 flood → checkout API down for 4 hours"],
              ["Elevation of privilege", "All three", "Auth bug → any user becomes admin"]
            ]
          }
        ]
      },
      {
        "heading": "Who attacks you, and what do they want?",
        "body": [
          {
            "type": "p",
            "text": "**Threat modeling starts with the attacker, not the asset.** A bored teen wants notoriety. A criminal wants money — they'll ransomware your DB or sell PII. A nation-state wants persistence — they'll burn a zero-day and live in your network for a year. Different threats = different controls."
          },
          {
            "type": "diagram",
            "title": "Threat → asset → control",
            "height": 220,
            "nodes": [
              { "id": "attacker", "label": "attacker",   "subtitle": "WHO & WHY",    "accent": "fire",  "x": 0.25, "y": 0.28 },
              { "id": "vector",   "label": "vector",     "subtitle": "ENTRY POINT",  "accent": "amber", "x": 0.75, "y": 0.28 },
              { "id": "asset",    "label": "asset",      "subtitle": "PROTECTED",    "accent": "earth", "x": 0.75, "y": 0.78 },
              { "id": "control",  "label": "control",    "subtitle": "DEFENSE",      "accent": "water", "x": 0.25, "y": 0.78 }
            ],
            "edges": [
              { "from": "attacker", "to": "vector",  "kind": "dashed", "label": "intent" },
              { "from": "vector",   "to": "asset",   "kind": "dashed", "label": "exploit" },
              { "from": "control",  "to": "vector",  "kind": "dashed", "label": "blocks" }
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Threat-modeling each component before you ship it",
              "Mapping every control to which CIA leg it protects",
              "Naming the attacker (script kiddie, criminal, insider, nation-state)",
              "Reviewing the model after every major architecture change"
            ],
            "watch": [
              "'It's behind a VPN' as your only defense — perimeter ≠ security",
              "Designing for the bored teen and ignoring the bribed insider",
              "Threat models that live in a Confluence doc and never get re-read",
              "Treating availability as DevOps' problem — DDoS is a security event"
            ]
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# Mini threat-model template — one of these per component  # repeat for each box on the arch diagram\ncomponent: payments-api  # the thing you're modeling\nassets:\n  - card_pan  # confidentiality (PCI scope)\n  - transaction_log  # integrity (audit)\nthreats:\n  - id: T-01  # short ID so you can reference it in tickets\n    stride: Tampering  # which STRIDE category — forces the conversation\n    scenario: \"Attacker replays a captured POST /charge with mutated amount.\"\n    impact: high  # how bad if it lands\n    likelihood: medium  # how likely with current controls\n    controls:\n      - signed-idempotency-key  # short-lived HMAC; replays rejected\n      - request-body HMAC + clock-skew window  # tamper detection\n  - id: T-02\n    stride: ElevationOfPrivilege\n    scenario: \"User reuses another user's JWT against /refund.\"\n    impact: critical\n    likelihood: low\n    controls:\n      - audience + subject claims pinned per endpoint  # AuthN binds to user\n      - server-side ownership check on the order row  # AuthZ binds to data\n"
          },
          {
            "type": "quote",
            "text": "Security is a property of the system. You don't add it — you design without removing it.",
            "cite": "the threat-model lemma"
          },
          {
            "type": "explain-back",
            "prompt": "You've met the **CIA triad**, **STRIDE**, the **attacker taxonomy** (teen → criminal → nation-state), and the **threat → asset → control** loop. Pick one real component — say a `payments-api` — and walk a teammate through how you'd threat-model it end to end using all four. Then name the one trade-off you'd consciously accept, and why.",
            "modelAnswer": "Start from the **attacker**, not the asset: a criminal wants the card data (money) and a nation-state wants persistence — that decides how much you spend. For the `payments-api` I list **assets** and tag each with the CIA leg it lives on: the PAN is Confidentiality, the transaction log is Integrity, the checkout endpoint is Availability. Then I run **STRIDE** over the component as a forcing function — Tampering on the `amount` field, Elevation of privilege via a reused JWT, DoS on checkout — and for each threat I attach a **control** that maps back to the CIA leg it restores (HMAC idempotency key for tampering, per-endpoint subject claims + server-side ownership check for privilege, rate limiting for DoS). The **trade-off** I'd consciously accept: I'd defend hard against the criminal and the bribed insider, and *under*-invest against a true nation-state zero-day — because that defense is near-infinite cost and the realistic ROI is on the controls that stop the 99% of attacks I can actually name. The judgment is that a threat model is a budget allocator, not a guarantee — and the failure mode is the model that lives in a doc nobody re-reads after the architecture changes.",
            "hint": "The four pieces aren't a list to recite — they're a pipeline: attacker (who/why) → asset (CIA leg) → STRIDE (what breaks it) → control (what restores that leg). The trade-off lives in *which* attacker you choose to underspend on."
          }
        ]
      }
    ]
  },
  "sec-authn-vs-authz": {
    "sections": [
      {
        "heading": "Two questions, never confuse them",
        "body": [
          {
            "type": "p",
            "text": "**Authentication asks 'who are you?' — authorization asks 'are you allowed to do that?'** The bouncer at the door checks your ID (authn). The velvet rope inside decides which room you can enter (authz). Conflate the two and you'll write a system that lets every logged-in user delete every other user's data."
          },
          {
            "type": "p",
            "text": "**A valid session is not a permission slip.** Knowing the user is `alice@example.com` tells you nothing about whether she can read `/admin/users/42`. That decision belongs to the policy layer, not the login layer."
          }
        ]
      },
      {
        "heading": "Side-by-side mental model",
        "body": [
          {
            "type": "table",
            "headers": [
              "",
              "Authentication (authn)",
              "Authorization (authz)"
            ],
            "rows": [
              ["Question",     "Who are you?",                "Are you allowed?"],
              ["Output",       "Identity (user ID, claims)",  "Allow / deny on a resource"],
              ["When",         "Once at session start",       "Every single request"],
              ["Stronger by",  "MFA, hardware key, FIDO2",    "Least privilege, deny-default, RBAC"]
            ]
          },
          {
            "type": "p",
            "text": "**MFA is stronger authentication, not stronger authorization.** A second factor makes it harder for an attacker to impersonate Alice — it does nothing to limit what Alice (or her hijacked session) can do once inside."
          },
          {
            "type": "walkthrough",
            "title": "The request path",
            "why": "Two different gates, two different questions — collapse them and any logged-in user can touch any data.",
            "height": 220,
            "nodes": [
              { "id": "user",   "label": "user",    "subtitle": "BROWSER",    "accent": "water", "x": 0.08, "y": 0.5 },
              { "id": "authn",  "label": "authn",   "subtitle": "WHO?",       "accent": "amber", "x": 0.38, "y": 0.5 },
              { "id": "authz",  "label": "authz",   "subtitle": "ALLOWED?",   "accent": "amber", "x": 0.38, "y": 0.85 },
              { "id": "asset",  "label": "asset",   "subtitle": "DATA",       "accent": "earth", "x": 0.92, "y": 0.85 }
            ],
            "steps": [
              {
                "title": "Request arrives",
                "description": "The browser sends a request carrying credentials — a session cookie or a `Bearer` token. Nothing is trusted yet.",
                "activeNodes": ["user"],
                "activeEdges": []
              },
              {
                "title": "authn — who are you?",
                "description": "The login layer verifies the credentials and produces an **identity** (a user ID and claims). This answers *who*, not *what they may do*.",
                "activeNodes": ["user", "authn"],
                "activeEdges": [{ "from": "user", "to": "authn", "label": "credentials" }]
              },
              {
                "title": "authz — are you allowed?",
                "description": "The policy layer takes that identity and decides, **for this specific resource**, allow or deny. This runs on *every* request, not once at login.",
                "activeNodes": ["authn", "authz"],
                "activeEdges": [{ "from": "authn", "to": "authz", "label": "identity" }]
              },
              {
                "title": "Access granted to the asset",
                "description": "Only after an explicit allow does the request reach the data. Skip this gate and you get the IDOR: `GET /orders/42` hands Bob whatever Alice owns.",
                "activeNodes": ["authz", "asset"],
                "activeEdges": [{ "from": "authz", "to": "asset", "label": "allow" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "Where teams trip",
        "body": [
          {
            "type": "p",
            "text": "**Broken access control is OWASP #1 for a reason.** Most apps authenticate flawlessly and then assume any logged-in user can hit any URL with any ID in it. The IDOR (insecure direct object reference) is the same bug, every year: `GET /api/orders/42` returns Alice's order to Bob because nobody checked ownership server-side."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Centralizing authz in middleware / policy engine, not per-route",
              "Deny-by-default — explicit allow rules only",
              "Logging both decisions: who was identified AND what they could do",
              "Checking ownership on EVERY mutation, not just the first one"
            ],
            "watch": [
              "Trusting client-side role checks (UI hides admin button → API still serves it)",
              "Confusing 'has a valid JWT' with 'allowed to do this'",
              "Sticky sessions that outlive permission revocation",
              "Putting role in the JWT and never re-checking after demotion"
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# FastAPI — separate authn dep from authz dep, never collapse them\nfrom fastapi import Depends, HTTPException, status\n\n# AUTHN: who is this request from?  # returns identity or raises 401\ndef current_user(token: str = Depends(bearer_scheme)) -> User:\n    try:\n        claims = jwt.decode(token, JWT_PUBLIC_KEY, algorithms=[\"RS256\"])  # verify signature\n    except jwt.PyJWTError:\n        raise HTTPException(status.HTTP_401_UNAUTHORIZED)  # 401 = unknown, not 403\n    return User(id=claims[\"sub\"], roles=claims[\"roles\"])\n\n# AUTHZ: is this identity allowed to touch THIS row?  # returns nothing or raises 403\ndef can_read_order(user: User, order_id: str, db) -> None:\n    order = db.get(Order, order_id)\n    if order is None:\n        raise HTTPException(status.HTTP_404_NOT_FOUND)  # don't leak existence\n    if order.owner_id != user.id and \"admin\" not in user.roles:\n        raise HTTPException(status.HTTP_403_FORBIDDEN)  # 403 = known but not allowed\n\n@app.get(\"/orders/{order_id}\")\ndef get_order(order_id: str, user: User = Depends(current_user), db=Depends(get_db)):\n    can_read_order(user, order_id, db)  # authz check every single call — never cache\n    return db.get(Order, order_id)\n"
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Hash a password with bcrypt and verify it. Try comparing the wrong password — it should reject.",
            "varName": "verified",
            "starter": "import bcrypt\n\npassword = b'correct horse battery staple'\nhashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))\n\nattempt = b'correct horse battery staple'\nverified = bcrypt.checkpw(attempt, hashed)\nprint('hash:', hashed[:20] + b'...')\nprint('verified:', verified)\n",
            "hint": "bcrypt.gensalt() generates a fresh salt each call — that's why two hashes of the same password differ. checkpw extracts the salt from the stored hash and re-derives. Try setting `attempt` to a wrong password."
          },
          {
            "type": "quote",
            "text": "Authentication is the door. Authorization is every lock inside the house.",
            "cite": "the access-control mantra"
          }
        ]
      }
    ]
  },
  "sec-crypto-basics": {
    "sections": [
      {
        "heading": "Three families, three jobs",
        "body": [
          {
            "type": "p",
            "text": "**Hashing is one-way** — given input, you get a fixed-size fingerprint and cannot invert. **Symmetric encryption** uses one shared secret for both encrypt and decrypt — fast, but the key has to get to both parties somehow. **Asymmetric encryption** uses a public/private pair — anyone can encrypt to you, only your private key decrypts. Pick the family by the job, never by the buzzword."
          },
          {
            "type": "p",
            "text": "**Modern systems use all three together.** TLS uses asymmetric to negotiate a fresh symmetric session key, then symmetric for the actual bytes (because asymmetric is too slow for bulk data), and hashing for integrity. That's not overkill — it's the only way that scales."
          }
        ]
      },
      {
        "heading": "The crypto cheat sheet",
        "body": [
          {
            "type": "terms",
            "items": [
              { "term": "Hash (SHA-256, BLAKE3)", "def": "No key. Use for fingerprints + integrity. **Don't** use for password storage (use bcrypt/Argon2)." },
              { "term": "Password hash (bcrypt, Argon2)", "def": "Salt + cost factor. Use for passwords at rest. **Don't** use for sessions or API keys." },
              { "term": "Symmetric (AES-GCM, ChaCha20)", "def": "One shared key. Use for bulk encryption + sessions. **Don't** send the key in plaintext." },
              { "term": "Asymmetric (RSA, Ed25519, ECDH)", "def": "Public + private key pair. Use for key exchange + signatures. **Don't** encrypt large payloads directly." }
            ]
          },
          {
            "type": "p",
            "text": "**Passwords are special.** They are low-entropy human strings; a plain SHA-256 of `password123` is GPU-cracked in milliseconds. You need a slow, salted, memory-hard function: **bcrypt** (cost factor ≥ 12) or **Argon2id** (the OWASP recommendation for new systems)."
          }
        ]
      },
      {
        "heading": "The TLS handshake in six steps",
        "body": [
          {
            "type": "diagram",
            "title": "TLS 1.3 handshake — abridged",
            "height": 220,
            "nodes": [
              { "id": "hi",     "label": "ClientHello", "subtitle": "CIPHERS",     "accent": "water", "x": 0.10, "y": 0.5 },
              { "id": "srv",    "label": "ServerHello", "subtitle": "CERT+KEY",    "accent": "sky",   "x": 0.38, "y": 0.5 },
              { "id": "verify", "label": "verify",      "subtitle": "SIGNATURE",   "accent": "amber", "x": 0.38, "y": 0.85 },
              { "id": "secure", "label": "encrypted",   "subtitle": "KEY READY",   "accent": "earth", "x": 0.92, "y": 0.85 }
            ],
            "edges": [
              { "from": "hi",     "to": "srv",    "kind": "dashed", "label": "offer" },
              { "from": "srv",    "to": "verify", "kind": "dashed", "label": "prove" },
              { "from": "verify", "to": "secure", "kind": "dashed", "label": "derive" }
            ]
          },
          {
            "type": "sequence",
            "title": "TLS 1.3 handshake — over the wire",
            "caption": "Each solid arrow is one network round-trip; the dashed step is local.",
            "actors": [
              { "id": "client", "label": "Browser", "accent": "water" },
              { "id": "server", "label": "Server",  "accent": "fire" },
              { "id": "ca",     "label": "CA",      "accent": "sky" }
            ],
            "events": [
              { "from": "client", "to": "server", "label": "ClientHello",     "note": "ciphers + key share" },
              { "from": "server", "to": "client", "label": "ServerHello + cert", "note": "signed by CA" },
              { "from": "client", "to": "ca",     "label": "Verify chain",    "note": "CA root trusted",  "dashed": true },
              { "self": "client", "label": "Derive session key",              "note": "ECDHE local",      "dashed": true },
              { "from": "client", "to": "server", "label": "Finished" },
              { "from": "server", "to": "client", "label": "Encrypted data" }
            ]
          },
          {
            "type": "walkthrough",
            "title": "TLS 1.3 handshake, step by step",
            "caption": "Walk through how a fresh session key gets agreed on in one round trip.",
            "nodes": [
              { "id": "client", "label": "Client",  "subtitle": "BROWSER",        "accent": "water", "x": 0.12, "y": 0.5 },
              { "id": "server", "label": "Server",  "subtitle": "TLS ENDPOINT",   "accent": "fire",  "x": 0.88, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "Client Hello",
                "description": "Client opens the conversation: \"here's my supported TLS versions, my cipher suites, and a fresh ephemeral key share.\"",
                "activeNodes": ["client", "server"],
                "activeEdges": [{ "from": "client", "to": "server", "label": "hello + share" }]
              },
              {
                "title": "Server Hello + cert + key share",
                "description": "Server picks a cipher, sends its certificate (proving its identity) and its own ephemeral key share back in the same flight.",
                "activeNodes": ["server", "client"],
                "activeEdges": [{ "from": "server", "to": "client", "label": "cert + share" }]
              },
              {
                "title": "Client verifies + derives secret",
                "description": "Client walks the cert chain to a trusted CA, checks the hostname matches, then combines the two key shares (ECDHE) into a shared secret. No extra round trip needed.",
                "activeNodes": ["client"],
                "activeEdges": []
              },
              {
                "title": "Both derive session keys",
                "description": "Both sides run the same key schedule over the shared secret to derive symmetric AEAD session keys. TLS 1.3 skips the extra round trip that 1.2 needed here.",
                "activeNodes": ["client", "server"],
                "activeEdges": []
              },
              {
                "title": "Encrypted application data flows",
                "description": "Every byte from here is AEAD-encrypted with the fresh session key. Forward secrecy: even if the server's long-term key leaks tomorrow, this conversation stays sealed.",
                "activeNodes": ["client", "server"],
                "activeEdges": [
                  { "from": "client", "to": "server", "label": "encrypted" },
                  { "from": "server", "to": "client", "label": "encrypted" }
                ]
              }
            ]
          },
          {
            "type": "ol",
            "items": [
              "**ClientHello** — client proposes TLS version, cipher suites, and a fresh public key share.",
              "**ServerHello** — server picks a cipher, sends its certificate and its own key share.",
              "**Cert verify** — client checks the cert chains to a trusted CA and matches the hostname.",
              "**Key derivation** — both sides combine the key shares (ECDHE) into a shared session secret.",
              "**Finished** — both sides confirm they computed the same key. Forward secrecy from this point.",
              "**Application data** — every byte from here is AEAD-encrypted with the session key."
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Using vetted libraries — libsodium, ring, the platform's crypto API",
              "Argon2id or bcrypt(cost≥12) for passwords, with a per-user salt",
              "AEAD modes (AES-GCM, ChaCha20-Poly1305) — never raw AES-CBC without HMAC",
              "Rotating keys on a schedule, not just on breach"
            ],
            "watch": [
              "'Rolling your own crypto' — even cryptographers don't roll their own",
              "MD5 or SHA-1 for anything security-relevant — both broken for collisions",
              "ECB mode (the penguin meme is real)",
              "Reusing the same IV/nonce with the same key — catastrophic in GCM"
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Argon2id password hashing — the modern OWASP recommendation\nfrom argon2 import PasswordHasher\nfrom argon2.exceptions import VerifyMismatchError\n\n# Tuneable — increase memory_cost / time_cost as hardware gets faster\nph = PasswordHasher(  # defaults are sane; tune for ~250ms on your server\n    time_cost=3,        # iterations\n    memory_cost=65536,  # 64 MiB — memory-hard frustrates GPU/ASIC attackers\n    parallelism=4,      # threads\n)\n\n# At signup — store ONLY the encoded hash; never the password\nencoded = ph.hash(\"correct horse battery staple\")  # salt is generated inside\nprint(encoded)  # $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>\n\n# At login — verify, and re-hash if the cost params have drifted\ntry:\n    ph.verify(encoded, \"correct horse battery staple\")  # constant-time compare\n    if ph.check_needs_rehash(encoded):  # cost params upgraded since signup?\n        encoded = ph.hash(\"correct horse battery staple\")  # save the new encoding\nexcept VerifyMismatchError:\n    # log + rate-limit; do NOT reveal whether user exists  # timing-safe failure path\n    raise\n"
          },
          {
            "type": "quote",
            "text": "Don't roll your own crypto. You will get it wrong. The people who got it right got it wrong first.",
            "cite": "every cryptographer ever"
          }
        ]
      }
    ]
  },
  "sec-owasp-top-10": {
    "sections": [
      {
        "heading": "Ten ways your app is already broken",
        "body": [
          {
            "type": "p",
            "text": "**The OWASP Top 10 is the universal pre-flight checklist for web apps.** It's not a complete list of every vulnerability — it's the ten classes that show up in real breach reports year after year. If you can't articulate how you defend against each one, your app is shipping with a known list of pre-installed exploits."
          },
          {
            "type": "p",
            "text": "**The mindset shift is 'default secure'.** Don't ask 'is there a known attack on this endpoint?' — ask 'what's the smallest set of inputs that could reach a sensitive operation, and is every one of them validated?' Validation is the input gate; authorization is the action gate. Both must be deny-default."
          }
        ]
      },
      {
        "heading": "The ten, named and defanged",
        "body": [
          {
            "type": "table",
            "headers": [
              "Category (A01-A05)",
              "What it looks like",
              "Primary defense"
            ],
            "rows": [
              ["A01 Broken access control", "IDOR, missing ownership check",   "Server-side authz on every action"],
              ["A02 Crypto failures",      "Plain HTTP, weak hashes, MD5 PII",  "TLS everywhere, Argon2id for pw"],
              ["A03 Injection",            "SQLi, XSS, command injection",     "Parameterized queries, output encoding"],
              ["A04 Insecure design",      "No threat model, missing rate limits","Threat-model + abuse-case review"],
              ["A05 Security misconfig",   "Default creds, debug mode in prod", "Hardened baselines, CIS benchmarks"]
            ]
          },
          {
            "type": "p",
            "text": "And the second half — these are the categories that keep climbing the list as supply chains grow:"
          },
          {
            "type": "table",
            "headers": [
              "Category (A06-A10)",
              "What it looks like",
              "Primary defense"
            ],
            "rows": [
              ["A06 Vulnerable components","Outdated libs with known CVEs",     "SBOM + Dependabot + image scanning"],
              ["A07 Auth failures",        "Weak resets, no MFA, session fixation","Strong MFA, rotation on privilege change"],
              ["A08 Software/data integrity","Unsigned updates, CI poisoning",  "SLSA, signed artifacts, locked deps"],
              ["A09 Logging failures",     "Can't tell who did what or when",   "Structured audit log, central SIEM"],
              ["A10 Server-side req forgery","Internal URL fetched by user input","Allow-list egress, no metadata IPs"]
            ]
          }
        ]
      },
      {
        "heading": "Injection is still champion",
        "body": [
          {
            "type": "p",
            "text": "**Injection sits on the list because string-concatenated queries still ship every week.** SQL, NoSQL, LDAP, OS command, log forgery — same family, same fix. Treat untrusted input as **data, never code**, by using the language/driver's parameterization primitive."
          },
          {
            "type": "diagram",
            "title": "Trust boundary: where to validate",
            "height": 220,
            "nodes": [
              { "id": "untrusted", "label": "untrusted", "subtitle": "EXTERNAL",   "accent": "fire",  "x": 0.25, "y": 0.25 },
              { "id": "boundary",  "label": "validate",  "subtitle": "SCHEMA",     "accent": "amber", "x": 0.75, "y": 0.25 },
              { "id": "logic",     "label": "logic",     "subtitle": "TRUSTED",    "accent": "water", "x": 0.25, "y": 0.75 },
              { "id": "store",     "label": "store",     "subtitle": "PARAM ONLY", "accent": "earth", "x": 0.75, "y": 0.75 }
            ],
            "edges": [
              { "from": "untrusted", "to": "boundary", "kind": "dashed", "label": "input" },
              { "from": "boundary",  "to": "logic",    "kind": "dashed", "label": "clean" },
              { "from": "logic",     "to": "store",    "kind": "dashed", "label": "params" }
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Parameterized queries / prepared statements — never string-concat",
              "Schema validation at every trust boundary (pydantic, zod, JSON Schema)",
              "Content Security Policy + auto-escaping templates for XSS",
              "Allow-list for any URL/host the server will fetch (kills SSRF)"
            ],
            "watch": [
              "Sanitizing by stripping characters — bypasses are inevitable, parameterize instead",
              "'We validate on the client' — every API needs server-side validation too",
              "Letting the ORM build raw SQL with f-strings 'just this once'",
              "Logging request bodies that contain credentials or PII"
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# The injection-vs-parameterized contrast, side by side\nimport sqlite3\nconn = sqlite3.connect(\"app.db\")\n\n# BROKEN — string concat = SQL injection in one line  # do not ship this\nemail = request.args[\"email\"]  # attacker sends:  ' OR '1'='1\nrows = conn.execute(\n    f\"SELECT * FROM users WHERE email = '{email}'\"  # entire WHERE collapses\n).fetchall()\n\n# CORRECT — driver parameterization; email is treated as data, not SQL\nrows = conn.execute(\n    \"SELECT * FROM users WHERE email = ?\",  # placeholder — driver escapes\n    (email,),  # tuple of bound values\n).fetchall()\n\n# Also correct — schema-validate at the trust boundary\nfrom pydantic import BaseModel, EmailStr, constr\nclass LoginIn(BaseModel):\n    email: EmailStr  # rejects non-emails before they reach the DB\n    password: constr(min_length=8, max_length=128)  # bounds to defeat DoS-via-bcrypt\n\n# Anti-pattern — sanitize-by-blocklist; attackers always find a bypass\ndef bad_clean(s):  # NEVER do this\n    return s.replace(\"'\", \"\").replace(\";\", \"\").replace(\"--\", \"\")  # incomplete + brittle\n"
          },
          {
            "type": "quote",
            "text": "Treat input as data. The moment you let it become code, you lose.",
            "cite": "the injection axiom"
          }
        ]
      }
    ]
  },
  "sec-secrets-mgmt": {
    "sections": [
      {
        "heading": "A secret in git is forever",
        "body": [
          {
            "type": "p",
            "text": "**Git is content-addressed and append-only.** Pushing a `.env` to a public repo for thirty seconds is enough — bots scrape new commits within minutes. `git rm` doesn't help; the blob lives in history, in every clone, on every fork, and probably in someone's grep cache. **The only correct response is to rotate the secret immediately and assume it leaked.**"
          },
          {
            "type": "p",
            "text": "**Secrets don't belong in container images either.** Anyone who can pull the image can `docker history` or extract the layer. Bake the app, inject the secret at runtime from a vault, KMS, or orchestrator secret — never `ENV API_KEY=sk_live_…` in a Dockerfile."
          }
        ]
      },
      {
        "heading": "Where to put them instead",
        "body": [
          {
            "type": "table",
            "headers": [
              "Option",
              "Good for",
              "Trade-off"
            ],
            "rows": [
              ["Vault / KMS (HashiCorp, AWS, GCP)", "Centralized, audited, rotatable",        "Operational overhead, another HA service"],
              ["K8s Secrets + External Secrets Op", "GitOps-friendly, live sync from vault",   "Default K8s secret is base64, not encrypted at rest unless you configure it"],
              ["SOPS / sealed-secrets",           "Encrypted-in-git workflow",                "Decrypt keys still need a real KMS"],
              ["Env vars from CI / orchestrator", "Cheap, works everywhere",                  "Easy to leak in logs / process listings"]
            ]
          },
          {
            "type": "p",
            "text": "**Use a hierarchy.** A real KMS or HSM holds the root keys. A vault holds the application secrets, encrypted with KMS. Apps fetch from the vault at startup over short-lived tokens — and never log the value."
          },
          {
            "type": "diagram",
            "title": "The secrets pipeline",
            "height": 220,
            "nodes": [
              { "id": "kms",   "label": "KMS",    "subtitle": "ROOT KEY",    "accent": "amber", "x": 0.10, "y": 0.5 },
              { "id": "vault", "label": "vault",  "subtitle": "ENCRYPTED",   "accent": "earth", "x": 0.38, "y": 0.5 },
              { "id": "app",   "label": "app",    "subtitle": "SHORT TOKEN", "accent": "water", "x": 0.38, "y": 0.85 },
              { "id": "audit", "label": "audit",  "subtitle": "READ TRAIL",  "accent": "sky",   "x": 0.92, "y": 0.85 }
            ],
            "edges": [
              { "from": "kms",   "to": "vault", "kind": "dashed", "label": "wraps" },
              { "from": "vault", "to": "app",   "kind": "dashed", "label": "lease" },
              { "from": "app",   "to": "audit", "kind": "dashed", "label": "logs" }
            ]
          }
        ]
      },
      {
        "heading": "The rotation playbook",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Detect or schedule** — leak alert, calendar entry, or short TTL forces the rotation.",
              "**Issue new** — generate v2 of the secret in the vault; do not delete v1 yet.",
              "**Dual-accept** — services accept both v1 and v2 for the overlap window.",
              "**Rollout** — clients pick up v2 (restart, hot-reload, or sidecar refresh).",
              "**Cut over** — revoke v1; monitor 4xx/auth-failures for stragglers.",
              "**Audit** — record what was rotated, when, by whom, and what the impact was."
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Short TTLs on every credential — minutes for service tokens, hours for human ones",
              "Per-environment secrets — dev never knows prod values",
              "Pre-commit hooks (gitleaks, truffleHog) catching secrets before push",
              "Pulling secrets at startup or via a sidecar — never baked into images"
            ],
            "watch": [
              "`.env` files committed 'just temporarily' — they outlive the commit",
              "Long-lived AWS access keys in CI — use OIDC federation instead",
              "Logging request headers — `Authorization` ends up in your SIEM",
              "Sharing 'the staging Postgres password' over Slack — now it's in 50 places"
            ]
          },
          {
            "type": "p",
            "text": "**Issue v2 + publish to the store** — the new key exists alongside the old; CI hasn't switched yet."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "#!/usr/bin/env bash\nset -euo pipefail  # fail loud — secrets workflows must never partially succeed\n\n# Rotate an AWS access key for a CI machine identity  # dual-accept window keeps the build green\nIAM_USER=\"ci-builder\"  # the IAM user whose key we're rotating\n\n# 1) create v2 BEFORE deleting v1 — overlap window  # also dumps creds to a temp file\nNEW=$(aws iam create-access-key --user-name \"$IAM_USER\" --output json)\nNEW_ID=$(echo \"$NEW\"  | jq -r .AccessKey.AccessKeyId)\nNEW_SEC=$(echo \"$NEW\" | jq -r .AccessKey.SecretAccessKey)\n\n# 2) push v2 to the secrets store  # vault, GH Actions, whatever your CI reads from\nvault kv put secret/ci/aws_keys/$IAM_USER \\\n  access_key_id=\"$NEW_ID\" \\\n  secret_access_key=\"$NEW_SEC\"  # encrypted at rest, audited on read"
          },
          {
            "type": "p",
            "text": "**Canary + deactivate (reversible)** — flip CI to v2, run a green build, then mark v1 Inactive. Delete only after a cooling-off window proves nothing still uses it."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# 3) flip CI to v2 and run a canary build  # if green, we proceed; if red, roll back\ngh workflow run rotate-canary.yml --field key_id=\"$NEW_ID\"\n\n# 4) wait, observe, THEN deactivate v1  # never delete instantly — leave forensic trail\nOLD_ID=$(aws iam list-access-keys --user-name \"$IAM_USER\" \\\n  --query \"AccessKeyMetadata[?AccessKeyId!='$NEW_ID'].AccessKeyId\" --output text)\naws iam update-access-key --user-name \"$IAM_USER\" \\\n  --access-key-id \"$OLD_ID\" --status Inactive  # reversible — flips to Active if needed\n\n# 5) after a 24h cooling-off, actually delete  # by now v1 has zero successful uses\n# aws iam delete-access-key --user-name \"$IAM_USER\" --access-key-id \"$OLD_ID\"\n"
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Generate a strong random secret with openssl. Try different lengths and encodings.",
            "starter": "# A URL-safe 32-byte token (good for API keys)\nopenssl rand -base64 32\n\n# A hex token (good for HMAC keys / nonces)\nopenssl rand -hex 32\n",
            "hint": "openssl rand pulls from the OS CSPRNG. `-base64` is friendlier for headers/env vars; `-hex` is friendlier for logs and DB columns. Never roll your own RNG — random.random() is NOT cryptographically secure."
          },
          {
            "type": "quote",
            "text": "Assume it leaked. Rotate first; investigate after.",
            "cite": "the secrets-management first rule"
          },
          {
            "type": "explain-back",
            "prompt": "You've seen **why a secret in git is forever**, the **KMS → vault → app → audit** storage pipeline, and the **six-step rotation playbook** (detect → issue → dual-accept → rollout → cut over → audit). Design the path a single CI access key takes from creation to safe retirement so that a leak is *survivable by default* — and name the one trade-off the dual-accept window forces on you.",
            "modelAnswer": "The key never starts as a long-lived value pasted into CI: a **KMS** root key encrypts the **vault**, the CI job pulls a **short-TTL** credential at startup (or via a sidecar), and every read leaves an **audit** trail — so even before rotation, a leaked token is already low-blast-radius because it expires in minutes and you can see who touched it. When a leak *is* suspected you don't investigate first — you run the **rotation playbook**: issue v2 *beside* v1 (never delete v1 yet), flip services to **dual-accept** both, roll clients onto v2, then cut over by marking v1 *Inactive* (reversible) and only deleting after a cooling-off window proves zero successful uses, recording the whole thing in the audit log. The **trade-off** the dual-accept window forces: for that overlap, *two* valid credentials exist, so the attacker's stolen key keeps working until you cut over — you're trading a wider attack window for a zero-downtime rollout. The judgment call is sizing that window: long enough that no client 401s mid-deploy, short enough that a compromised v1 isn't usable for hours. Shrink it with short TTLs and OIDC federation so there's rarely a static key to dual-accept at all.",
            "hint": "Tie the storage pipeline to the rotation steps: the audit trail is what tells you v1 has zero uses left, which is what makes the 'cut over' step safe. The trade-off is purely about the dual-accept overlap — what's true about credentials *during* that window?"
          }
        ]
      }
    ]
  },
  "sec-defense-in-depth": {
    "sections": [
      {
        "heading": "Onion architecture for security",
        "body": [
          {
            "type": "p",
            "text": "**Defense in depth means no single control is the breach.** Picture an onion: network → host → application → data. An attacker who pops the WAF still meets the host firewall; who pops that still meets the app's authz; who pops that still meets encrypted data with row-level access. Each layer buys time and visibility — the breach gets caught, not just resisted."
          },
          {
            "type": "p",
            "text": "**Adopt 'assume breach' posture.** Don't design as if your firewall will hold forever. Design so that when (not if) an attacker lands inside, they hit obstacles, leave logs, and can only reach a tiny blast radius before being detected."
          }
        ]
      },
      {
        "heading": "Layers, controls, and what they cost",
        "body": [
          {
            "type": "diagram",
            "title": "Four-layer onion",
            "height": 240,
            "nodes": [
              { "id": "net",  "label": "network", "subtitle": "WAF+VPC",     "accent": "sky",   "x": 0.30, "y": 0.30 },
              { "id": "host", "label": "host",    "subtitle": "FIREWALL",    "accent": "water", "x": 0.70, "y": 0.30 },
              { "id": "app",  "label": "app",     "subtitle": "AUTH+VALID",  "accent": "amber", "x": 0.30, "y": 0.70 },
              { "id": "data", "label": "data",    "subtitle": "ENCRYPT+RBAC","accent": "earth", "x": 0.70, "y": 0.70 }
            ],
            "edges": [
              { "from": "net",  "to": "host", "kind": "dashed", "label": "filter" },
              { "from": "host", "to": "app",  "kind": "dashed", "label": "isolate" },
              { "from": "app",  "to": "data", "kind": "dashed", "label": "gate" }
            ]
          },
          {
            "type": "layers",
            "title": "Defense in depth — four controls, four layers",
            "caption": "An attacker has to defeat every band to reach the data. Each layer buys time and visibility.",
            "layers": [
              { "n": 1, "label": "Network",     "example": "perimeter firewall",  "accent": "sky" },
              { "n": 2, "label": "Host",        "example": "OS hardening",         "accent": "water" },
              { "n": 3, "label": "Application", "example": "input validation",     "accent": "amber" },
              { "n": 4, "label": "Data",        "example": "encryption at rest",   "accent": "earth" }
            ]
          },
          {
            "type": "table",
            "headers": [
              "Layer",
              "Example controls",
              "Caught here"
            ],
            "rows": [
              ["Network", "WAF, VPC, network ACL, mTLS", "DDoS, untrusted egress, lateral pivots"],
              ["Host",    "OS patches, eBPF, CIS bench", "Privilege escalation, kernel exploits"],
              ["App",     "AuthN, AuthZ, validation, rate limit", "Injection, IDOR, account takeover"],
              ["Data",    "Encryption at rest, RBAC, audit log", "Bulk exfil, insider misuse"]
            ]
          },
          {
            "type": "p",
            "text": "**Blast-radius thinking ties it together.** When (not if) one credential is compromised or one box is owned, how much can the attacker touch? Least privilege at every layer keeps the answer to 'one row, one service, one minute' instead of 'the whole prod database'."
          }
        ]
      },
      {
        "heading": "Anti-patterns that look like security",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Defaulting to deny at every layer — network, app, and data",
              "Network segmentation so prod can't be reached from a developer laptop",
              "Short-lived credentials everywhere — humans and machines",
              "Telemetry from every layer fanning into one SIEM you actually read"
            ],
            "watch": [
              "'We have a firewall' — perimeter security alone fails the moment one box is owned",
              "Flat networks where one compromised pod can reach the whole cluster",
              "VPN as 'good enough' authn for the admin panel — phishing still wins",
              "Logging without alerting — the breach was in the logs for 287 days"
            ]
          },
          {
            "type": "p",
            "text": "**Three NetworkPolicies, layered.** First, deny everything by default in the namespace — without this, every pod talks to every other pod."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# Kubernetes NetworkPolicy — deny-default + explicit allows\n# Without this, every pod can talk to every other pod (a flat network).\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: payments-deny-default\n  namespace: payments\nspec:\n  podSelector: {}  # empty = applies to ALL pods in the namespace\n  policyTypes: [Ingress, Egress]  # both directions — assume-breach posture\n  # No ingress/egress rules below = nothing allowed.  # explicit allows go in sibling policies"
          },
          {
            "type": "p",
            "text": "Then **open the front door narrowly** — only the API gateway's pods in the gateway namespace, only on port 8080."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "---\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: payments-allow-from-api\n  namespace: payments\nspec:\n  podSelector:\n    matchLabels: { app: payments }  # only the payments app pods\n  policyTypes: [Ingress]\n  ingress:\n    - from:\n        - namespaceSelector:\n            matchLabels: { name: api-gateway }  # ONLY the gateway namespace\n          podSelector:\n            matchLabels: { app: gateway }  # AND only the gateway app\n      ports:\n        - { protocol: TCP, port: 8080 }  # one port, one protocol — least surface"
          },
          {
            "type": "p",
            "text": "And **constrain egress to the database alone** — blocks SSRF and data exfil to the internet in one rule."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "---\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: payments-allow-egress-db-only\n  namespace: payments\nspec:\n  podSelector:\n    matchLabels: { app: payments }\n  policyTypes: [Egress]\n  egress:\n    - to:\n        - namespaceSelector: { matchLabels: { name: data } }\n          podSelector:        { matchLabels: { app: postgres } }\n      ports:\n        - { protocol: TCP, port: 5432 }  # blocks SSRF + data exfil to the internet\n"
          },
          {
            "type": "quote",
            "text": "A single firewall is a single point of failure. Defense in depth is the only depth that matters.",
            "cite": "the layered-controls maxim"
          },
          {
            "type": "explain-back",
            "prompt": "You've seen the **four-layer onion** (network → host → app → data), the **cost of each control**, the three **deny-default NetworkPolicies** (deny-all → narrow ingress → DB-only egress), and the **anti-patterns** that only *look* like security. An attacker phishes a developer laptop and lands a shell inside your cluster. Walk through which layers slow them down and where, then name the trade-off you accept by enforcing deny-default everywhere.",
            "modelAnswer": "The point of the **onion** is that the phished laptop only breaches one layer — it doesn't hand over the cluster. At the **network** layer, segmentation means the dev laptop can't even reach prod; if the attacker pivots to a compromised pod, the **deny-default NetworkPolicy** stops it talking to any other pod, the **narrow ingress** rule means only the gateway on 8080 can reach payments, and the **DB-only egress** rule blocks both lateral movement and exfil to attacker S3 — so SSRF and data theft die at the same rule. At the **app** layer, authn/authz and input validation mean a reachable service still won't honor a forged identity; at the **data** layer, encryption + RBAC mean even a stolen connection returns ciphertext for rows the principal doesn't own. Each layer buys time and forces noise into a SIEM you actually alert on — that's the difference between '287 days undetected' and a Tuesday page. The **trade-off** of deny-default everywhere is **operational friction**: every new service-to-service call now needs an explicit allow rule, so onboarding is slower and a forgotten rule shows up as a confusing 'connection refused' instead of a security event. I accept that because the failure mode points the right way — deny-default fails *closed* (something's broken and visible) instead of *open* (everything's reachable and silent). The anti-pattern to avoid is mistaking a single strong layer ('we have a firewall', 'it's behind a VPN') for depth — perimeter alone fails the instant one box is owned, which is exactly the scenario here.",
            "hint": "Trace the attacker's path through the layers in order and ask what each one denies. The trade-off isn't about security strength — it's the day-to-day operational cost of 'nothing is allowed until you say so', and which way that fails."
          }
        ]
      }
    ]
  },
  "sec-sqli": {
    "sections": [
      {
        "heading": "The string-concat that ate your database",
        "body": [
          {
            "type": "p",
            "text": "**SQL injection happens when user input becomes SQL code instead of SQL data.** The classic payload `1' OR 1=1--` works because the app glued the input into a query string — the quote closes the literal, the `OR 1=1` makes the WHERE always true, and `--` comments out whatever followed. Twenty-five years later, it's still in the OWASP Top 10 (A03:2021)."
          },
          {
            "type": "p",
            "text": "**Three flavors show up in the wild.** Classical (the response reflects the data you exfiltrate), blind (the response only tells you true/false — you binary-search the DB row by row), and second-order (the payload is stored on day one and executes on day five when a different code path concatenates it). All three have the same root cause: input crossing the code/data boundary."
          }
        ]
      },
      {
        "heading": "Vulnerable vs parameterized — the only real fix",
        "body": [
          {
            "type": "walkthrough",
            "title": "Injection path",
            "why": "The bug is one crossing: input that should have been data got parsed as code. Parameterize and the crossing never happens.",
            "height": 220,
            "nodes": [
              { "id": "attacker", "label": "attacker", "subtitle": "CRAFTED INPUT",   "accent": "fire",  "x": 0.25, "y": 0.5 },
              { "id": "app",      "label": "app",      "subtitle": "STRING CONCAT",   "accent": "amber", "x": 0.75, "y": 0.5 },
              { "id": "parser",   "label": "SQL parser","subtitle": "TREATS AS CODE", "accent": "sky",   "x": 0.25, "y": 0.85 },
              { "id": "db",       "label": "database", "subtitle": "EXECUTES ALL",    "accent": "earth", "x": 0.75, "y": 0.85 }
            ],
            "steps": [
              {
                "title": "Crafted input",
                "description": "The attacker types a payload like `1' OR 1=1--` into a normal form field. To the app it just looks like a username.",
                "activeNodes": ["attacker"],
                "activeEdges": []
              },
              {
                "title": "App glues it into a query",
                "description": "The vulnerable code concatenates the input straight into a query string: `... WHERE name='{input}'`. The quote in the payload now closes the literal early.",
                "activeNodes": ["attacker", "app"],
                "activeEdges": [{ "from": "attacker", "to": "app", "label": "payload" }]
              },
              {
                "title": "Parser reads it as code",
                "description": "The SQL parser can't tell data from code — it sees a valid `OR 1=1` clause and a `--` comment that deletes the rest. The structure of the query has been rewritten.",
                "activeNodes": ["app", "parser"],
                "activeEdges": [{ "from": "app", "to": "parser", "label": "concat" }]
              },
              {
                "title": "Database executes everything",
                "description": "The DB runs the attacker's logic with full app privileges — auth bypassed, every row returned. The fix is upstream: bind values as parameters so they never reach the parser as code.",
                "activeNodes": ["parser", "db"],
                "activeEdges": [{ "from": "parser", "to": "db", "label": "execute" }]
              }
            ]
          },
          {
            "type": "table",
            "headers": [
              "Pattern",
              "Vulnerable",
              "Safe"
            ],
            "rows": [
              ["Login lookup",     "f\"SELECT * FROM u WHERE name='{n}'\"", "cur.execute('SELECT * FROM u WHERE name=%s', (n,))"],
              ["ORDER BY column",  "f\"ORDER BY {col}\" (col from query string)", "Whitelist col against a fixed set, then interpolate"],
              ["Stored procedure", "EXEC ('SELECT ' + @x)",                 "Pass @x as parameter to the proc, no dynamic SQL"],
              ["Second-order",     "Trust value because it came from DB",   "Re-parameterize on every use — never trust persisted data"]
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# VULNERABLE — string interpolation, classic SQLi\ndef login_bad(username: str, password: str):\n    q = f\"SELECT id FROM users WHERE name='{username}' AND pw='{password}'\"  # input becomes code\n    return db.execute(q).fetchone()  # input  1' OR 1=1--  bypasses auth entirely\n\n# FIXED — parameterized query; driver sends SQL + args separately\ndef login_good(username: str, password_hash: str):\n    q = \"SELECT id FROM users WHERE name = %s AND pw_hash = %s\"  # %s is a placeholder\n    return db.execute(q, (username, password_hash)).fetchone()   # driver escapes for you\n\n# ORDER BY can't be parameterized — must whitelist column names yourself\nALLOWED_SORT = {\"created_at\", \"name\", \"email\"}  # closed set, server-defined\ndef list_users(sort: str):\n    if sort not in ALLOWED_SORT:           # reject unknown columns hard\n        raise ValueError(\"bad sort key\")\n    return db.execute(f\"SELECT * FROM users ORDER BY {sort}\").fetchall()\n"
          },
          {
            "type": "p",
            "text": "**ORMs help — they don't immunize.** Django's `User.objects.filter(name=n)` is safe, but `User.objects.raw(f'SELECT ... {n}')`, `.extra(where=[f'name={n}'])`, or any `cursor.execute` with f-strings reintroduces the bug. Treat every raw escape hatch as a hand-rolled query and audit it like one."
          }
        ]
      },
      {
        "heading": "Detection, defense, and a working payload",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Parameterized queries / prepared statements as the default everywhere",
              "Least-privilege DB user — app cannot DROP, can only CRUD its tables",
              "Whitelisting identifiers (column / table names) where placeholders don't work",
              "WAF + query-shape anomaly alerts as defense-in-depth, never as the only line"
            ],
            "watch": [
              "Blocklisting quote characters — `0x27` and Unicode tricks defeat naive filters",
              "Trusting client-side validation — the attacker isn't using your form",
              "Stored procedures that build dynamic SQL inside themselves",
              "ORMs with raw() / extra() escape hatches threaded through the codebase"
            ]
          },
          {
            "type": "practice",
            "lang": "sql",
            "prompt": "A login query is built as: SELECT id FROM users WHERE name = '<input>' AND pw = '<input>'. What username payload bypasses the password check entirely?",
            "starter": "-- Vulnerable query:\n-- SELECT id FROM users WHERE name = '<USERNAME>' AND pw = '<PASSWORD>'\n\n-- Try this as the USERNAME (any password works):\nSELECT id FROM users WHERE name = 'admin' OR '1'='1' -- ' AND pw = 'anything';\n",
            "hint": "The single quote closes the name literal, OR '1'='1' makes the WHERE always true, and -- starts a SQL comment so the AND pw=... clause is ignored. The fix: never concatenate user input — use parameterized queries."
          },
          {
            "type": "quote",
            "text": "Every SQL injection is the same bug: input that should have been data was parsed as code.",
            "cite": "the parameterization rule"
          }
        ]
      }
    ]
  },
  "sec-xss": {
    "sections": [
      {
        "heading": "Three XSS flavors, one root cause",
        "body": [
          {
            "type": "p",
            "text": "**XSS is when attacker-controlled data is rendered as executable code in someone else's browser.** Reflected XSS bounces a payload off a URL (`?q=<script>...`) into the response. Stored XSS lives in your DB and fires for every viewer (the worm-friendly variant — MySpace's Samy hit a million accounts in 20 hours). DOM-based XSS never touches the server — JS reads `location.hash` and shoves it through `innerHTML`."
          },
          {
            "type": "p",
            "text": "**The root cause is always the same: untrusted text written into a context that interprets text as code.** HTML, attributes, JS strings, CSS, and URLs each need *different* encoding. A single mental model — 'encode for the destination, not the source' — beats every regex blocklist."
          }
        ]
      },
      {
        "heading": "Encoding by context",
        "body": [
          {
            "type": "diagram",
            "title": "Stored XSS reach",
            "height": 230,
            "nodes": [
              { "id": "attacker", "label": "attacker", "subtitle": "POSTS PAYLOAD",  "accent": "fire",  "x": 0.30, "y": 0.33 },
              { "id": "server",   "label": "server",   "subtitle": "SAVES RAW HTML", "accent": "amber", "x": 0.70, "y": 0.33 },
              { "id": "db",       "label": "DB",       "subtitle": "STORES SCRIPT",  "accent": "earth", "x": 0.30, "y": 0.67 },
              { "id": "victim",   "label": "victim",   "subtitle": "EXECUTES IN JS", "accent": "water", "x": 0.70, "y": 0.67 }
            ],
            "edges": [
              { "from": "attacker", "to": "server", "kind": "dashed", "label": "comment" },
              { "from": "server",   "to": "db",     "kind": "dashed", "label": "persist" },
              { "from": "db",       "to": "victim", "kind": "dashed", "label": "render" }
            ]
          },
          {
            "type": "table",
            "headers": [
              "Context",
              "Encoding",
              "Bad example"
            ],
            "rows": [
              ["HTML body",       "&amp; &lt; &gt; &quot;",          "<div>{userBio}</div>"],
              ["HTML attribute",  "Quote + entity-encode",            "<img alt=\"{userBio}\">"],
              ["JS string",       "\\xHH escape + JSON.stringify",   "<script>let n='{userBio}'</script>"],
              ["URL parameter",   "encodeURIComponent",               "<a href=\"/p?q={userBio}\">"]
            ]
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// VULNERABLE — innerHTML parses the string as HTML, including <script>\ncomment.innerHTML = userInput;   // payload  <img src=x onerror=alert(1)>  fires\n\n// FIXED #1 — textContent treats input as text, never as markup\ncomment.textContent = userInput;  // safe in HTML-body context, period\n\n// FIXED #2 — React auto-escapes by default in JSX expressions\nfunction Comment({ body }) {\n  return <div>{body}</div>;       // body is text; <script>…</script> renders as &lt;script&gt;\n}\n// Escape hatches reintroduce the bug:\n// <div dangerouslySetInnerHTML={{ __html: body }} />  // ← audit every use\n\n// FIXED #3 — DOM-based XSS: never feed user data through innerHTML/eval\nconst q = new URL(location.href).searchParams.get('q');  // attacker-controlled\nresults.textContent = `Searched for: ${q}`;  // textContent, not innerHTML\n"
          },
          {
            "type": "p",
            "text": "**Content Security Policy is defense in depth, not the fix.** A strict CSP (`script-src 'self' 'nonce-...'`) blocks inline scripts and unknown origins so a missed encoding doesn't become RCE. But CSP without output encoding is a checklist item — encoding without CSP still leaves you exposed to CSP-bypass tricks like dangling-markup injection."
          }
        ]
      },
      {
        "heading": "Hardening checklist",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Default-escape templating (React, Vue, Jinja autoescape on)",
              "Strict CSP with nonce-based script-src and no 'unsafe-inline'",
              "HttpOnly + Secure cookies so XSS can't steal the session token",
              "Trusted Types in Chrome to block dangerous DOM sinks at the platform level"
            ],
            "watch": [
              "dangerouslySetInnerHTML / v-html / |safe used as 'easy fix' for a rendering bug",
              "Blocklisting <script> — `<img onerror=>`, `<svg onload=>`, `javascript:` URIs all work",
              "Treating sanitization libraries as fire-and-forget — keep DOMPurify on a current version",
              "Allowing user-controlled CSS — `expression()` is gone, but data-exfil via background-image isn't"
            ]
          },
          {
            "type": "quote",
            "text": "Don't sanitize input. Encode output. The same string is safe in one context and a payload in another.",
            "cite": "the OWASP encoding mantra"
          }
        ]
      }
    ]
  },
  "sec-csrf": {
    "sections": [
      {
        "heading": "Why your browser is too helpful",
        "body": [
          {
            "type": "p",
            "text": "**CSRF exploits the browser's habit of attaching your cookies to every request, even ones triggered by other sites.** Evil.com posts a hidden form to your-bank.com/transfer; if the bank only checks the session cookie, the transfer goes through under your identity. The attacker never sees the response — they don't need to. The side effect already happened."
          },
          {
            "type": "p",
            "text": "**SameSite cookies mostly killed classic CSRF in 2020.** Chrome defaulted cookies to `SameSite=Lax`, meaning the cookie isn't attached on cross-site POSTs. Most apps quietly stopped being vulnerable. But it's back: mobile apps using cookies for hybrid web views, custom protocols, and any app explicitly setting `SameSite=None; Secure` for third-party embeds."
          }
        ]
      },
      {
        "heading": "SameSite values + the synchronizer token pattern",
        "body": [
          {
            "type": "diagram",
            "title": "Cross-site POST",
            "height": 220,
            "nodes": [
              { "id": "victim",   "label": "victim",   "subtitle": "BANK SESSION", "accent": "water", "x": 0.30, "y": 0.25 },
              { "id": "evil",     "label": "evil.com", "subtitle": "HIDDEN FORM",  "accent": "fire",  "x": 0.70, "y": 0.25 },
              { "id": "browser",  "label": "browser",  "subtitle": "SENDS COOKIE", "accent": "sky",   "x": 0.30, "y": 0.75 },
              { "id": "bank",     "label": "bank.com", "subtitle": "ACCEPTS REQ",  "accent": "amber", "x": 0.70, "y": 0.75 }
            ],
            "edges": [
              { "from": "victim",  "to": "evil",    "kind": "dashed", "label": "visit" },
              { "from": "evil",    "to": "browser", "kind": "dashed", "label": "submit" },
              { "from": "browser", "to": "bank",    "kind": "dashed", "label": "POST" }
            ]
          },
          {
            "type": "table",
            "headers": [
              "SameSite value",
              "Cross-site cookies?",
              "Use when"
            ],
            "rows": [
              ["Strict", "Never sent across origins",       "Banking, admin — break top-level nav from external links"],
              ["Lax",    "Only on top-level GET navigation","Default — covers 99% of apps without UX pain"],
              ["None",   "Sent on every cross-site request","Third-party embeds; MUST set Secure + add CSRF tokens"],
              ["(unset)","Browser-default to Lax (Chrome)", "Legacy code path; never rely on the default — be explicit"]
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# VULNERABLE — cookie auth, no SameSite, no CSRF token\n@app.post(\"/transfer\")\ndef transfer_bad(amount: int, to: str, user: User = Depends(cookie_session)):\n    db.transfer(user.id, to, amount)  # POSTed from evil.com runs as the user\n    return {\"ok\": True}\n\n# FIXED — SameSite=Lax cookie + synchronizer token pattern\n@app.post(\"/login\")\ndef login_good(creds: Creds, response: Response):\n    sid = new_session(creds)\n    csrf = secrets.token_urlsafe(32)               # unpredictable, per-session\n    response.set_cookie(\"sid\",  sid,  httponly=True, secure=True, samesite=\"lax\")\n    response.set_cookie(\"csrf\", csrf, httponly=False, secure=True, samesite=\"lax\")\n    return {\"csrfToken\": csrf}                     # SPA reads it for the header\n\n@app.post(\"/transfer\")\ndef transfer_good(req: Request, body: TransferBody, user: User = Depends(cookie_session)):\n    header_token = req.headers.get(\"x-csrf-token\")\n    cookie_token = req.cookies.get(\"csrf\")\n    if not header_token or not secrets.compare_digest(header_token, cookie_token or \"\"):\n        raise HTTPException(403, \"csrf token mismatch\")  # double-submit pattern\n    db.transfer(user.id, body.to, body.amount)\n"
          },
          {
            "type": "p",
            "text": "**Token bearer auth sidesteps CSRF entirely.** Browsers don't auto-attach `Authorization: Bearer ...` to cross-site requests — they only attach cookies. SPAs that store the JWT in memory (not a cookie) and send it via header are immune to classic CSRF, in exchange for accepting the XSS-steals-the-token risk."
          }
        ]
      },
      {
        "heading": "What still bites you",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Setting SameSite=Lax explicitly on every session cookie",
              "Double-submit cookie pattern for SameSite=None scenarios",
              "Requiring CSRF tokens on every state-changing endpoint, not just /transfer",
              "Re-prompting for credentials on truly sensitive actions (delete account, change email)"
            ],
            "watch": [
              "GET endpoints with side effects — SameSite=Lax allows GETs across sites",
              "Login CSRF — attacker forces you to log in as them, then watches what you type",
              "Mobile web views that ignore SameSite (older WKWebView, embedded SDK browsers)",
              "Believing CORS protects you — CORS gates reading responses, not making requests"
            ]
          },
          {
            "type": "quote",
            "text": "CORS controls who reads the response. SameSite controls who sends the request. Confuse them and you ship the bug.",
            "cite": "the cross-origin distinction"
          }
        ]
      }
    ]
  },
  "sec-ssrf": {
    "sections": [
      {
        "heading": "Your image fetcher is a backdoor",
        "body": [
          {
            "type": "p",
            "text": "**SSRF turns a server endpoint that fetches URLs into a portal to your internal network.** User uploads a profile picture by URL? You just gave them `curl` from inside your VPC. The attacker submits `http://169.254.169.254/latest/meta-data/iam/security-credentials/` and your EC2 metadata service hands back IAM credentials. Capital One's 2019 breach (106M records) was exactly this — SSRF in a WAF reached the metadata endpoint and stole an admin role."
          },
          {
            "type": "p",
            "text": "**Anywhere your server fetches a user-supplied URL is suspect.** Webhook delivery, OG-tag preview, PDF rendering, image proxy, SAML metadata, RSS importer, license-server callback. The attacker doesn't need creative payloads — they need a hostname that resolves to something internal."
          }
        ]
      },
      {
        "heading": "Allowlist, allowlist, allowlist",
        "body": [
          {
            "type": "walkthrough",
            "title": "Metadata theft via SSRF",
            "why": "This exact chain was Capital One 2019 — 106M records. The server fetched a URL it should never have been allowed to reach.",
            "height": 230,
            "nodes": [
              { "id": "attacker", "label": "attacker", "subtitle": "SUPPLIES URL",     "accent": "fire",  "x": 0.08, "y": 0.5 },
              { "id": "app",      "label": "app",      "subtitle": "FETCHES BLINDLY",  "accent": "amber", "x": 0.36, "y": 0.5 },
              { "id": "imds",     "label": "169.254...","subtitle": "EC2 METADATA",    "accent": "earth", "x": 0.36, "y": 0.85 },
              { "id": "iam",      "label": "IAM",      "subtitle": "RETURNS CREDS",    "accent": "sky",   "x": 0.92, "y": 0.85 }
            ],
            "steps": [
              {
                "title": "Attacker supplies a URL",
                "description": "A URL field — image proxy, webhook, OG-preview — accepts user input. The attacker submits `http://169.254.169.254/...` instead of a normal link.",
                "activeNodes": ["attacker"],
                "activeEdges": []
              },
              {
                "title": "App fetches it blindly",
                "description": "The server does `requests.get(url)` with no allowlist and no IP check. It is now making a request *from inside your VPC* on the attacker's behalf.",
                "activeNodes": ["attacker", "app"],
                "activeEdges": [{ "from": "attacker", "to": "app", "label": "url=..." }]
              },
              {
                "title": "Request hits the metadata service",
                "description": "`169.254.169.254` is the link-local EC2 metadata endpoint — reachable only from the instance itself. From the open internet it's invisible; from your app it's one GET away.",
                "activeNodes": ["app", "imds"],
                "activeEdges": [{ "from": "app", "to": "imds", "label": "GET" }]
              },
              {
                "title": "IAM credentials come back",
                "description": "The metadata service hands back the instance role's temporary IAM credentials, which flow right back to the attacker. The cloud-side fix is IMDSv2 + `hop-limit=1`; the code-side fix is to resolve and validate the IP before connecting.",
                "activeNodes": ["imds", "iam"],
                "activeEdges": [{ "from": "imds", "to": "iam", "label": "creds" }]
              }
            ]
          },
          {
            "type": "table",
            "headers": [
              "Defense",
              "What it stops",
              "Caveat"
            ],
            "rows": [
              ["Allowlist of hostnames",         "All unknown internal targets",        "Hard for user-generated URLs"],
              ["Block RFC1918 + 169.254/16",     "Naive internal pivots",                "DNS rebinding bypasses on second resolve"],
              ["Resolve once + use the IP",      "DNS rebinding attacks",                "Breaks vhosted public APIs"],
              ["IMDSv2 (session-token required)", "Metadata theft even with SSRF",       "Must enforce hop-limit = 1 on instances"]
            ]
          },
          {
            "type": "p",
            "text": "**The anti-pattern** — any user-supplied URL is fetched. `169.254.169.254` returns IAM creds straight to the attacker."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# VULNERABLE — fetches any URL the user supplies\n@app.post(\"/preview\")\ndef preview_bad(url: str):\n    r = requests.get(url, timeout=5)   # attacker supplies 169.254.169.254/... \n    return {\"html\": r.text[:1000]}     # may leak IAM creds in the response"
          },
          {
            "type": "p",
            "text": "**The fix** — block obvious schemes, resolve once, refuse internal IPs, then connect to the resolved IP directly to defeat DNS-rebinding."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# FIXED — resolve once, validate the resolved IP, then connect to that IP\nimport ipaddress, socket, urllib.parse\nALLOWED_SCHEMES = {\"http\", \"https\"}\nDENY_NETS = [ipaddress.ip_network(n) for n in (\n    \"10.0.0.0/8\", \"172.16.0.0/12\", \"192.168.0.0/16\",  # RFC1918\n    \"127.0.0.0/8\", \"169.254.0.0/16\",                   # loopback + link-local (IMDS)\n    \"::1/128\", \"fc00::/7\",                              # IPv6 equivalents\n)]\n\ndef safe_fetch(url: str) -> requests.Response:\n    parts = urllib.parse.urlparse(url)\n    if parts.scheme not in ALLOWED_SCHEMES:           # no file:// , gopher:// , etc.\n        raise ValueError(\"scheme not allowed\")\n    addrs = socket.getaddrinfo(parts.hostname, None)   # resolve once, NOW\n    ip = ipaddress.ip_address(addrs[0][4][0])\n    if any(ip in net for net in DENY_NETS):            # block internal targets\n        raise ValueError(\"internal address forbidden\")\n    # Connect to the resolved IP directly to defeat DNS-rebinding races\n    return requests.get(f\"{parts.scheme}://{ip}{parts.path}\",\n                        headers={\"Host\": parts.hostname},  # SNI / vhost still works\n                        allow_redirects=False,             # follow manually + re-check each hop\n                        timeout=5)\n"
          },
          {
            "type": "p",
            "text": "**IMDSv2 is the cloud-side hard fix on AWS.** It requires a session token obtained via PUT before any GET works, and the token has a hop-limit so it can't traverse a forwarding proxy. Set `HttpTokens=required` + `HttpPutResponseHopLimit=1` on every instance — even if SSRF lands, the metadata endpoint refuses to talk."
          }
        ]
      },
      {
        "heading": "Don't forget redirects and DNS",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Hostname allowlist when the use-case allows (webhook to known partners)",
              "Disabling HTTP redirects in the fetcher OR re-validating every hop",
              "Egress firewall from the app subnet — drop outbound to 169.254.0.0/16",
              "IMDSv2 + hop-limit=1 on every AWS instance, no exceptions"
            ],
            "watch": [
              "DNS rebinding — first lookup returns 1.2.3.4, second returns 169.254.169.254",
              "Decimal IP encodings (`http://2852039166/`) and IPv6-mapped IPv4 (`::ffff:169.254...`)",
              "Following redirects without re-running the allowlist on the new target",
              "Trusting the URL parser — `http://attacker.com#@169.254.169.254/` confuses naive code"
            ]
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Test whether an EC2 instance enforces IMDSv2. The unauthenticated v1 call should fail; v2 requires a session token first.",
            "starter": "# IMDSv1 — should return 401 if v2 is enforced\ncurl -sS -o /dev/null -w '%{http_code}\\n' \\\n  http://169.254.169.254/latest/meta-data/\n\n# IMDSv2 — PUT to get a token, then GET with it\nTOKEN=$(curl -sS -X PUT \\\n  -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' \\\n  http://169.254.169.254/latest/api/token)\n\ncurl -sS -H \"X-aws-ec2-metadata-token: $TOKEN\" \\\n  http://169.254.169.254/latest/meta-data/iam/security-credentials/\n",
            "hint": "If the first curl returns 200, IMDSv1 is still on — fix it via `aws ec2 modify-instance-metadata-options --http-tokens required --http-put-response-hop-limit 1`. A code-level SSRF can no longer steal creds even if it reaches the metadata IP."
          },
          {
            "type": "quote",
            "text": "Every URL field is a network connection waiting to happen. Treat it like a firewall rule, not a string.",
            "cite": "the SSRF first principle"
          }
        ]
      }
    ]
  },
  "sec-secure-coding": {
    "sections": [
      {
        "heading": "Four patterns, one mindset",
        "body": [
          {
            "type": "p",
            "text": "**Secure coding isn't a checklist — it's four habits you apply at every layer.** Validate input at the boundary (parse, don't sanitize). Encode output at render (per-context, not globally). Default to least privilege (the code, the DB user, the IAM role). Fail closed (errors deny by default — never open a door because the lock is unsure)."
          },
          {
            "type": "p",
            "text": "**'Never trust user input' is famous and incomplete.** Don't trust *any* input — internal services lie too. The order service receives a `total_cents` from the cart service? Re-derive it. The webhook handler trusts the signed payload? Verify the signature, replay-window, AND that the event references rows you own. Trust boundaries are concentric, not binary."
          }
        ]
      },
      {
        "heading": "Parse, don't sanitize — and other rules",
        "body": [
          {
            "type": "diagram",
            "title": "Trust boundaries",
            "height": 240,
            "nodes": [
              { "id": "edge",  "label": "edge",      "subtitle": "VALIDATE",   "accent": "sky",   "x": 0.30, "y": 0.32 },
              { "id": "app",   "label": "app logic", "subtitle": "TYPED MODEL", "accent": "amber", "x": 0.70, "y": 0.32 },
              { "id": "data",  "label": "data layer","subtitle": "PARAM ONLY",  "accent": "earth", "x": 0.30, "y": 0.68 },
              { "id": "render","label": "render",    "subtitle": "ENCODE",     "accent": "water", "x": 0.70, "y": 0.68 }
            ],
            "edges": [
              { "from": "edge",  "to": "app",   "kind": "dashed", "label": "validated" },
              { "from": "app",   "to": "data",  "kind": "dashed", "label": "typed" },
              { "from": "app",   "to": "render","kind": "dashed", "label": "encode" }
            ]
          },
          {
            "type": "table",
            "headers": [
              "Pattern",
              "Anti-pattern",
              "Why it wins"
            ],
            "rows": [
              ["Parse, don't sanitize", "Strip bad chars, hope for the best",  "Validation has a type — sanitization has a vibe"],
              ["Allowlist over blocklist","Block <script>",                    "Attackers are creative; allowlists are finite"],
              ["Fail closed",            "if error: return ok",                "Open-on-error is how breaches escape detection"],
              ["Least privilege",        "App runs as DB owner",               "Bug → CRUD, not bug → DROP TABLE"]
            ]
          },
          {
            "type": "p",
            "text": "**The anti-pattern** — string sanitization + fail-open. The caller thinks the save succeeded; nothing surfaces the silent loss."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# ANTI-PATTERN — string sanitization, fail-open default, ambient privilege\ndef accept_email_bad(raw: str):\n    cleaned = raw.replace(\"<\", \"\").replace(\">\", \"\")  # blocklist; missed many chars\n    try:\n        save(cleaned)\n    except Exception:\n        return {\"ok\": True}  # fail OPEN — caller thinks the save succeeded"
          },
          {
            "type": "p",
            "text": "**The pattern** — parse into a typed model, fail closed, hand the handler narrow sessions instead of an ambient connection."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# PATTERN — parse into a typed model, fail closed, narrow privilege\nfrom pydantic import BaseModel, EmailStr, constr\n\nclass NewUser(BaseModel):                              # parse into a domain type\n    email: EmailStr                                    # validator REJECTS invalid input\n    display: constr(min_length=1, max_length=64)       # bounded, typed\n\ndef accept_email_good(raw_json: dict, db_user_readonly_session, db_user_write_session):\n    user = NewUser(**raw_json)                         # parse: ValidationError → 422\n    if db_user_readonly_session.email_exists(user.email):  # least-priv read\n        return {\"ok\": False, \"reason\": \"taken\"}        # explicit deny, not a silent pass\n    db_user_write_session.insert(user)                 # narrow write session\n    return {\"ok\": True}"
          },
          {
            "type": "p",
            "text": "**Output encoding is destination-aware** — the right escaper depends on whether the value lands in HTML, a `<script>` block, or a URL."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Output encoding — destination-aware\nimport html, json, urllib.parse\nhtml.escape(user.display)              # for <div>{x}</div>\njson.dumps(user.display)               # for <script>let x = {x}</script>\nurllib.parse.quote(user.display, safe=\"\")  # for href=\"/u/{x}\"\n"
          },
          {
            "type": "p",
            "text": "**Fail closed has a UX cost — pay it.** The 'show a friendly success even if save failed' pattern is the breach pattern. Errors must propagate. Loud failures get fixed; silent ones become regulatory headlines."
          }
        ]
      },
      {
        "heading": "Make it the default, not the heroic exception",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Typed parsers at every boundary (Pydantic, Zod, serde) — illegal states unrepresentable",
              "Linters that fail the build on raw SQL, eval, innerHTML, child_process w/ shell=true",
              "Defaults that are secure — HTTPS-only, HttpOnly cookies, samesite=lax, CSP on",
              "Threat modeling per feature — written down before the PR, re-read after"
            ],
            "watch": [
              "Sanitization functions named clean_*() that strip a few characters and call it safe",
              "'Internal traffic is trusted' — east-west compromise is how lateral movement works",
              "Catching Exception broadly and swallowing — every except hides at least one bug",
              "Running services as root or with the DB owner account — 'just to make migrations easier'"
            ]
          },
          {
            "type": "quote",
            "text": "Trust nothing. Validate at the edge, encode at the render, and let the layers in between work on typed data.",
            "cite": "the secure-by-default rule"
          }
        ]
      }
    ]
  },
  "sec-dependency-vulns": {
    "sections": [
      {
        "heading": "Your code is 3% yours",
        "body": [
          {
            "type": "p",
            "text": "**A typical Node app pulls 1,500+ packages from npm; a Python app pulls 200+ from PyPI. You wrote maybe 3% of the bytes that ship to production.** Every one of those packages is a vendor relationship you never signed. The 2021 ua-parser-js compromise, the 2018 event-stream coin-stealer, the 2024 xz-utils backdoor caught five weeks before reaching distros — supply-chain attacks aren't theoretical."
          },
          {
            "type": "p",
            "text": "**The transitive dep is the real problem.** You audited `express`. Did you audit `body-parser`? Its `qs` dep? `qs`'s update from last week? `npm ls` shows the tree; a typical project's tree is bigger than the codebase it ships."
          }
        ]
      },
      {
        "heading": "Lockfiles, hashes, and SBOMs",
        "body": [
          {
            "type": "walkthrough",
            "title": "Supply-chain pipeline",
            "why": "Each stage pins down a moving part — without the lockfile, tomorrow's build pulls different bytes than today's.",
            "height": 230,
            "nodes": [
              { "id": "registry","label": "registry","subtitle": "NPM · PYPI",       "accent": "earth", "x": 0.30, "y": 0.25 },
              { "id": "lock",    "label": "lockfile","subtitle": "PIN + HASH",       "accent": "amber", "x": 0.70, "y": 0.25 },
              { "id": "scan",    "label": "scanner", "subtitle": "TRIVY · SNYK",     "accent": "sky",   "x": 0.30, "y": 0.75 },
              { "id": "deploy",  "label": "deploy",  "subtitle": "SBOM ATTACHED",    "accent": "water", "x": 0.70, "y": 0.75 }
            ],
            "steps": [
              {
                "title": "Pull from the registry",
                "description": "Your build starts at npm or PyPI — thousands of packages, most of them transitive deps you never chose directly.",
                "activeNodes": ["registry"],
                "activeEdges": []
              },
              {
                "title": "Resolve into a lockfile",
                "description": "The lockfile pins every package to one exact version **and** its SHA hash. `npm ci` then installs that graph byte-for-byte and fails the build if a hash doesn't match.",
                "activeNodes": ["registry", "lock"],
                "activeEdges": [{ "from": "registry", "to": "lock", "label": "resolve" }]
              },
              {
                "title": "Scan against known CVEs",
                "description": "A scanner (Trivy, Snyk, `npm audit`) checks the pinned graph against the CVE feeds. Gate CI on high/critical so a known-vulnerable dep can't ship.",
                "activeNodes": ["lock", "scan"],
                "activeEdges": [{ "from": "lock", "to": "scan", "label": "verify" }]
              },
              {
                "title": "Deploy with an SBOM attached",
                "description": "Ship the artifact with a generated SBOM (CycloneDX/SPDX) — the queryable bill of materials. When the next CVE drops, you answer *'are we affected?'* in seconds instead of days.",
                "activeNodes": ["scan", "deploy"],
                "activeEdges": [{ "from": "scan", "to": "deploy", "label": "attest" }]
              }
            ]
          },
          {
            "type": "table",
            "headers": [
              "Tool",
              "Catches",
              "Run when"
            ],
            "rows": [
              ["npm audit / pip-audit", "Known CVEs vs lockfile",          "Every CI build + nightly cron"],
              ["Trivy / Grype",         "OS + lang deps + container layers", "On every image build"],
              ["Snyk / Dependabot",     "PRs to bump vulnerable packages",  "Always-on bot, auto-merge patch bumps"],
              ["SBOM (CycloneDX/SPDX)", "What you actually shipped",        "Generated per release, kept queryable"]
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# VULNERABLE — `latest` floats, no lockfile, no integrity check\nnpm install express react axios       # gets whatever was latest at this exact moment\n# Tomorrow's build pulls different bytes — supply-chain attack window opens here\n\n# FIXED — lockfile committed, integrity hashes verified, audit gates CI\nnpm ci                                # installs EXACTLY what package-lock.json pins\n                                       # fails the build if hashes don't match registry\nnpm audit --audit-level=high          # exit-code 1 on high/critical CVEs\nnpm outdated                          # surface drift — review weekly, not after a breach\n\n# Generate an SBOM you can grep when the next CVE drops\nnpx @cyclonedx/cyclonedx-npm --output-file sbom.json\n# Later: \"are we vulnerable to CVE-2024-XXXX?\"  ->  jq over the SBOM in seconds\n\n# Python equivalent — pip-tools + hashes\npip-compile --generate-hashes requirements.in    # pins + sha256 per package\npip install --require-hashes -r requirements.txt # refuses any unhashed install\npip-audit                                         # CVE check, exit-code in CI\n"
          },
          {
            "type": "p",
            "text": "**Pin transitively, not just at the top level.** `package.json` says `express ^4.18.0`; that caret means 'anything 4.x.x compatible'. The lockfile resolves it to a single version and SHA — that's what `npm ci` enforces. Without the lockfile, every developer machine + CI runner installs slightly different graphs."
          }
        ]
      },
      {
        "heading": "When (not if) a CVE lands",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Lockfiles + `npm ci` / `pip install --require-hashes` in every CI pipeline",
              "SBOM per release, stored alongside the artifact, queryable in <1 minute",
              "Automated PRs for patch bumps; humans review minor/major + transitive impact",
              "A documented runbook: 'CVE-X dropped — find affected services in 10 minutes'"
            ],
            "watch": [
              "Pinning only direct deps — the transitive tree drifts and reintroduces CVEs",
              "Lockfiles you never refresh — pinned + stale = pinned to the known-vulnerable",
              "Auto-merging major version bumps — that's how you ship a breaking change at 3am",
              "Trusting `latest` tags on Docker base images — pin to a digest, audit on rebuild"
            ]
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Audit a Node project for known vulnerabilities, see only high/critical, and find which top-level dep brings in a transitive offender.",
            "starter": "# 1. Install exactly what the lockfile says — fails on hash mismatch\nnpm ci\n\n# 2. Audit and gate CI on anything high/critical\nnpm audit --audit-level=high --omit=dev\n\n# 3. When a CVE hits a transitive dep, find the path:\nnpm ls vulnerable-package-name\n# example output:\n# my-app@1.0.0\n# └─┬ express@4.18.0\n#   └─┬ body-parser@1.20.0\n#     └── vulnerable-package-name@1.2.3\n\n# 4. Force-bump just the transitive via overrides in package.json:\n#   \"overrides\": { \"vulnerable-package-name\": \"^1.2.4\" }\n",
            "hint": "`npm ls <pkg>` is the missing manual for transitive triage — it prints the dependency path so you know whether to bump express, body-parser, or pin via the `overrides` field. `pip` users get the same answer from `pipdeptree --reverse --packages <pkg>`."
          },
          {
            "type": "quote",
            "text": "You don't write 1500 packages of code. You auditing 1500 vendors. Treat your lockfile like a contract.",
            "cite": "the supply-chain rule"
          }
        ]
      }
    ]
  },
  "sec-iam-hardening": {
    "sections": [
      {
        "heading": "Wildcards are how clouds get owned",
        "body": [
          {
            "type": "p",
            "text": "**Most cloud breaches aren't zero-days — they're an over-permissioned role attached to a server that got popped.** Capital One 2019: a misconfigured WAF + an IAM role with `s3:*` on every bucket. The intruder didn't break crypto; they listed buckets and walked out with 100M records."
          },
          {
            "type": "p",
            "text": "**The mental model is deny-by-default, allow-the-minimum.** Every `Action: \"*\"` and every `Resource: \"*\"` is a future incident waiting on a single compromised credential. Scope to the specific verb on the specific ARN, or assume you're wide open."
          }
        ]
      },
      {
        "heading": "Least privilege as a workflow",
        "body": [
          {
            "type": "diagram",
            "title": "Identity to action chain",
            "subtitle": "PRINCIPAL · POLICY · RESOURCE",
            "height": 240,
            "nodes": [
              { "id": "user",   "label": "Principal",    "subtitle": "USER+ROLE",  "accent": "water", "x": 0.25, "y": 0.25 },
              { "id": "policy", "label": "IAM policy",   "subtitle": "ALLOW/DENY", "accent": "amber", "x": 0.75, "y": 0.25 },
              { "id": "audit",  "label": "Access Analyzer", "subtitle": "UNUSED",  "accent": "sky",   "x": 0.25, "y": 0.75 },
              { "id": "data",   "label": "Resource",     "subtitle": "S3+RDS",     "accent": "earth", "x": 0.75, "y": 0.75 }
            ],
            "edges": [
              { "from": "user",   "to": "policy", "kind": "dashed", "label": "assume" },
              { "from": "policy", "to": "audit",  "kind": "dashed", "label": "log" },
              { "from": "audit",  "to": "policy", "kind": "dashed", "label": "trim",   "curve": -0.4 },
              { "from": "policy", "to": "data",   "kind": "solid",  "label": "allow" }
            ]
          },
          {
            "type": "table",
            "headers": ["Pattern", "Looks like", "Risk"],
            "rows": [
              ["Wildcard action",   "`s3:*` on `*`",                   "Total bucket takeover on one leak"],
              ["Scoped role",       "`s3:GetObject` on one prefix",    "Blast radius = one prefix"],
              ["Service account",   "Attached to a pod / VM",          "Stolen if the workload is breached"],
              ["AssumeRole + MFA",  "Human assumes role for a session", "Session expires, MFA gates abuse"]
            ]
          },
          {
            "type": "p",
            "text": "**The anti-pattern first** — one leaked key on this policy and an attacker has every bucket in the account."
          },
          {
            "type": "code",
            "lang": "json",
            "text": "// DANGEROUS — wildcard action, wildcard resource\n// One leaked key = full account read/write across every bucket\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Action\": \"s3:*\",\n    \"Resource\": \"*\"\n  }]\n}"
          },
          {
            "type": "p",
            "text": "**The hardened version** — exact verbs, exact ARNs, conditions that scope to one VPC endpoint over TLS, and an explicit deny that survives future Allows."
          },
          {
            "type": "code",
            "lang": "json",
            "text": "// HARDENED — single verb, single ARN, deny-by-default everywhere else\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"ReadOneBucketPrefix\",\n      \"Effect\": \"Allow\",\n      \"Action\": [\"s3:GetObject\", \"s3:ListBucket\"],   // only the verbs the app needs\n      \"Resource\": [\n        \"arn:aws:s3:::reports-prod\",                   // bucket itself for ListBucket\n        \"arn:aws:s3:::reports-prod/exports/*\"          // scoped prefix for GetObject\n      ],\n      \"Condition\": {\n        \"StringEquals\": { \"aws:SourceVpce\": \"vpce-0abc123\" },  // only from our VPC endpoint\n        \"Bool\":         { \"aws:SecureTransport\": \"true\" }       // TLS required, never plaintext\n      }\n    },\n    {\n      \"Sid\": \"DenyEverythingElseInS3\",                          // explicit deny beats any future Allow\n      \"Effect\": \"Deny\",\n      \"NotAction\": [\"s3:GetObject\", \"s3:ListBucket\"],\n      \"Resource\": \"arn:aws:s3:::reports-prod*\"\n    }\n  ]\n}\n"
          }
        ]
      },
      {
        "heading": "Trim what isn't being used",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "IAM Access Advisor + Access Analyzer reviewed monthly to delete unused permissions",
              "Roles per workload, not one shared `app-role` everyone attaches to",
              "Conditions: SourceVpce, MFA, SecureTransport, IP allowlist on admin paths",
              "Short-lived credentials (STS, OIDC) over long-lived access keys — always"
            ],
            "watch": [
              "`*` in Action OR Resource — the two most common breach root-causes",
              "`PassRole` to `*` — lets a low-priv role escalate to any role in the account",
              "Inline policies sprawl — managed policies are reviewable and revocable in one place",
              "Service accounts shared across environments — prod gets popped, dev gets popped"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Tighten this policy: scope to one bucket prefix, drop the wildcard verb, and add a TLS-only condition.",
            "starter": "// Before — too broad to ship to prod\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Action\": \"s3:*\",\n    \"Resource\": \"arn:aws:s3:::reports-prod\"\n  }]\n}\n\n// After — fill in the blanks:\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Action\": [\"s3:GetObject\", \"s3:ListBucket\"],\n    \"Resource\": [\n      \"arn:aws:s3:::reports-prod\",\n      \"arn:aws:s3:::reports-prod/exports/*\"\n    ],\n    \"Condition\": {\n      \"Bool\": { \"aws:SecureTransport\": \"true\" }\n    }\n  }]\n}\n",
            "hint": "Two wins: list specific verbs instead of `s3:*`, and gate with `aws:SecureTransport=true` so plaintext requests are rejected even if someone forgets the `https://` prefix. Run `aws accessanalyzer list-findings` next to surface what's still over-scoped."
          },
          {
            "type": "quote",
            "text": "Every wildcard is a future post-mortem. Scope the action, scope the resource, then scope the condition.",
            "cite": "the least-privilege rule"
          }
        ]
      }
    ]
  },
  "sec-kms-encryption": {
    "sections": [
      {
        "heading": "Envelope encryption, in one diagram",
        "body": [
          {
            "type": "p",
            "text": "**\"Encrypted at rest\" is a checkbox; envelope encryption is the actual design.** A data key (DEK) encrypts the bytes; a key-encryption key (KEK) inside KMS encrypts the DEK. Two layers means you can rotate KEKs without re-encrypting petabytes — you re-wrap one small DEK and the data is safe again."
          },
          {
            "type": "p",
            "text": "**The KEK never leaves KMS.** Your app gets a plaintext DEK for milliseconds, encrypts the payload, then keeps only the ciphertext + the *encrypted* DEK. To decrypt later you ask KMS to unwrap — and that call is logged, gated by IAM, and revocable."
          },
          {
            "type": "diagram",
            "title": "DEK + KEK flow",
            "subtitle": "PLAINTEXT · DEK · KEK · STORE",
            "height": 250,
            "nodes": [
              { "id": "app",  "label": "App",          "subtitle": "STORES",     "accent": "water", "x": 0.30, "y": 0.3 },
              { "id": "kms",  "label": "KMS (KEK)",    "subtitle": "ROOT KEY",   "accent": "amber", "x": 0.70, "y": 0.3 },
              { "id": "dek",  "label": "Data key",     "subtitle": "ONE-TIME",   "accent": "amber", "x": 0.30, "y": 0.7 },
              { "id": "store","label": "Object store", "subtitle": "CT + WDEK",  "accent": "earth", "x": 0.70, "y": 0.7 }
            ],
            "edges": [
              { "from": "app",   "to": "kms",   "kind": "dashed", "label": "GenDataKey" },
              { "from": "kms",   "to": "dek",   "kind": "solid",  "label": "wraps" },
              { "from": "dek",   "to": "store", "kind": "solid",  "label": "encrypts" },
              { "from": "store", "to": "kms",   "kind": "dashed", "label": "Decrypt", "curve": -0.5 }
            ]
          }
        ]
      },
      {
        "heading": "Key policies vs IAM, CMK vs default",
        "body": [
          {
            "type": "table",
            "headers": ["Choice", "Default", "Customer-managed (CMK)"],
            "rows": [
              ["Who can use it",  "Anyone in your account",   "Only principals in the key policy"],
              ["Rotation",        "Automatic, 1y, no audit",  "Manual or yearly, full audit trail"],
              ["Cross-account",   "Not possible",             "Via key-policy grant"],
              ["BYOK / external", "Not supported",            "Import your own material, hold the master"]
            ]
          },
          {
            "type": "p",
            "text": "**The key + its policy** — two statements: root keeps admin (escape hatch), and the app role gets scoped use only via S3."
          },
          {
            "type": "code",
            "lang": "hcl",
            "text": "# Terraform — customer-managed KMS key with a key policy you actually own\nresource \"aws_kms_key\" \"reports\" {\n  description             = \"Encrypts the reports-prod S3 bucket\"\n  deletion_window_in_days = 30                # buffer in case you delete it by mistake\n  enable_key_rotation     = true              # AWS rotates the backing material yearly\n  multi_region            = false             # set true only if you actually need replicas\n\n  # The key POLICY is separate from IAM — both must allow for a request to succeed\n  policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [\n      {\n        # 1) Root account keeps admin so you can never lock yourself out\n        Sid       = \"RootAdmin\"\n        Effect    = \"Allow\"\n        Principal = { AWS = \"arn:aws:iam::${data.aws_caller_identity.me.account_id}:root\" }\n        Action    = \"kms:*\"\n        Resource  = \"*\"\n      },\n      {\n        # 2) Only the reports app role can encrypt / decrypt — scoped via ViaService\n        Sid       = \"AppRoleUseKey\"\n        Effect    = \"Allow\"\n        Principal = { AWS = aws_iam_role.reports_app.arn }\n        Action    = [\"kms:Encrypt\", \"kms:Decrypt\", \"kms:GenerateDataKey\"]\n        Resource  = \"*\"\n        Condition = {\n          StringEquals = { \"kms:ViaService\" = \"s3.us-east-1.amazonaws.com\" }  # only via S3, not direct\n        }\n      }\n    ]\n  })\n}"
          },
          {
            "type": "p",
            "text": "**An alias** decouples your code from the auto-generated key ID — recreate the key, point the alias at the new one, app code keeps working."
          },
          {
            "type": "code",
            "lang": "hcl",
            "text": "resource \"aws_kms_alias\" \"reports\" {\n  name          = \"alias/reports-prod\"   # human-readable name; ARN of the key changes if recreated\n  target_key_id = aws_kms_key.reports.key_id\n}\n"
          },
          {
            "type": "p",
            "text": "**Key policies are not IAM policies.** A key policy gates the key itself; IAM gates the principal. **Both must allow** for a call to succeed — this is why \"my role has `kms:*`\" still fails when the key policy doesn't list you."
          }
        ]
      },
      {
        "heading": "Rotation, BYOK, and what encryption doesn't fix",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Customer-managed keys per workload — separate blast radius per service",
              "Annual KMS rotation on + DEKs rotated per object — math beats time",
              "`kms:ViaService` + `aws:SourceVpce` conditions to lock the key to one service path",
              "CloudTrail on every KMS call — anomalous decrypt volumes are the canary"
            ],
            "watch": [
              "Encryption-at-rest does NOT stop someone who already has `s3:GetObject` — they get plaintext",
              "BYOK / HYOK adds an op burden — you now own key-material backups, not AWS",
              "Default service keys: shared, unrotatable on your schedule, untraceable per workload",
              "Deleting a key with a 7-day window — recover-or-lose-data deadline is unforgiving"
            ]
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Create a customer-managed key, encrypt a small payload, decrypt it back — and verify the audit log.",
            "starter": "# 1. Create a KMS key with rotation enabled\naws kms create-key \\\n  --description \"demo CMK\" \\\n  --key-usage ENCRYPT_DECRYPT \\\n  --origin AWS_KMS\n# capture KeyId from the output\n\naws kms enable-key-rotation --key-id <KeyId>\n\n# 2. Encrypt a secret — KMS returns ciphertext you can store anywhere\naws kms encrypt \\\n  --key-id alias/reports-prod \\\n  --plaintext fileb://payload.txt \\\n  --output text --query CiphertextBlob | base64 -d > payload.enc\n\n# 3. Decrypt — IAM + key policy must both allow\naws kms decrypt \\\n  --ciphertext-blob fileb://payload.enc \\\n  --output text --query Plaintext | base64 -d\n\n# 4. Verify the decrypt was logged — CloudTrail records the principal, key, time\naws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=EventName,AttributeValue=Decrypt\n",
            "hint": "If decrypt fails with `AccessDenied`, the loop is: IAM role allows `kms:Decrypt`? Key policy lists the role? `kms:ViaService` condition matched? All three are AND-gated. CloudTrail is where you debug the third one."
          },
          {
            "type": "quote",
            "text": "Encryption at rest protects against a stolen disk. It doesn't protect against a stolen credential — that's IAM's job.",
            "cite": "the envelope-encryption truth"
          }
        ]
      }
    ]
  },
  "sec-vpc-security": {
    "sections": [
      {
        "heading": "Two firewalls, two jobs",
        "body": [
          {
            "type": "p",
            "text": "**A VPC is your private network in someone else's data center.** Inside it, two firewalls run side by side: security groups (instance-level, stateful, allow-only) and NACLs (subnet-level, stateless, allow + deny). New engineers mix them up and end up with a network that's either wide open or accidentally bricked."
          },
          {
            "type": "p",
            "text": "**Defense in depth: public subnet → ALB only, private subnets → app + DB, no public IPs.** The pattern is so common it's the default Terraform reference. The mistake is putting an RDS in a public subnet with `0.0.0.0/0:5432` open — that's how leaks happen weekly on Shodan."
          }
        ]
      },
      {
        "heading": "Security groups vs NACLs",
        "body": [
          {
            "type": "table",
            "headers": ["Property",       "Security group",          "NACL"],
            "rows": [
              ["Scope",                   "Per ENI / instance",       "Per subnet"],
              ["Stateful?",               "Yes — return traffic auto", "No — open both directions"],
              ["Rules",                   "Allow only",               "Allow AND deny"],
              ["Evaluated",               "All rules, any match",     "In rule-number order, first match wins"]
            ]
          },
          {
            "type": "diagram",
            "title": "Default-deny VPC layout",
            "subtitle": "EDGE · PUBLIC · PRIVATE · DATA",
            "height": 270,
            "nodes": [
              { "id": "net",    "label": "Internet",     "subtitle": "USER TRAFFIC",      "accent": "sky",   "x": 0.30, "y": 0.2 },
              { "id": "alb",    "label": "ALB",          "subtitle": "PUBLIC SUBNET",     "accent": "sky",   "x": 0.70, "y": 0.2 },
              { "id": "app",    "label": "App tier",     "subtitle": "PRIVATE SUBNET",    "accent": "amber", "x": 0.30, "y": 0.5 },
              { "id": "db",     "label": "RDS",          "subtitle": "DATA SUBNET",       "accent": "earth", "x": 0.70, "y": 0.5 },
              { "id": "vpce",   "label": "VPC endpoint", "subtitle": "S3 · KMS PRIVATE",  "accent": "water", "x": 0.50, "y": 0.8 }
            ],
            "edges": [
              { "from": "net", "to": "alb", "kind": "dashed", "label": "443" },
              { "from": "alb", "to": "app", "kind": "solid",  "label": "8080" },
              { "from": "app", "to": "db",  "kind": "solid",  "label": "5432" },
              { "from": "app", "to": "vpce","kind": "dashed", "label": "no NAT", "curve": 0.4 }
            ]
          },
          {
            "type": "p",
            "text": "Three chained security groups — public ingress stops at the ALB; each tier can only talk to the next via SG reference, never CIDR."
          },
          {
            "type": "code",
            "lang": "hcl",
            "text": "# ALB — the only public-facing SG, and only on 443\nresource \"aws_security_group\" \"alb\" {\n  name   = \"alb-sg\"\n  vpc_id = aws_vpc.main.id\n\n  ingress {\n    from_port   = 443\n    to_port     = 443\n    protocol    = \"tcp\"\n    cidr_blocks = [\"0.0.0.0/0\"]   # public — but ONLY on 443, ONLY on the ALB\n  }\n  egress {\n    from_port       = 0\n    to_port         = 0\n    protocol        = \"-1\"\n    security_groups = [aws_security_group.app.id]   # ALB can only talk to the app SG\n  }\n}"
          },
          {
            "type": "code",
            "lang": "hcl",
            "text": "# App tier — only accepts traffic from the ALB SG, only emits to the DB SG\nresource \"aws_security_group\" \"app\" {\n  name   = \"app-sg\"\n  vpc_id = aws_vpc.main.id\n\n  ingress {\n    from_port       = 8080\n    to_port         = 8080\n    protocol        = \"tcp\"\n    security_groups = [aws_security_group.alb.id]   # ONLY from ALB — no public ingress\n  }\n  egress {\n    from_port       = 5432\n    to_port         = 5432\n    protocol        = \"tcp\"\n    security_groups = [aws_security_group.db.id]    # ONLY to the DB SG on Postgres port\n  }\n}"
          },
          {
            "type": "code",
            "lang": "hcl",
            "text": "# DB — accepts from app SG only, never speaks to the internet\nresource \"aws_security_group\" \"db\" {\n  name   = \"db-sg\"\n  vpc_id = aws_vpc.main.id\n\n  ingress {\n    from_port       = 5432\n    to_port         = 5432\n    protocol        = \"tcp\"\n    security_groups = [aws_security_group.app.id]   # the DB never speaks to the internet\n  }\n  # no egress block on purpose — Terraform default is allow-all; flip to explicit if your org requires\n}\n"
          }
        ]
      },
      {
        "heading": "Egress filtering and VPC endpoints",
        "body": [
          {
            "type": "p",
            "text": "**Ingress gets all the attention; egress is where data leaves.** A compromised app with `0.0.0.0/0` egress can ship your DB straight to attacker-controlled S3. Filter outbound to known destinations (your S3 bucket, your KMS endpoint, your APM) and exfil paths shrink dramatically."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Three-tier subnets: public ALB, private app, private data — no DB in a public subnet, ever",
              "Security groups chained by ID (alb→app→db), never CIDR-by-CIDR — auto-tracks IP changes",
              "VPC endpoints (S3, KMS, DynamoDB) — traffic stays on the AWS backbone, never the internet",
              "VPC Flow Logs to a SIEM — you cannot investigate what you didn't log"
            ],
            "watch": [
              "`0.0.0.0/0` ingress on any port other than 80/443 on the ALB — almost always wrong",
              "`0.0.0.0/0` egress from app subnets — exfil + crypto-mining channel",
              "Stateful SG + stateless NACL confusion — return traffic mysteriously dropped",
              "Default VPC use in production — accept the 30-minute cost of building a proper one"
            ]
          },
          {
            "type": "quote",
            "text": "An open security group is the cloud equivalent of a server in the lobby. Chain the SGs by ID, filter egress, and put the data tier behind two walls.",
            "cite": "the default-deny mantra"
          },
          {
            "type": "explain-back",
            "prompt": "You've seen **security groups vs NACLs** (stateful vs stateless), the **three-tier default-deny layout** (public ALB → private app → private data), **egress filtering**, and **VPC endpoints**. Design the network so a public web app can reach its database and S3 *without* exposing the DB or giving a compromised app a path to exfiltrate data — and name the trade-off egress filtering forces on your team.",
            "modelAnswer": "Put each tier in its own subnet: the **ALB** in a public subnet (the only thing with `0.0.0.0/0` ingress, and only on 443), the **app** in a private subnet, the **RDS** in a private data subnet with no route to the internet at all. Wire the **security groups by reference, not CIDR** — the app SG allows ingress only from the ALB's SG, the DB SG allows 5432 only from the app's SG — so as instances scale and IPs churn, the rules track automatically and the DB is reachable *only* through the app tier (two walls). Because SGs are **stateful**, return traffic is automatic; I keep **NACLs** as a coarse stateless backstop at the subnet edge and stay alert to the stateful/stateless mismatch that silently drops return packets. For S3 and KMS I add **VPC endpoints** so that traffic rides the AWS backbone and never the public internet — which also lets me clamp **egress**: the app SG allows outbound only to the DB and those endpoints, so a compromised app can't ship the database to attacker-controlled S3 (it also kills crypto-mining call-homes). Flow Logs to a SIEM make all of it investigable. The **trade-off** egress filtering forces: every new outbound dependency — a third-party API, a new package mirror, a metrics vendor — now needs an explicit allow, so it adds friction and the occasional baffling timeout when someone forgets. I accept it because default-deny egress fails *closed and visible* rather than leaving an open exfil channel; the win is that the blast radius of a compromised app shrinks to 'can talk to its own DB and nothing else'.",
            "hint": "The two walls in front of the DB come from chaining SGs by ID (ALB→app→DB). The exfil defense and the trade-off both live in egress: what does locking outbound to 'DB + VPC endpoints only' cost the next engineer who adds a new external dependency?"
          }
        ]
      }
    ]
  },
  "sec-vault-rotation": {
    "sections": [
      {
        "heading": "Secrets don't belong in code",
        "body": [
          {
            "type": "p",
            "text": "**Secret-as-code is the anti-pattern: any string in a repo is forever, even after a force-push.** GitGuardian found 12M secrets leaked publicly to GitHub in 2023 alone. The fix isn't a `.gitignore` — it's a vault that holds the secret, an IAM role that fetches it at boot, and rotation that makes any leak short-lived."
          },
          {
            "type": "p",
            "text": "**Static secrets are weeks; dynamic secrets are minutes.** Vault and Secrets Manager can issue per-request DB credentials that expire automatically — a leak in a log file becomes useless before anyone reads the log."
          }
        ]
      },
      {
        "heading": "The rotation loop",
        "body": [
          {
            "type": "diagram",
            "title": "Vault-issued rotation",
            "subtitle": "WORKLOAD · VAULT · DB · LEASE",
            "height": 250,
            "nodes": [
              { "id": "pod",   "label": "Workload",    "subtitle": "POD · LAMBDA",   "accent": "water", "x": 0.10, "y": 0.5 },
              { "id": "auth",  "label": "Vault auth",  "subtitle": "OIDC · IRSA",    "accent": "amber", "x": 0.32, "y": 0.5 },
              { "id": "vault", "label": "Vault",       "subtitle": "ISSUES LEASE",   "accent": "earth", "x": 0.32, "y": 0.85 },
              { "id": "db",    "label": "Database",    "subtitle": "TTL CREDS",      "accent": "earth", "x": 0.86, "y": 0.85 }
            ],
            "edges": [
              { "from": "pod",   "to": "auth",  "kind": "dashed", "label": "login" },
              { "from": "auth",  "to": "vault", "kind": "solid",  "label": "token" },
              { "from": "vault", "to": "db",    "kind": "dashed", "label": "create user" },
              { "from": "vault", "to": "pod",   "kind": "solid",  "label": "lease",  "curve": -0.5 }
            ]
          },
          {
            "type": "table",
            "headers": ["Tool",                "Strength",                  "Best for"],
            "rows": [
              ["HashiCorp Vault",              "Dynamic secrets, multi-cloud", "Cross-cloud + on-prem"],
              ["AWS Secrets Manager",          "Native AWS rotation Lambda",   "Pure-AWS shops"],
              ["GCP Secret Manager",           "Versioned, IAM-gated",         "Pure-GCP shops"],
              ["Azure Key Vault / sealed-secrets", "HSM-backed / GitOps-safe", "Azure + k8s GitOps"]
            ]
          },
          {
            "type": "p",
            "text": "**The `SealedSecret`** — ciphertext-only, safe to commit. Only the in-cluster controller has the private key to decrypt it."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# sealed-secrets (Bitnami) — the encrypted-in-git pattern for k8s\n# 1) cluster runs a sealed-secrets controller with a private key\n# 2) you encrypt a Secret with `kubeseal` using the controller's public key\n# 3) commit the SealedSecret YAML to git — only the cluster can decrypt it\napiVersion: bitnami.com/v1alpha1\nkind: SealedSecret               # safe to commit; ciphertext only\nmetadata:\n  name: db-credentials\n  namespace: reports-prod\nspec:\n  encryptedData:\n    # base64(ciphertext) — public-key encrypted, ONLY the in-cluster controller can read\n    DATABASE_URL: AgB7K9j4qF...truncated...  # rotates whenever Vault issues a new lease\n    JWT_SIGNING_KEY: AgC2x...truncated...    # never appears in plaintext outside the cluster\n  template:\n    metadata:\n      name: db-credentials       # the resulting Secret name pods reference via envFrom\n      namespace: reports-prod\n    type: Opaque"
          },
          {
            "type": "p",
            "text": "**Consume the unsealed Secret** via `envFrom` — no plaintext appears in this YAML or in `kubectl describe`."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "---\n# In your Deployment — consume the unsealed Secret as env vars\napiVersion: apps/v1\nkind: Deployment\nmetadata: { name: reports-api, namespace: reports-prod }\nspec:\n  template:\n    spec:\n      containers:\n        - name: api\n          image: ghcr.io/acme/reports-api:1.4.2\n          envFrom:\n            - secretRef: { name: db-credentials }   # k8s decrypts + injects at pod start\n          # NOTE: no secret value ever appears in this YAML or in `kubectl describe`\n"
          }
        ]
      },
      {
        "heading": "Rotation playbook and pitfalls",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Dynamic DB / cloud creds with TTLs measured in minutes, not months",
              "Workload identity (IRSA, GKE Workload Identity, Azure WI) — no static creds at all",
              "Automatic rotation Lambdas with a tested rollback path BEFORE prod cutover",
              "A 'leaked secret' runbook drilled quarterly — measured in minutes to revocation"
            ],
            "watch": [
              "`AWS_ACCESS_KEY_ID=AKIA...` in env files committed to git — assume it's already leaked",
              "Manual rotation that breaks the running app — staged deploy + version-aware client first",
              "Sealed-secrets without backing up the controller's private key — lose key, lose secrets",
              "Vault as a single point of failure with no HA + no disaster-recovery rehearsal"
            ]
          },
          {
            "type": "practice",
            "lang": "yaml",
            "prompt": "Convert this plaintext k8s Secret into a SealedSecret you can safely commit to git.",
            "starter": "# DANGER — never commit this. Plaintext base64 is plaintext.\napiVersion: v1\nkind: Secret\nmetadata:\n  name: db-credentials\n  namespace: reports-prod\ntype: Opaque\ndata:\n  DATABASE_URL: cG9zdGdyZXM6Ly9hZG1pbjpoMzN6QGRiOjU0MzI=     # postgres://admin:h33z@db:5432\n  JWT_SIGNING_KEY: c3VwZXJfc2VjcmV0X2RvX25vdF9zaGFyZQ==      # super_secret_do_not_share\n\n# Pipeline to encrypt with the in-cluster controller's public key:\n#   kubectl create secret generic db-credentials \\\n#     --from-literal=DATABASE_URL='postgres://admin:h33z@db:5432' \\\n#     --from-literal=JWT_SIGNING_KEY='super_secret_do_not_share' \\\n#     --dry-run=client -o yaml | kubeseal -o yaml > db-credentials.sealed.yaml\n#\n# The output SealedSecret is what you commit; the original Secret never lands in git.\n",
            "hint": "Two rules: (1) the original `kind: Secret` never gets committed — only the `kind: SealedSecret` output of `kubeseal`. (2) Back up the controller's private key offline. Lose that key and every sealed secret in every cluster becomes unrecoverable ciphertext."
          },
          {
            "type": "quote",
            "text": "Static secrets rot. Dynamic secrets expire. Either way, your job is to make sure the leaked one is already useless.",
            "cite": "the rotation principle"
          }
        ]
      }
    ]
  },
  "sec-supply-chain": {
    "sections": [
      {
        "heading": "When the vendor is the attacker",
        "body": [
          {
            "type": "p",
            "text": "**SolarWinds (2020): a signed update from a trusted vendor ran malicious code in 18,000 customers including the US Treasury.** Codecov (2021): the CI uploader script was modified; every customer's CI env-vars exfiltrated for two months. xz-utils (2024): a multi-year social-engineering campaign nearly shipped a sshd backdoor into every Linux distro. The vendor *is* the threat model now."
          },
          {
            "type": "p",
            "text": "**You don't ship your code — you ship the transitive closure of every dependency.** The defense isn't \"trust the vendor\"; it's prove every artifact's provenance, sign every step, and detect the bytes you didn't author."
          }
        ]
      },
      {
        "heading": "SBOM, SLSA, and signed artifacts",
        "body": [
          {
            "type": "diagram",
            "title": "Provenance pipeline",
            "subtitle": "SOURCE · BUILD · SIGN · VERIFY",
            "height": 250,
            "nodes": [
              { "id": "src",   "label": "Source",       "subtitle": "SIGNED COMMITS", "accent": "water", "x": 0.30, "y": 0.25 },
              { "id": "build", "label": "Build",        "subtitle": "SLSA L3 RUNNER", "accent": "amber", "x": 0.70, "y": 0.25 },
              { "id": "sign",  "label": "Cosign",       "subtitle": "KEYLESS OIDC",   "accent": "amber", "x": 0.30, "y": 0.6 },
              { "id": "reg",   "label": "Registry",     "subtitle": "IMAGE + SBOM",   "accent": "earth", "x": 0.70, "y": 0.6 },
              { "id": "atk",   "label": "Attacker",     "subtitle": "INSERTS BACKDOOR","accent": "fire",  "x": 0.30, "y": 0.92 }
            ],
            "edges": [
              { "from": "src",   "to": "build", "kind": "dashed", "label": "trigger" },
              { "from": "build", "to": "sign",  "kind": "solid",  "label": "attest" },
              { "from": "sign",  "to": "reg",   "kind": "solid",  "label": "publish" },
              { "from": "atk",   "to": "build", "kind": "dashed", "label": "blocked", "curve": -0.3 }
            ]
          },
          {
            "type": "table",
            "headers": ["Control",   "What it proves",              "Real breach it would have caught"],
            "rows": [
              ["SBOM (CycloneDX/SPDX)", "Exactly what's inside the artifact", "Log4Shell triage: who ships log4j 2.14?"],
              ["SLSA L3 build",         "Build ran in a hardened, isolated runner", "SolarWinds — modified build, no provenance"],
              ["Cosign signature",      "Image was signed by the build identity",   "Codecov — modified uploader, unsigned"],
              ["Signed commits",        "Source author identity verified",          "xz-utils — anonymous maintainer takeover"]
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# Generate an SBOM for the image you just built — Syft reads layers + lockfiles\nsyft ghcr.io/acme/reports-api:1.4.2 \\\n  -o cyclonedx-json=sbom.json   # CycloneDX is the most widely consumed SBOM format\n\n# Sign the image keylessly with cosign — uses your CI OIDC identity, no long-lived key\ncosign sign \\\n  --identity-token \"$ACTIONS_ID_TOKEN_REQUEST_TOKEN\" \\\n  ghcr.io/acme/reports-api:1.4.2\n  # the signature lands next to the image in the registry, public + auditable\n\n# Attach the SBOM as an in-toto attestation — provenance that follows the artifact\ncosign attest \\\n  --predicate sbom.json \\\n  --type cyclonedx \\\n  ghcr.io/acme/reports-api:1.4.2\n\n# At admission time, the cluster VERIFIES the signature came from your GH org\ncosign verify \\\n  --certificate-identity-regexp 'https://github.com/acme/.*' \\\n  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\\n  ghcr.io/acme/reports-api:1.4.2\n  # If verify fails, the pod NEVER STARTS — supply-chain breaches blocked at runtime\n\n# When CVE-2024-XXXX drops, query every SBOM you ever produced:\ngrype sbom:./sbom.json --fail-on high   # exit-code 1 on high/critical — gates the deploy\n"
          }
        ]
      },
      {
        "heading": "Trust nothing, verify everything",
        "body": [
          {
            "type": "p",
            "text": "**Defense in depth for supply chain: signed commits in, SLSA-compliant build, signed images out, admission-controller verifies on the way in.** Each step is one extra control the attacker has to defeat. SolarWinds defeated zero of these; Codecov defeated zero of these — because none of them were in place."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "SBOM per build, stored alongside the artifact, queryable in <60 seconds when a CVE drops",
              "Cosign keyless signing via OIDC — short-lived certs, no long-lived signing key to steal",
              "Admission controllers (Kyverno / Sigstore policy) blocking unsigned images cluster-wide",
              "SLSA L3 builds on isolated, ephemeral runners — no shared state between builds"
            ],
            "watch": [
              "Trusting `latest` tags — pin to digests (`@sha256:...`); tags can be re-pointed silently",
              "Self-hosted CI runners with persistent state — exactly how Codecov got modified",
              "Maintainer takeover risk — a single-maintainer dep is a single point of compromise",
              "SBOMs you never query — generating them is step 1; alerting on them is the win"
            ]
          },
          {
            "type": "quote",
            "text": "Your vendors are now your attack surface. Sign every commit, attest every build, verify every image — and assume the next xz-utils is already in your tree.",
            "cite": "the post-SolarWinds rule"
          }
        ]
      }
    ]
  },
  "sec-https-deep": {
    "sections": [
      {
        "heading": "The magic trick: a shared secret nobody sent",
        "body": [
          {
            "type": "p",
            "text": "**Every HTTPS connection ends with the browser and the server holding the same symmetric key — and that key never crossed the wire.** A wiretap that captures every byte still can't derive it. That's the magic of the TLS handshake: a few public exchanges, some elliptic-curve math, and both sides independently compute an identical secret."
          },
          {
            "type": "p",
            "text": "**Three jobs get done in one handshake:** prove the server is who it claims (certificate), agree on a fresh session key (ECDHE), and pick the cipher suite. TLS 1.3 collapses what TLS 1.2 needed two round trips for — saving ~100ms on every cold connection at the edge."
          }
        ]
      },
      {
        "heading": "Handshake: who says what, and when",
        "body": [
          {
            "type": "sequence",
            "title": "TLS 1.3 handshake — over the wire",
            "caption": "One RTT total. Cert verification is a local lookup; CA is never contacted live.",
            "actors": [
              { "id": "browser", "label": "Browser", "accent": "water" },
              { "id": "server",  "label": "Server",  "accent": "fire" },
              { "id": "ca",      "label": "CA root", "accent": "sky" }
            ],
            "events": [
              { "from": "browser", "to": "server", "label": "ClientHello",        "note": "ciphers + key share + SNI" },
              { "from": "server",  "to": "browser","label": "ServerHello + cert", "note": "cert chain signed by CA" },
              { "from": "browser", "to": "ca",     "label": "Verify chain",       "note": "local trust store",      "dashed": true },
              { "self": "browser", "label": "Derive session key",                 "note": "ECDHE — both sides match", "dashed": true },
              { "from": "browser", "to": "server", "label": "Finished + app data","note": "AEAD-encrypted from here" },
              { "from": "server",  "to": "browser","label": "Encrypted response" }
            ]
          },
          {
            "type": "walkthrough",
            "title": "Same flow, step by step",
            "caption": "Walk the six events in order. Notice that nothing secret ever leaves either machine.",
            "nodes": [
              { "id": "browser", "label": "Browser", "subtitle": "CLIENT",      "accent": "water", "x": 0.12, "y": 0.5 },
              { "id": "server",  "label": "Server",  "subtitle": "TLS ENDPOINT", "accent": "fire",  "x": 0.88, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "1 · ClientHello",
                "description": "Browser sends supported TLS versions, a list of cipher suites it can speak, and an ephemeral ECDHE public key share. SNI (the hostname) is in the clear — a wiretap still sees which site you're visiting.",
                "activeNodes": ["browser", "server"],
                "activeEdges": [{ "from": "browser", "to": "server", "label": "hello + share" }]
              },
              {
                "title": "2 · ServerHello + certificate",
                "description": "Server picks one cipher (e.g. TLS_AES_128_GCM_SHA256), sends back its own ephemeral key share, and attaches its X.509 certificate chain — signed all the way up to a CA root.",
                "activeNodes": ["server", "browser"],
                "activeEdges": [{ "from": "server", "to": "browser", "label": "cert + share" }]
              },
              {
                "title": "3 · Verify the certificate",
                "description": "Browser walks the chain to a trusted CA in its local root store, checks the cert's CN/SAN matches the hostname, checks notBefore/notAfter, and queries OCSP-stapled status. No live CA call.",
                "activeNodes": ["browser"],
                "activeEdges": []
              },
              {
                "title": "4 · ECDHE — derive shared secret",
                "description": "Both sides combine their own private key with the other's public share. The math (ECDH on Curve25519) produces the same number on both ends. An eavesdropper has both public shares but neither private key, so they can't compute it.",
                "activeNodes": ["browser", "server"],
                "activeEdges": []
              },
              {
                "title": "5 · Finished",
                "description": "Both sides run the key schedule, derive symmetric AEAD keys, and exchange a Finished message HMAC'd with those keys. If one side computed a different secret, the HMAC fails and the connection aborts.",
                "activeNodes": ["browser", "server"],
                "activeEdges": [{ "from": "browser", "to": "server", "label": "finished" }]
              },
              {
                "title": "6 · Application data",
                "description": "Every byte from here is AES-GCM (or ChaCha20-Poly1305) encrypted with the session key. Forward secrecy: the ephemeral keys are discarded, so even if the server's long-term key leaks tomorrow, today's traffic stays sealed.",
                "activeNodes": ["browser", "server"],
                "activeEdges": [
                  { "from": "browser", "to": "server", "label": "encrypted" },
                  { "from": "server",  "to": "browser","label": "encrypted" }
                ]
              }
            ]
          }
        ]
      },
      {
        "heading": "TLS 1.3 vs 1.2 — and what an attacker can still see",
        "body": [
          {
            "type": "table",
            "headers": [
              "Aspect",
              "TLS 1.2",
              "TLS 1.3"
            ],
            "rows": [
              ["Handshake RTTs",      "2 round trips (full)",        "1 RTT — 0-RTT for resumption"],
              ["Key exchange",        "RSA or DHE/ECDHE optional",   "ECDHE only — forward secrecy mandatory"],
              ["Cipher suites",       "~37 negotiable, many weak",   "5 AEAD suites, all strong"],
              ["Encrypted handshake", "Cert sent in cleartext",      "Cert + extensions encrypted after ServerHello"]
            ]
          },
          {
            "type": "p",
            "text": "**What a passive attacker actually sees: the SNI hostname, the destination IP, byte counts, and timing.** Everything else — URLs, headers, cookies, body — is sealed. ECH (Encrypted Client Hello) is rolling out to hide SNI too, but it's not yet universal."
          },
          {
            "type": "p",
            "text": "**HPKP (HTTP Public Key Pinning) died in 2020.** It let sites pin specific cert public keys, but one rotation mistake bricked the site for months. Chrome killed it; the replacement is Certificate Transparency logs plus Expect-CT — same protection without the suicide pact."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "TLS 1.3 everywhere — disable 1.0, 1.1, and ideally 1.2 for new deployments",
              "Short-lived certs from Let's Encrypt / ACME — 90-day rotation is automatic, painless",
              "OCSP stapling so the browser doesn't have to phone the CA mid-handshake",
              "HSTS preload list — first-visit downgrade attacks become impossible"
            ],
            "watch": [
              "Mixed content — one http:// image on an https:// page leaks cookies in some browsers",
              "Wildcard certs sprawled across services — one private-key leak compromises all of them",
              "Self-signed certs in prod 'just to test' — users learn to click through warnings",
              "TLS termination at the LB with plaintext to backends — your internal network is now in-scope"
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Inspecting a live TLS handshake from Python — what the server actually negotiated\nimport socket, ssl\n\nctx = ssl.create_default_context()  # uses the OS trust store + sane defaults\nctx.minimum_version = ssl.TLSVersion.TLSv1_3  # refuse anything older\n\nwith socket.create_connection((\"example.com\", 443)) as raw:\n    with ctx.wrap_socket(raw, server_hostname=\"example.com\") as tls:  # SNI here\n        print(\"version :\", tls.version())          # 'TLSv1.3' if it worked\n        print(\"cipher  :\", tls.cipher()[0])        # e.g. TLS_AES_128_GCM_SHA256\n        cert = tls.getpeercert()                   # already verified by ctx\n        print(\"subject :\", dict(x[0] for x in cert['subject']))\n        print(\"issuer  :\", dict(x[0] for x in cert['issuer']))\n        print(\"expires :\", cert['notAfter'])       # rotate well before this date\n        tls.sendall(b\"GET / HTTP/1.1\\r\\nHost: example.com\\r\\nConnection: close\\r\\n\\r\\n\")\n        print(tls.recv(256).decode(errors=\"replace\")[:120])  # encrypted on the wire\n"
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Use openssl s_client to inspect a real TLS handshake. Look for the negotiated version, the cipher, and the cert chain.",
            "starter": "# Hit a host on 443, force TLS 1.3, print and quit\nopenssl s_client -connect example.com:443 -tls1_3 -servername example.com </dev/null \\\n  | grep -E 'Protocol|Cipher|subject=|issuer=|Verify return code'\n",
            "hint": "The -servername flag sets SNI — without it, multi-tenant servers return the wrong cert. 'Verify return code: 0 (ok)' means the chain validated against your local trust store. Try -tls1_2 to see how the cipher list differs."
          },
          {
            "type": "quote",
            "text": "Nobody sent the key. Both sides computed it. That's the whole trick.",
            "cite": "the ECDHE mnemonic"
          }
        ]
      }
    ]
  },
  "sec-gdpr": {
    "sections": [
      {
        "heading": "The law that ate the internet",
        "body": [
          {
            "type": "p",
            "text": "**GDPR (Regulation 2016/679) governs anyone processing personal data of people in the EU** — your servers in Ohio don't get a pass. Fines top out at 4% of global annual revenue, and the ICO and CNIL have stopped bluffing."
          },
          {
            "type": "p",
            "text": "**'Personal data' is broader than US 'PII'.** IP addresses, cookie IDs, device fingerprints, and even pseudonymized identifiers count if they can re-identify a person. If in doubt, treat it like personal data — the regulator does."
          }
        ]
      },
      {
        "heading": "**Lawful basis** — you need one before you process",
        "body": [
          {
            "type": "p",
            "text": "**You can't collect data because it might be useful later.** Article 6 lists six lawful bases — consent, contract, legal obligation, vital interests, public task, legitimate interests — and you must pick one *up front* and document it. 'Legitimate interests' is not a free pass; it requires a balancing test (LIA) you can show on demand."
          },
          {
            "type": "p",
            "text": "**Data minimization is a hard constraint, not a vibe.** Collect only what the chosen basis justifies. Storing DOB 'in case marketing wants it' fails Article 5(1)(c). Same goes for retention: define a deletion clock per data class, and run it."
          },
          {
            "type": "table",
            "headers": ["Right (Articles 15–22)", "What the user can demand", "Response clock"],
            "rows": [
              ["Access (Art. 15)",     "A copy of all data you hold on them",           "1 month"],
              ["Rectification (16)",   "Fix wrong or stale fields",                     "1 month"],
              ["Erasure (17)",         "'Right to be forgotten' — delete + cascade",    "1 month"],
              ["Portability (20)",     "Machine-readable export (JSON/CSV)",            "1 month"]
            ]
          },
          {
            "type": "p",
            "text": "**Erasure cascades.** Deleting the user row but leaving their email in audit logs, backups, analytics warehouses, and the data lake is not erasure — it's malpractice. Plan the deletion graph during design, not during a DSAR scramble."
          }
        ]
      },
      {
        "heading": "**The 72-hour breach clock** and who owns it",
        "body": [
          {
            "type": "p",
            "text": "**Article 33: notify your supervisory authority within 72 hours of becoming aware of a personal-data breach.** Not 72 hours of confirming root cause — 72 hours of *awareness*. The clock starts when on-call sees the alert that smells like exfiltration."
          },
          {
            "type": "diagram",
            "title": "DSAR → response flow",
            "height": 240,
            "nodes": [
              { "id": "subject", "label": "data subject",  "subtitle": "USER REQUEST",  "accent": "water", "x": 0.08, "y": 0.5 },
              { "id": "intake",  "label": "DPO intake",    "subtitle": "VERIFY ID",     "accent": "amber", "x": 0.34, "y": 0.5 },
              { "id": "fulfill", "label": "fulfill",       "subtitle": "EXTRACT/DELETE","accent": "sky",   "x": 0.34, "y": 0.78 },
              { "id": "audit",   "label": "audit log",     "subtitle": "EVIDENCE",      "accent": "earth", "x": 0.92, "y": 0.78 }
            ],
            "edges": [
              { "from": "subject", "to": "intake",  "kind": "dashed", "label": "request" },
              { "from": "intake",  "to": "fulfill", "kind": "dashed", "label": "verified" },
              { "from": "fulfill", "to": "audit",   "kind": "dashed", "label": "proof" }
            ]
          },
          {
            "type": "p",
            "text": "**Data residency** is the other landmine. Schrems II killed Privacy Shield in 2020 — moving EU data to US-hosted infra now requires Standard Contractual Clauses *plus* a transfer impact assessment. Pick EU regions for EU customers and you skip the lawyer bill."
          },
          {
            "type": "p",
            "text": "**A DPO (Data Protection Officer) is mandatory if you do large-scale monitoring or process special-category data.** They report to the board, not to engineering — independence is the point. CCPA/CPRA is the US analogue: similar shape, narrower scope, $7,500 per intentional violation."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Per-field data classification at the schema level — public / internal / personal / special",
              "Automated retention jobs that delete on a clock, not when someone remembers",
              "A documented lawful basis stored next to every processing activity (ROPA)",
              "Tabletop the 72-hour breach drill before you need it for real"
            ],
            "watch": [
              "Cookie banners that 'reject all' isn't actually wired up — €390M Meta fine territory",
              "Backups that retain deleted users for 7 years — erasure becomes a paperwork lie",
              "Shipping EU data to a US vendor without SCCs + TIA — Schrems II compliance gap",
              "Treating IP addresses as 'not PII' — every EU regulator disagrees"
            ]
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# data-classification.yaml — drives retention, access control, and DSAR cascade\nversion: 2  # bumped when a column moves classes\ntables:\n  users:\n    classification: personal  # GDPR Article 4(1)\n    lawful_basis: contract    # we can't deliver the service without it\n    retention_days: 1095      # 3y after account closure, then hard-delete\n    fields:\n      email:        { class: personal,         dsar: export+erase }  # both rights apply\n      ip_last_seen: { class: personal,         dsar: export+erase }  # yes, IPs count\n      ssn:          { class: special,          dsar: export+erase, encryption: kms }  # Art. 9 + KMS\n      marketing_opt_in: { class: personal,     dsar: export+erase, lawful_basis: consent }  # withdrawable\n  audit_log:\n    classification: personal  # contains user IDs\n    lawful_basis: legal_obligation  # we MUST keep these (SOX/ISO)\n    retention_days: 2555      # 7y — overrides erasure (Art. 17(3)(b))\n    immutable: true           # erasure cannot tamper with evidence\n"
          },
          {
            "type": "practice",
            "lang": "yaml",
            "prompt": "Add a `payments` table to this classification config. PAN must be marked special-category, encrypted, retained per PCI (no more than necessary), and a DSAR export must redact the PAN to last-4 only.",
            "starter": "tables:\n  payments:\n    classification: ?     # PAN is sensitive — which class?\n    lawful_basis: ?       # processing the transaction\n    retention_days: ?     # PCI says keep only what you need\n    fields:\n      pan:        { class: ?, dsar: ?, encryption: ? }\n      last4:      { class: ?, dsar: export }\n      amount:     { class: internal, dsar: export }\n",
            "hint": "PAN → class: special, encryption: kms, dsar: export+erase BUT with redaction transform → last4 only. Retention ~ 730 days (2y) keeps audit ability without hoarding. Lawful basis: contract."
          },
          {
            "type": "quote",
            "text": "If you can't draw the deletion graph in 5 minutes, you can't honor an erasure request in 30 days.",
            "cite": "the GDPR design lemma"
          }
        ]
      }
    ]
  },
  "sec-soc2": {
    "sections": [
      {
        "heading": "The trust report every B2B buyer asks for",
        "body": [
          {
            "type": "p",
            "text": "**SOC 2 is an AICPA attestation, not a law and not a certification.** A licensed CPA firm (Deloitte, EY, A-LIGN, Prescient Assurance) audits your controls and issues a report your customers can read. No SOC 2 report, no enterprise deal — that's the market reality."
          },
          {
            "type": "p",
            "text": "**It proves you said what you'd do and did what you said.** It does *not* prove your product is secure in the abstract. The auditor checks your stated controls against evidence over a period — nothing more, nothing less."
          }
        ]
      },
      {
        "heading": "**The five Trust Services Criteria** (and the four you usually skip)",
        "body": [
          {
            "type": "p",
            "text": "**Security is the only mandatory criterion** — also called the 'Common Criteria.' The other four (Availability, Processing Integrity, Confidentiality, Privacy) are optional and you only scope them in if customers demand it or your business model requires it (e.g., a financial-data pipeline scopes in Processing Integrity)."
          },
          {
            "type": "table",
            "headers": ["Trust principle", "What it proves", "Typical for"],
            "rows": [
              ["Security",             "Access controls, change mgmt, monitoring", "Everyone (mandatory)"],
              ["Availability",         "Uptime, DR, capacity, incident response",  "SaaS with SLAs"],
              ["Processing Integrity", "Data is processed completely, accurately", "Fintech, billing, ETL"],
              ["Confidentiality",      "Non-personal sensitive data protected",    "B2B with NDAs/source code"]
            ]
          },
          {
            "type": "p",
            "text": "**Privacy** is the fifth criterion and overlaps heavily with GDPR. Most teams skip it in SOC 2 and handle privacy under GDPR/CCPA directly — less double-evidencing, same outcome."
          }
        ]
      },
      {
        "heading": "**Type I vs Type II** — and the audit cycle that runs forever",
        "body": [
          {
            "type": "p",
            "text": "**Type I is a point-in-time snapshot** — 'on June 1st, these controls existed and were designed correctly.' Useful as a starter report; enterprise buyers usually demand Type II."
          },
          {
            "type": "p",
            "text": "**Type II is the real one — controls were operating effectively over a period (3, 6, or 12 months).** The auditor samples evidence from across that window. First-time Type II usually covers 3 months; renewals roll forward 12-month windows continuously."
          },
          {
            "type": "diagram",
            "title": "SOC 2 audit cycle",
            "height": 240,
            "nodes": [
              { "id": "design",  "label": "design",        "subtitle": "WRITE CONTROLS", "accent": "amber", "x": 0.08, "y": 0.5 },
              { "id": "operate", "label": "operate",       "subtitle": "RUN 3-12 MO",    "accent": "sky",   "x": 0.34, "y": 0.5 },
              { "id": "collect", "label": "evidence",      "subtitle": "GATHER PROOF",   "accent": "earth", "x": 0.30, "y": 0.9 },
              { "id": "auditor", "label": "CPA auditor",   "subtitle": "ATTEST",         "accent": "fire",  "x": 0.70, "y": 0.9 }
            ],
            "edges": [
              { "from": "design",  "to": "operate", "kind": "dashed", "label": "deploy" },
              { "from": "operate", "to": "collect", "kind": "dashed", "label": "log" },
              { "from": "collect", "to": "auditor", "kind": "dashed", "label": "submit" }
            ]
          },
          {
            "type": "p",
            "text": "**Evidence collection is where teams drown.** Every quarter the auditor wants screenshots of access reviews, change-management tickets tied to deploys, sampled MFA events, and onboarding/offboarding logs. Tools like Vanta, Drata, and Secureframe automate ~80% of the collection — you still own the remaining 20% that requires human judgment."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Control mapping that ties each TSC criterion to an actual technical control + owner",
              "Continuous compliance tooling (Vanta/Drata) wired to AWS/Okta/GitHub from day one",
              "Quarterly access reviews automated via SCIM — auditors love a clean diff",
              "Scoping tightly — only the production system handles customer data, not every laptop"
            ],
            "watch": [
              "Treating SOC 2 as a checklist instead of operating discipline — it'll show in Type II",
              "Vendor sub-service organizations (CUEC) that customers must layer on — call them out",
              "'Exceptions' in the final report — too many and buyers walk; explain each one in the bridge letter",
              "Re-auditing scope explosion as you ship features — bring the auditor in early on big changes"
            ]
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# control-matrix.yaml — single source of truth, fed to auditors + automated checks\ncontrols:\n  CC6.1:  # Trust Services Criteria number — common criteria, logical access\n    description: \"Logical access to production restricted via SSO + MFA\"  # auditor reads this\n    tsc: [security]            # which trust principle this maps to\n    owner: secops              # who explains it in the audit walkthrough\n    evidence:\n      - source: okta           # SSO IdP\n        query: \"mfa_enabled = true AND group = 'prod-admins'\"  # exact filter the auditor will re-run\n        cadence: quarterly     # how often we re-evidence\n      - source: aws-iam\n        query: \"console_login_without_mfa = 0\"  # zero tolerance\n        cadence: continuous\n  CC7.2:  # detection of anomalies\n    description: \"Security events from prod are aggregated and reviewed weekly\"\n    tsc: [security]\n    owner: secops\n    evidence:\n      - source: datadog-siem\n        query: \"saved_view = 'weekly-secops-review'\"  # link directly to the dashboard\n        cadence: weekly\n"
          },
          {
            "type": "quote",
            "text": "SOC 2 doesn't make you secure. It makes you provably consistent — and a consistent target is the easier kind to harden.",
            "cite": "the auditor's quiet truth"
          }
        ]
      }
    ]
  },
  "sec-pci-dss": {
    "sections": [
      {
        "heading": "Touch a card number, inherit a standard",
        "body": [
          {
            "type": "p",
            "text": "**PCI-DSS (Payment Card Industry Data Security Standard) is contractual, not legal** — Visa, Mastercard, Amex, Discover, and JCB enforce it via the PCI SSC and your acquiring bank. Fail an audit and your acquirer pulls your ability to take cards, which kills most online businesses overnight."
          },
          {
            "type": "p",
            "text": "**The current version is 4.0.1, mandatory March 2025.** If your environment touches a Primary Account Number (PAN), CVV, or full track data — even in memory — you're 'in scope' and you owe an annual attestation."
          }
        ]
      },
      {
        "heading": "**The 12 requirements** (grouped into 6 goals)",
        "body": [
          {
            "type": "p",
            "text": "**The 12 requirements are tedious but coherent.** Build and maintain a secure network (1-2), protect cardholder data (3-4), maintain a vulnerability program (5-6), implement strong access control (7-9), regularly monitor and test (10-11), maintain an information security policy (12). Most failures cluster on #3 (storage), #6 (secure development), and #10 (logging)."
          },
          {
            "type": "table",
            "headers": ["Merchant level", "Annual card txns", "Validation"],
            "rows": [
              ["Level 1", "> 6M",          "QSA on-site audit (ROC)"],
              ["Level 2", "1M – 6M",       "SAQ + optional QSA"],
              ["Level 3", "20K – 1M (e-com)", "SAQ self-assessment"],
              ["Level 4", "< 20K (e-com)",  "SAQ self-assessment"]
            ]
          },
          {
            "type": "p",
            "text": "**A QSA (Qualified Security Assessor) is the PCI equivalent of a SOC 2 auditor** — a credentialed individual at a firm like Coalfire, Trustwave, or Schellman who walks your environment, samples evidence, and signs the Report on Compliance (ROC). Level 1 merchants get this treatment annually."
          }
        ]
      },
      {
        "heading": "**Scope reduction** — the only sane strategy",
        "body": [
          {
            "type": "p",
            "text": "**The dirty secret of PCI is that almost everyone offloads scope to Stripe, Adyen, Braintree, or Checkout.com.** The card field is an iframe owned by the processor; PAN never touches your servers. You drop from a 200-page SAQ-D to a 22-question SAQ-A. That delta is worth millions in eng time."
          },
          {
            "type": "diagram",
            "title": "Scope: tokenized vs in-house",
            "height": 240,
            "nodes": [
              { "id": "browser", "label": "browser",        "subtitle": "CHECKOUT",   "accent": "water", "x": 0.08, "y": 0.5 },
              { "id": "iframe",  "label": "Stripe iframe",  "subtitle": "HOLDS PAN",  "accent": "amber", "x": 0.34, "y": 0.5 },
              { "id": "token",   "label": "token",          "subtitle": "OUT OF PCI", "accent": "sky",   "x": 0.34, "y": 0.88 },
              { "id": "api",     "label": "your API",       "subtitle": "TOKEN ONLY", "accent": "earth", "x": 0.92, "y": 0.88 }
            ],
            "edges": [
              { "from": "browser", "to": "iframe", "kind": "dashed", "label": "PAN" },
              { "from": "iframe",  "to": "token",  "kind": "dashed", "label": "tokenize" },
              { "from": "token",   "to": "api",    "kind": "dashed", "label": "charge" }
            ]
          },
          {
            "type": "p",
            "text": "**Tokenization replaces the PAN with a non-reversible reference.** The processor holds the real number in their PCI-compliant vault; you hold a token like `tok_1NQp2g2eZvKYlo2C`. Even if your DB leaks, the attacker gets nothing chargeable. This single design choice removes ~90% of PCI surface area."
          },
          {
            "type": "p",
            "text": "**'CVV must never be stored, ever' is the bright-line rule** — even encrypted. PAN may be stored if encrypted with proper key management (Requirement 3); CVV cannot, period. If your logs accidentally ingested a CVV, you have an incident."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Stripe Elements / Adyen Drop-in — iframe isolation reduces SAQ from D to A",
              "Network segmentation — CDE (Cardholder Data Environment) on its own VPC subnet",
              "Quarterly ASV (Approved Scanning Vendor) scans — required for Req 11.2",
              "Centralized FIM (file integrity monitoring) on the CDE — Tripwire, Wazuh, AWS Config"
            ],
            "watch": [
              "Accepting PANs into your support tooling — call recordings often capture CVV by accident",
              "Logging request bodies on the payments endpoint — instant PCI violation",
              "Storing 'just last 4 and BIN' but joining it with name + DOB — that's PAN-equivalent",
              "Letting the CDE expand silently — devs adding 'just one' service that calls the processor"
            ]
          },
          {
            "type": "code",
            "lang": "json",
            "text": "{\n  \"_comment\": \"pci-scope-manifest.json — declares which assets are in the Cardholder Data Environment\",\n  \"cde\": {\n    \"vpc\": \"vpc-cde-prod\",\n    \"subnets\": [\"subnet-cde-a\", \"subnet-cde-b\"],\n    \"services\": [\n      {\n        \"name\": \"payments-api\",\n        \"in_scope\": true,\n        \"reason\": \"forwards tokens to Stripe; no PAN at rest but transmits over TLS\",\n        \"storage\": { \"pan\": false, \"cvv\": false, \"token\": true }\n      },\n      {\n        \"name\": \"fraud-scoring\",\n        \"in_scope\": true,\n        \"reason\": \"reads BIN + last4 + amount — connected system, Req 12.8.1\"\n      }\n    ]\n  },\n  \"connected_systems\": [\n    { \"name\": \"logging-platform\", \"controls\": [\"pan-redaction-filter\", \"cvv-blocklist\"] }\n  ],\n  \"out_of_scope\": [\n    { \"name\": \"marketing-site\", \"reason\": \"no cardholder data path; verified by quarterly scope review\" }\n  ]\n}\n"
          },
          {
            "type": "quote",
            "text": "The cheapest PCI control is not touching the card. Tokenize first, audit second.",
            "cite": "every payments staff engineer ever"
          }
        ]
      }
    ]
  },
  "sec-compliance-audits": {
    "sections": [
      {
        "heading": "What auditors actually look for",
        "body": [
          {
            "type": "p",
            "text": "**Auditors don't read your code. They read your evidence.** They sample tickets, screenshots, signed log files, access-review CSVs, and onboarding records — then ask you to reproduce the query that produced them. If you can't, the control is treated as not operating."
          },
          {
            "type": "p",
            "text": "**'Auditable-by-default' is the design principle.** Every privileged action emits a structured, signed, append-only event the day the feature ships — not when the auditor asks six months later. Retrofitting audit logs after the fact is how teams blow their budget and miss their window."
          }
        ]
      },
      {
        "heading": "**Evidence chain** — what makes a log admissible",
        "body": [
          {
            "type": "p",
            "text": "**Three properties: completeness, integrity, and provenance.** Completeness means no gaps (gap detection via sequence numbers). Integrity means tamper-evident (hash chains or signing). Provenance means you can trace the event back to a specific identity and source — not 'system' or 'root.'"
          },
          {
            "type": "p",
            "text": "**Immutability is structural, not policy.** S3 Object Lock in compliance mode, Azure Immutable Blob Storage with WORM, or a hash-chained log shipped to a separate account the prod IAM role can't touch. 'We promise not to delete' isn't immutability — it's an exception waiting to be cited."
          },
          {
            "type": "table",
            "headers": ["Data class",            "Typical retention", "Driving regulation"],
            "rows": [
              ["Security audit logs",        "1 year hot, 7 years cold", "SOC 2, ISO 27001"],
              ["Financial transactions",     "7 years",                  "SOX, IRS, HMRC"],
              ["PHI access logs (HIPAA)",    "6 years",                  "HIPAA 164.316"],
              ["GDPR processing records",    "Duration of processing + 3y", "GDPR Art. 30"]
            ]
          },
          {
            "type": "p",
            "text": "**Retention is two clocks, not one: minimum (what regs require) and maximum (what GDPR/CCPA allow).** Holding security logs for 25 years 'just in case' violates data minimization. Holding them for 3 months fails SOX. The window is narrower than ops engineers think."
          }
        ]
      },
      {
        "heading": "**Pass on the first try** — the design moves that get you there",
        "body": [
          {
            "type": "diagram",
            "title": "Evidence pipeline",
            "height": 240,
            "nodes": [
              { "id": "action",  "label": "privileged action", "subtitle": "STRUCTURED","accent": "amber", "x": 0.30, "y": 0.35 },
              { "id": "sign",    "label": "sign + chain",      "subtitle": "HMAC HASH", "accent": "sky",   "x": 0.70, "y": 0.35 },
              { "id": "archive", "label": "WORM archive",      "subtitle": "S3 LOCK",   "accent": "earth", "x": 0.30, "y": 0.65 },
              { "id": "qsa",     "label": "auditor",           "subtitle": "SAMPLES",   "accent": "fire",  "x": 0.70, "y": 0.65 }
            ],
            "edges": [
              { "from": "action",  "to": "sign",    "kind": "dashed", "label": "emit" },
              { "from": "sign",    "to": "archive", "kind": "dashed", "label": "ship" },
              { "from": "archive", "to": "qsa",     "kind": "dashed", "label": "query" }
            ]
          },
          {
            "type": "p",
            "text": "**Structure your events for SQL, not for grep.** JSON with stable field names (actor, action, resource, outcome, request_id, prev_hash) lets the auditor write one query that produces a clean CSV. Free-form strings force a forensics project; structured events get rubber-stamped."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Hash-chained logs — each event includes the prev event's hash; one tampered row breaks the chain",
              "Separate AWS account for log archive — prod role has write-only access (cannot delete)",
              "Per-event request_id propagated end-to-end — auditor traces an action across services",
              "Quarterly log-restore drills — proves your retention actually works under audit pressure"
            ],
            "watch": [
              "App logs and security logs in the same bucket — different retention, different access controls",
              "'System' or shared service accounts as the actor — kills provenance",
              "Time skew between hosts — auditors notice when events are out of order across clocks",
              "Sensitive payloads inside audit events — leaks PII into a 7-year retention bucket"
            ]
          },
          {
            "type": "code",
            "lang": "json",
            "text": "{\n  \"_comment\": \"signed audit event — JSON Lines format, one per row, append-only S3\",\n  \"event_id\": \"01HZ4M2X8K3Q1V2N3B4C5D6E7F\",\n  \"ts\": \"2026-06-02T14:08:31.402Z\",\n  \"actor\": { \"type\": \"user\", \"id\": \"u_29481\", \"sso_idp\": \"okta\", \"ip\": \"203.0.113.42\" },\n  \"action\": \"iam.role.assume\",\n  \"resource\": { \"type\": \"aws_role\", \"arn\": \"arn:aws:iam::123:role/prod-readonly\" },\n  \"outcome\": \"success\",\n  \"request_id\": \"req_7c4a9b\",\n  \"prev_hash\": \"sha256:8f2a...e91c\",\n  \"hmac\": \"sha256:b1d3...a774\",\n  \"_chain_note\": \"hmac = HMAC-SHA256(secret, prev_hash || canonical_json(event_minus_hmac))\",\n  \"_retention\": \"7y — SOX-covered systems\"\n}\n"
          },
          {
            "type": "quote",
            "text": "If you can't reproduce the query that produced the evidence, you don't have evidence — you have a screenshot.",
            "cite": "the audit-survival lemma"
          }
        ]
      }
    ]
  },
  "sec-siem": {
    "sections": [
      {
        "heading": "What a SIEM actually does",
        "body": [
          {
            "type": "p",
            "text": "**A SIEM is a log lake with detection rules bolted on.** It collects events from everywhere (firewalls, EDR, cloud trails, app logs), normalizes them into a common schema, correlates across sources, and fires alerts when patterns match. Without it, you have logs in 40 places and zero ability to ask 'did this IP touch anything else?'"
          },
          {
            "type": "p",
            "text": "**The four jobs in order:** collect → normalize → correlate → alert. Each step has its own failure mode — a collector that drops 5% of events makes your detections silently useless."
          }
        ]
      },
      {
        "heading": "The pipeline",
        "body": [
          {
            "type": "walkthrough",
            "title": "SIEM event flow",
            "why": "Four stages, one failure mode each — a collector that silently drops 5% makes every detection downstream useless.",
            "subtitle": "FOUR STAGES, ONE FAILURE PER STAGE",
            "height": 310,
            "nodes": [
              { "id": "src",     "label": "log sources", "subtitle": "FW+EDR",    "accent": "sky",   "x": 0.30, "y": 0.16 },
              { "id": "norm",    "label": "normalize",   "subtitle": "SCHEMA",    "accent": "sky",   "x": 0.70, "y": 0.16 },
              { "id": "store",   "label": "index",       "subtitle": "SEARCH",    "accent": "earth", "x": 0.30, "y": 0.50 },
              { "id": "rules",   "label": "detections",  "subtitle": "RULES",     "accent": "amber", "x": 0.70, "y": 0.50 },
              { "id": "soc",     "label": "SOC analyst", "subtitle": "TRIAGE",    "accent": "water", "x": 0.50, "y": 0.84 }
            ],
            "steps": [
              {
                "title": "Collect from every source",
                "description": "Raw events stream in from firewalls, EDR, cloud trails, and app logs. **Failure mode:** a collector that drops events makes everything after it lie.",
                "activeNodes": ["src"],
                "activeEdges": []
              },
              {
                "title": "Normalize into one schema",
                "description": "Forty different log formats get parsed into common field names, so `src_ip` means the same thing everywhere. **Failure mode:** a vendor changes their format and parsing silently breaks.",
                "activeNodes": ["src", "norm"],
                "activeEdges": [{ "from": "src", "to": "norm", "label": "raw" }]
              },
              {
                "title": "Index for search",
                "description": "Parsed events land in a searchable index. Now you can finally ask *'did this IP touch anything else?'* across all sources at once.",
                "activeNodes": ["norm", "store"],
                "activeEdges": [{ "from": "norm", "to": "store", "label": "parsed" }]
              },
              {
                "title": "Correlate with detections",
                "description": "Rules run over the index looking for patterns — brute-force then a success, egress to a new ASN, a control-plane mutation. This is the *correlate* step that single logs can't do.",
                "activeNodes": ["store", "rules"],
                "activeEdges": [{ "from": "store", "to": "rules", "label": "search" }]
              },
              {
                "title": "Alert the SOC analyst",
                "description": "A matched rule fires an alert for a human to triage. **Failure mode:** alerts fire into a Slack channel everyone muted by week two — tuning is the real job.",
                "activeNodes": ["rules", "soc"],
                "activeEdges": [{ "from": "rules", "to": "soc", "label": "alert" }]
              }
            ]
          },
          {
            "type": "table",
            "headers": ["SIEM", "Sweet spot", "Pain point"],
            "rows": [
              ["Splunk",         "SPL is the gold standard for query power", "License cost scales with ingest — punishes 'log everything'"],
              ["Elastic / ELK",  "Self-host friendly, KQL + Lucene, cheap storage", "You operate it — cluster tuning is a job"],
              ["Sumo Logic",     "SaaS, easy onboard, decent SaaS connectors", "Query language is its own dialect, slower at scale"],
              ["Datadog SIEM",   "Already there if you use Datadog for o11y", "Detection library is young vs Splunk/Elastic"]
            ]
          }
        ]
      },
      {
        "heading": "Tuning is the job",
        "body": [
          {
            "type": "p",
            "text": "**The 'log everything' anti-pattern bankrupts the budget and buries the signal.** The rule that works: log what you'd grep for during an incident. Auth events, privileged actions, network egress to new ASNs, cloud control-plane mutations. Skip the heartbeat, the health-check, the 200-OK."
          },
          {
            "type": "p",
            "text": "**SIEM tuning is a full-time job, not a one-off.** Every new app ships new noise. Detections that fire on every deploy get muted, then forgotten, then exploited. Budget for an engineer whose only KPI is 'true-positive rate per rule'."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Cross-source correlation — same IP in firewall + EDR + cloud audit",
              "Compliance evidence — 'show me every admin login in Q3'",
              "Threat-hunt queries against historical data",
              "Detections-as-code in Sigma, version-controlled in Git"
            ],
            "watch": [
              "Ingest-priced SIEMs + 'log everything' = surprise seven-figure bill",
              "Detections nobody owns — alerts fire into a Slack channel everyone muted",
              "Parsing breaks silently when a vendor changes log format mid-version",
              "Mean time to triage > 30 min — your SOC is drowning, not detecting"
            ]
          },
          {
            "type": "code",
            "lang": "splunk",
            "text": "// Splunk SPL — find brute-force auth followed by a successful login from the same IP\nindex=auth sourcetype=linux_secure  // narrow the haystack first; never bare-search\n| bin _time span=5m  // 5-min buckets so we count attempts per window\n| stats count(eval(action=\"failure\")) as fails,  // how many fails in the window\n        count(eval(action=\"success\")) as wins,   // and how many wins\n        values(user) as users by src_ip, _time   // group by source IP + time bucket\n| where fails >= 10 AND wins >= 1  // classic spray-then-hit pattern\n| sort -fails  // worst offenders first\n| eval risk = case(  // simple risk score so the analyst sorts by impact\n    wins > 0 AND fails > 50, \"CRITICAL\",  // many fails AND a success = pwned\n    wins > 0, \"HIGH\",\n    true(), \"MEDIUM\")\n| table _time src_ip users fails wins risk  // SOC-friendly output\n"
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Run a CloudWatch Logs Insights query from the CLI to find failed console logins by source IP in the last 24h.",
            "starter": "# Find failed AWS console logins grouped by source IP\naws logs start-query \\\n  --log-group-name aws-cloudtrail-logs \\\n  --start-time $(date -d '24 hours ago' +%s) \\\n  --end-time   $(date +%s) \\\n  --query-string 'fields @timestamp, sourceIPAddress, userIdentity.userName\n                   | filter eventName = \"ConsoleLogin\" and errorMessage = \"Failed authentication\"\n                   | stats count(*) as fails by sourceIPAddress\n                   | sort fails desc\n                   | limit 20'\n",
            "hint": "start-query returns a queryId; poll with `aws logs get-query-results --query-id <id>` until status is Complete. The same query works against any CloudTrail log group — substitute your account's name."
          },
          {
            "type": "quote",
            "text": "Log what you'd grep for. Everything else is a bill, not a defense.",
            "cite": "the SIEM tuning rule"
          }
        ]
      }
    ]
  },
  "sec-audit-logs": {
    "sections": [
      {
        "heading": "Audit logs are evidence, not telemetry",
        "body": [
          {
            "type": "p",
            "text": "**Audit logs answer 'who did what, when, from where, to which object?'** They are not debug logs and not metrics. They exist so that, six months from now, when a regulator or a forensic team asks, you can prove what happened."
          },
          {
            "type": "p",
            "text": "**Treat every audit-log entry like a court exhibit.** If you can't prove it wasn't tampered with after the fact, it's worth nothing in an investigation. Append-only stores and signed entries aren't paranoia — they're the bar."
          }
        ]
      },
      {
        "heading": "What MUST be logged",
        "body": [
          {
            "type": "table",
            "headers": ["Category", "Examples", "Why"],
            "rows": [
              ["Authentication",     "login success/fail, MFA challenge, token refresh", "Breach reconstruction starts here"],
              ["Privilege change",   "role grant, sudo, IAM policy attach",              "Lateral-movement detection"],
              ["Data access",        "read/export of PII or PHI, S3 GetObject on sensitive prefix", "GDPR / HIPAA / PCI evidence"],
              ["Config mutation",    "security-group edit, firewall rule, KMS key policy", "Most breaches start with a misconfig"]
            ]
          },
          {
            "type": "diagram",
            "title": "Audit log path",
            "subtitle": "FROM EVENT TO EVIDENCE",
            "height": 220,
            "nodes": [
              { "id": "app",    "label": "app event",   "subtitle": "WHO+WHAT",    "accent": "sky",   "x": 0.30, "y": 0.30 },
              { "id": "sign",   "label": "sign + hash", "subtitle": "TAMPER-EVT",  "accent": "amber", "x": 0.70, "y": 0.30 },
              { "id": "wormm",  "label": "WORM store",  "subtitle": "APPEND ONLY", "accent": "earth", "x": 0.30, "y": 0.70 },
              { "id": "audit",  "label": "auditor",     "subtitle": "READS TRAIL", "accent": "water", "x": 0.70, "y": 0.70 }
            ],
            "edges": [
              { "from": "app",   "to": "sign",  "kind": "dashed", "label": "emit" },
              { "from": "sign",  "to": "wormm", "kind": "dashed", "label": "append" },
              { "from": "wormm", "to": "audit", "kind": "dashed", "label": "verify" }
            ]
          }
        ]
      },
      {
        "heading": "Tamper-evident, append-only, signed",
        "body": [
          {
            "type": "p",
            "text": "**Append-only means the storage layer rejects updates and deletes — not just 'we promise not to'.** S3 Object Lock in compliance mode, Azure Immutable Blob, or a hash-chained log (each entry includes the previous entry's hash) all qualify. A regular SQL table where a DBA can `UPDATE` does not."
          },
          {
            "type": "p",
            "text": "**Signing every batch with an HSM-backed key is what turns a log into evidence.** If an attacker compromises the app, they can stop new entries — they cannot rewrite old ones without forging the signature, which requires the HSM. Compliance regimes (SOX, PCI, HIPAA, FedRAMP) all assume this property."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Forensics — reconstruct a breach hour by hour",
              "Compliance audits — prove access controls were enforced",
              "Insider-threat detection — a privileged user accessing rows they shouldn't",
              "Legal hold — court-admissible evidence trail"
            ],
            "watch": [
              "Same DB for audit logs as the app — attacker root = log root",
              "Logging the request but not the response (did the action succeed?)",
              "PII inside audit logs becomes a GDPR data-subject request nightmare",
              "Retention too short — 90 days when breach detection averages 200"
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Append a tamper-evident audit entry. Each record chains to the previous via SHA-256.\nimport hashlib, json, time\n\ndef append_audit(prev_hash: str, actor: str, action: str, target: str, outcome: str) -> dict:\n    entry = {\n        \"ts\":      int(time.time() * 1000),  # millisecond UTC; never use local time\n        \"actor\":   actor,                    # 'user:alice@corp' or 'svc:payments'\n        \"action\":  action,                   # 'iam.grant_role' — verb.noun, never freeform\n        \"target\":  target,                   # the object touched, e.g. 'role:admin'\n        \"outcome\": outcome,                  # 'success' | 'denied' | 'error'\n        \"prev\":    prev_hash,                # chain link — breaks if anyone mutates the past\n    }\n    payload = json.dumps(entry, sort_keys=True).encode()  # canonical bytes\n    entry[\"hash\"] = hashlib.sha256(payload).hexdigest()    # this entry's hash\n    # In prod: sign entry['hash'] with an HSM-backed key, write to S3 Object Lock bucket\n    return entry\n\n# A verifier later replays: every entry's `prev` MUST equal the previous entry's `hash`.\n# Any gap or mismatch = the log was tampered with.\n"
          },
          {
            "type": "quote",
            "text": "If you can't prove it wasn't edited, it isn't an audit log — it's a story.",
            "cite": "the evidence rule"
          }
        ]
      }
    ]
  },
  "sec-ids-ips-edr": {
    "sections": [
      {
        "heading": "Three letters, three placements",
        "body": [
          {
            "type": "p",
            "text": "**IDS watches and alerts. IPS watches and blocks. EDR watches the endpoint and can quarantine the host.** They're not interchangeable — they sit at different layers and trade detection breadth for blast radius if they fire wrong."
          },
          {
            "type": "p",
            "text": "**Detection comes in two flavors: signature and anomaly.** Signatures catch known-bad with low false positives (Suricata + ET Pro rules). Anomaly catches unknown-bad with higher false positives (UEBA, ML baselines). You want both — a SOC running on only one is half blind."
          }
        ]
      },
      {
        "heading": "Pick the right tool for the layer",
        "body": [
          {
            "type": "table",
            "headers": ["Tool class", "Where it sits", "Best at"],
            "rows": [
              ["Network IDS",   "Tap on a span port",         "Egress C2, lateral scans (Snort, Suricata, Zeek)"],
              ["Host IDS",      "Agent on the box",           "File integrity, process trees (osquery, OSSEC, Wazuh)"],
              ["EDR",           "Kernel-level agent",         "Live response + process kill (CrowdStrike, SentinelOne, Defender)"],
              ["IPS",           "Inline on the wire",         "Blocking known exploits (Palo Alto, Suricata IPS mode)"]
            ]
          },
          {
            "type": "diagram",
            "title": "Detection placement",
            "subtitle": "WIRE · HOST · ENDPOINT",
            "height": 310,
            "nodes": [
              { "id": "atk",   "label": "attacker",    "subtitle": "EXTERNAL", "accent": "fire",  "x": 0.30, "y": 0.16 },
              { "id": "ips",   "label": "IPS",         "subtitle": "BLOCKS",   "accent": "amber", "x": 0.70, "y": 0.16 },
              { "id": "ids",   "label": "network IDS", "subtitle": "ALERTS",   "accent": "amber", "x": 0.30, "y": 0.50 },
              { "id": "edr",   "label": "EDR agent",   "subtitle": "ON HOST",  "accent": "amber", "x": 0.70, "y": 0.50 },
              { "id": "soc",   "label": "SOC",         "subtitle": "TRIAGE",   "accent": "water", "x": 0.50, "y": 0.84 }
            ],
            "edges": [
              { "from": "atk", "to": "ips", "kind": "dashed", "label": "traffic" },
              { "from": "ips", "to": "ids", "kind": "dashed", "label": "passes" },
              { "from": "ids", "to": "edr", "kind": "dashed", "label": "lands" },
              { "from": "edr", "to": "soc", "kind": "dashed", "label": "telemetry" }
            ]
          }
        ]
      },
      {
        "heading": "The IPS promise vs the false-positive bill",
        "body": [
          {
            "type": "p",
            "text": "**An IPS blocks in-line, which means a noisy rule can knock prod offline faster than the attack would have.** Most teams run new IPS rules in 'alert only' mode for a week before turning on block. Pure IDS dodges this risk entirely — at the cost of being late."
          },
          {
            "type": "p",
            "text": "**EDR changed the game because the agent has kernel visibility.** It sees the parent process tree, the in-memory loaded DLLs, the unsigned binary that just spawned `powershell.exe -enc <base64>`. Network-only IDS can't see any of that — only the encrypted bytes leaving the box."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Suricata or Zeek on a span port — free, deep, and queryable",
              "EDR on every endpoint — laptops AND servers, not just servers",
              "Sigma rules in Git — vendor-portable detection logic",
              "Tuned anomaly baselines per-asset class (DBs ≠ dev laptops)"
            ],
            "watch": [
              "IPS in block mode without a 'monitor only' soak period",
              "EDR rolled out and never tuned — analysts mute the Slack channel by week 2",
              "Encrypted egress traffic — your network IDS now sees handshakes only",
              "Detection rules that match `*.exe` — every Windows admin is now a malicious actor"
            ]
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# Sigma detection rule — vendor-neutral; converters emit Splunk/Elastic/Sentinel queries\ntitle: Suspicious PowerShell with Encoded Command  # human-readable, shows up in alerts\nid: 4ed3-replace-with-uuid  # generate one UUID per rule; never reuse\nstatus: stable  # 'experimental' rules don't auto-promote to block\ndescription: PowerShell launched with -EncodedCommand is a top-5 living-off-the-land technique.\nauthor: blue-team@corp\ndate: 2026/06/02\ntags:\n  - attack.execution      # MITRE ATT&CK mapping — searchable by tactic\n  - attack.t1059.001      #   technique: PowerShell\nlogsource:\n  category: process_creation  # Sysmon EID 1 / Windows 4688 / CrowdStrike ProcessRollup\n  product: windows\ndetection:\n  selection:\n    Image|endswith: '\\\\powershell.exe'  # the binary that ran\n    CommandLine|contains:                # any of these flag variants count\n      - ' -enc '\n      - ' -EncodedCommand '\n      - ' -ec '\n  filter_admin:\n    User|startswith: 'NT AUTHORITY\\\\'   # legit scheduled tasks run as system\n  condition: selection and not filter_admin\nlevel: high  # 'critical' = page; 'high' = ticket within an hour\nfalsepositives:\n  - Vendor installers that pack their own PowerShell payloads  # baseline these by hash\n"
          },
          {
            "type": "practice",
            "lang": "yaml",
            "prompt": "Write a Sigma rule that fires when an SSH login succeeds from an IP outside your corporate ASNs (use a placeholder list).",
            "starter": "title: SSH Login From Untrusted ASN\nid: 9b21-replace-me\nstatus: experimental\ndescription: Successful SSH from outside our known ASNs is either a misconfigured jump host or a real intrusion.\nlogsource:\n  category: authentication\n  product: linux\ndetection:\n  selection:\n    service: ssh\n    outcome: success\n  filter_trusted:\n    src_asn:\n      - 'AS-CORP-OFFICE-A'\n      - 'AS-CORP-OFFICE-B'\n      - 'AS-CORP-VPN'\n  condition: selection and not filter_trusted\nlevel: medium\nfalsepositives:\n  - Travelling employees on hotel WiFi — exempt by user, not by ASN\n",
            "hint": "Sigma's `condition` is a tiny expression language: `selection and not filter`. You can stack multiple filters with `and not 1 of filter_*`. Test with `sigma convert -t splunk rule.yml` before shipping."
          },
          {
            "type": "quote",
            "text": "An IPS in block mode without a soak period is just a slower outage.",
            "cite": "the blue-team gotcha"
          }
        ]
      }
    ]
  },
  "sec-ir-playbook": {
    "sections": [
      {
        "heading": "Six phases, in order, every time",
        "body": [
          {
            "type": "p",
            "text": "**Every incident response follows the same six phases: preparation, identification, containment, eradication, recovery, lessons-learned.** Skip a phase under pressure and you'll either miss the persistence the attacker left behind, or re-open the same hole in 30 days."
          },
          {
            "type": "p",
            "text": "**Preparation is 90% of the win.** The first 15 minutes of an incident is not the time to find the runbook, the IC's phone number, or the AWS break-glass account. Drill those before you need them."
          }
        ]
      },
      {
        "heading": "Phases × actions",
        "body": [
          {
            "type": "table",
            "headers": ["Phase", "Goal", "Concrete action"],
            "rows": [
              ["Preparation",       "Be ready",          "Runbooks, drills, on-call rota, break-glass creds"],
              ["Identification",    "Confirm it's real", "Triage the alert, scope the assets, declare severity"],
              ["Containment",       "Stop the bleeding", "Isolate hosts, revoke creds, block IPs at the edge"],
              ["Eradication",       "Remove the attacker", "Reimage, rotate keys, kill persistence mechanisms"],
              ["Recovery",          "Restore service",   "Bring systems back, watch for re-compromise"],
              ["Lessons-learned",   "Don't repeat",      "Blameless retro, action items with owners + dates"]
            ]
          },
          {
            "type": "walkthrough",
            "title": "First 15 minutes",
            "why": "The first 15 minutes is no time to hunt for the runbook — drill this order so it runs on muscle memory.",
            "subtitle": "ALERT → IC → CONTAIN",
            "height": 310,
            "nodes": [
              { "id": "alert",  "label": "alert fires",  "subtitle": "SIEM",     "accent": "sky",   "x": 0.30, "y": 0.16 },
              { "id": "ic",     "label": "declare IC",   "subtitle": "ONE LEAD", "accent": "water", "x": 0.70, "y": 0.16 },
              { "id": "scope",  "label": "scope",        "subtitle": "AFFECTED", "accent": "amber", "x": 0.30, "y": 0.50 },
              { "id": "cont",   "label": "contain",      "subtitle": "ISOLATE",  "accent": "amber", "x": 0.70, "y": 0.50 },
              { "id": "ev",     "label": "preserve",     "subtitle": "EVIDENCE", "accent": "earth", "x": 0.50, "y": 0.84 }
            ],
            "steps": [
              {
                "title": "Alert fires",
                "description": "The SIEM pages on something that smells like a breach. The clock — including any regulatory 72-hour clock — starts the moment a human sees it.",
                "activeNodes": ["alert"],
                "activeEdges": []
              },
              {
                "title": "Declare one Incident Commander",
                "description": "Name a single IC in the channel topic. **One** decision-maker — two ICs 'collaborating' means every call now needs consensus while the attacker keeps moving.",
                "activeNodes": ["alert", "ic"],
                "activeEdges": [{ "from": "alert", "to": "ic", "label": "page" }]
              },
              {
                "title": "Scope the blast radius",
                "description": "The IC assigns SMEs to find which hosts, accounts, and data are affected, then sets a severity. You can't contain what you haven't scoped.",
                "activeNodes": ["ic", "scope"],
                "activeEdges": [{ "from": "ic", "to": "scope", "label": "assign" }]
              },
              {
                "title": "Contain — stop the bleeding",
                "description": "Isolate hosts, revoke credentials, block IPs at the edge. Containment limits damage without yet trying to fully evict the attacker.",
                "activeNodes": ["scope", "cont"],
                "activeEdges": [{ "from": "scope", "to": "cont", "label": "decide" }]
              },
              {
                "title": "Preserve the evidence",
                "description": "Capture memory and disk images **before** you reimage — reimage first and the attacker's persistence is gone forever, along with your forensic trail.",
                "activeNodes": ["cont", "ev"],
                "activeEdges": [{ "from": "cont", "to": "ev", "label": "capture" }]
              }
            ]
          },
          {
            "type": "kanban",
            "title": "Live IR board",
            "caption": "Where every open incident sits right now",
            "columns": [
              { "name": "Triage",       "wip": 3, "items": ["INC-1023 phishing report", "INC-1024 EDR alert laptop-42", "INC-1025 unusual S3 egress"] },
              { "name": "Investigating","wip": 3, "items": ["INC-1019 lateral movement svc-acct", "INC-1020 brute-force VPN"] },
              { "name": "Containment",  "wip": 2, "items": ["INC-1015 ransomware on file-share-3", "INC-1017 leaked GitHub token"] },
              { "name": "Eradication",  "wip": 1, "items": ["INC-1011 web shell on cms-prod-1"] },
              { "name": "Recovery",     "items": ["INC-1007 jumpbox rebuild", "INC-1008 keys rotated, monitoring"] }
            ]
          }
        ]
      },
      {
        "heading": "Roles, runbooks, and drills",
        "body": [
          {
            "type": "p",
            "text": "**Three roles, named before the incident: IC (Incident Commander), SME (Subject Matter Expert), Comms.** The IC runs the call and makes decisions — nobody else. SMEs answer technical questions. Comms talks to leadership, customers, and lawyers. Splitting these prevents the IC from drowning in Slack DMs."
          },
          {
            "type": "p",
            "text": "**Drills > docs.** A runbook nobody has executed is fiction. Run a tabletop quarterly with a fake scenario, and a live game-day annually where you actually revoke a token and watch what breaks. The first time you isolate a host should not be in prod, during a real breach, at 3am."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Single IC, single decision-maker, single Slack channel",
              "A 'War Room' template — roles, links, status field, pinned",
              "Preserving evidence BEFORE you reimage (memory + disk image)",
              "Blameless retros — the goal is fixing systems, not naming heroes"
            ],
            "watch": [
              "Two ICs 'collaborating' — every decision now needs consensus",
              "Reimaging the host before you grabbed memory — persistence lost forever",
              "Skipping lessons-learned because 'we're busy' — same incident in 90 days",
              "Comms via Slack only — legal/PR finds out from a customer tweet"
            ]
          },
          {
            "type": "code",
            "lang": "markdown",
            "text": "# INCIDENT RUNBOOK — Compromised AWS credentials\n\n> Severity defaults SEV-2. Bump to SEV-1 if production or customer data is touched.\n\n## First 15 minutes\n1. **Declare IC** in #incident-room — one human, name them in the topic.  <!-- who is in charge -->\n2. **Open a war-room doc** from the template — roles, timeline, status field.\n3. **Identify the principal** — IAM user, role, or access key ID from CloudTrail.\n4. **DO NOT delete the key yet** — it's evidence and may give us live attacker telemetry.\n\n## Containment (next 15 min)\n- [ ] Attach `AWSDenyAll` policy to the principal (revokes without deleting evidence).\n- [ ] Revoke active STS sessions: `aws iam list-access-keys` → deactivate.\n- [ ] Snapshot any EC2 the principal touched in the last 7 days (memory + disk).\n- [ ] Block source IPs at the org-level SCP / WAF if the pattern is clear.\n\n## Eradication\n- [ ] Rotate the user's keys + any keys that share the same human owner.\n- [ ] Audit all IAM roles the principal could `sts:AssumeRole` into — rotate too.\n- [ ] Search CloudTrail for `eventName=CreateUser|CreateAccessKey|AttachUserPolicy` in the window.\n- [ ] Kill any new IAM artifacts the attacker planted (very common persistence move).\n\n## Recovery\n- [ ] Re-enable the principal with fresh credentials + forced MFA reset.\n- [ ] Re-enable monitoring; alert on the principal for 14 days post-recovery.\n\n## Lessons-learned (within 5 business days)\n- Blameless retro. Action items in Jira with owners + due dates — not 'best effort'.\n"
          },
          {
            "type": "quote",
            "text": "The runbook you've never rehearsed is fiction. Drill it, or expect to write it during the breach.",
            "cite": "the IR maxim"
          }
        ]
      }
    ]
  },
  "sec-blue-red-purple": {
    "sections": [
      {
        "heading": "Three colors, one goal",
        "body": [
          {
            "type": "p",
            "text": "**Blue defends, red attacks, purple is the two of them in the same room.** The colors aren't HR titles — they're exercise modes. The point of all three is to find gaps before a real attacker does."
          },
          {
            "type": "p",
            "text": "**'Assume breach' is the modern stance.** Don't ask 'can they get in?' — they can. Ask 'how fast do we detect, and how far do they get before we stop them?' Red teams exist to measure that, not to win a game."
          }
        ]
      },
      {
        "heading": "Who does what",
        "body": [
          {
            "type": "table",
            "headers": ["Team", "Job", "Output"],
            "rows": [
              ["Blue",   "Build + operate detections and response", "Working SOC, tuned alerts, IR muscle memory"],
              ["Red",    "Simulate real adversaries end-to-end",     "Findings report, missed-detection list, MITRE coverage"],
              ["Purple", "Both teams collaborate in real time",      "Detections improved during the exercise, not after"]
            ]
          },
          {
            "type": "diagram",
            "title": "Purple-team loop",
            "subtitle": "ATTACK · DETECT · IMPROVE",
            "height": 220,
            "nodes": [
              { "id": "red",   "label": "red team",   "subtitle": "EMULATES",  "accent": "fire",  "x": 0.25, "y": 0.2 },
              { "id": "sig",   "label": "telemetry",  "subtitle": "LOGS+EDR",  "accent": "sky",   "x": 0.75, "y": 0.2 },
              { "id": "blue",  "label": "blue team",  "subtitle": "DETECTS",   "accent": "water", "x": 0.75, "y": 0.8 },
              { "id": "rule",  "label": "new rule",   "subtitle": "ADDED",     "accent": "amber", "x": 0.25, "y": 0.8 }
            ],
            "edges": [
              { "from": "red",  "to": "sig",  "kind": "dashed", "label": "attacks" },
              { "from": "sig",  "to": "blue", "kind": "dashed", "label": "stream" },
              { "from": "blue", "to": "rule", "kind": "dashed", "label": "writes" },
              { "from": "rule", "to": "red",  "kind": "dashed", "label": "retest" }
            ]
          }
        ]
      },
      {
        "heading": "Tabletops, bounties, and assume-breach",
        "body": [
          {
            "type": "p",
            "text": "**A tabletop exercise is a walk-through, not a live attack.** Everyone gathers in a room, the facilitator reads a scenario ('your CFO's laptop is encrypted, ransom note on screen'), and the team narrates what they'd do. Cheap, runnable monthly, surfaces 80% of the runbook gaps a live exercise would."
          },
          {
            "type": "p",
            "text": "**Bug bounties are outsourced red teams with skin in the game.** HackerOne, Bugcrowd, Intigriti — researchers find what your internal team misses, paid only on impact. They're not a substitute for an internal red team, they're a complement: bounties cover external attack surface; red teams cover insider and post-breach scenarios."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Quarterly tabletops with rotating scenarios — cheap muscle memory",
              "Purple-team weeks where red sits with blue and improves detections live",
              "Bug bounty for external surface — pay for real-world findings",
              "MITRE ATT&CK coverage map so red-team scope isn't vibes-based"
            ],
            "watch": [
              "Red team that 'wins' silently — no detections improved, no value",
              "Bug bounties with a sloppy scope — researchers test prod and break it",
              "Blue team treats red as the enemy — blocks collaboration, hides gaps",
              "Assume-breach claimed in policy but never exercised — same as no policy"
            ]
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# Purple-team exercise plan — one TTP per row, traceable end to end\nexercise: 2026-Q2-purple-week  # short slug; shows up in tickets + retro\nscope:\n  in:  [\"corp-laptop fleet\", \"aws-prod-us-east-1\"]   # what's fair game\n  out: [\"customer-facing prod traffic\", \"payroll\"]   # explicit no-go list\nttps:\n  - id: T1078.004                  # MITRE technique ID — auditable mapping\n    name: Valid Accounts - Cloud Accounts\n    red_action: \"Use a stolen IAM access key to call sts:GetCallerIdentity.\"\n    expected_detect: \"CloudTrail rule: GetCallerIdentity from new ASN within 5 min of key creation.\"\n    actual_detect: pending          # filled in live during the exercise\n    notes: \"\"\n  - id: T1059.001\n    name: PowerShell - Encoded Command\n    red_action: \"Launch powershell.exe -enc <base64> from a corp laptop.\"\n    expected_detect: \"EDR Sigma rule fires; SOC pages within 10 min.\"\n    actual_detect: pending\n    notes: \"\"\nsuccess_criteria:\n  - \"Every TTP either detected, OR a new detection written before the week ends.\"\n  - \"No customer-impacting downtime.\"\n  - \"Findings logged with owner + due date in Jira.\"\n"
          },
          {
            "type": "quote",
            "text": "Assume breach. Then exercise the assumption — or it isn't one.",
            "cite": "the purple-team creed"
          }
        ]
      }
    ]
  },
};
