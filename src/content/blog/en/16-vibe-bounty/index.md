---
title: "From Zero to First Bug Bounty Report — Hacking with Vibe Coding"
summary: "With zero bug bounty experience, I found my first vulnerability in one day by conversing with AI. I didn't type a single line of code myself."
date: "2026-05-24T18:00:00"
tags:
  - bug-bounty
  - vibe-coding
  - security
  - ai-agent
  - race-condition
---

I'm not a security expert. I code, but I've never hacked anything. Then while using AI coding tools, a thought hit me — "Could I do bug bounties with this?"

My first instinct was to build an automation system. But I quickly corrected course. **Do it manually first, then systematize once you have know-how.** That was the right order.

---

## What Is Vibe Coding

Vibe Coding means building code through natural language conversation with AI. That's exactly what I did:

- "Write me a SAML test script" → AI writes code + runs it
- "Analyze the results" → AI parses responses + suggests next test
- "Write a race condition test for the refund API" → AI builds a PoC

**I didn't type any code in the traditional sense.** I set the direction; AI handled execution. No prompt engineering either — just natural conversation.

---

## Day 1: From Environment Setup to Vulnerability Discovery

### Step 1: Choosing a Target

I signed up for a bug bounty platform and looked for programs with active promotions. A fintech company had just launched SAML 2.0 support and was offering bonus rewards.

I had AI analyze the entire program scope — test targets, reward structure, and rules of engagement — all organized into a clean document.

### Step 2: Building the SAML Test Environment

What I needed for SAML SSO testing:
- **Okta Developer** (free IdP)
- **mitmproxy** (HTTP proxy)
- **Burp Suite** (tried first, but blocked by Cloudflare)

First hurdle: Burp Suite's embedded browser, regular browsers, even raw Python requests — all blocked by Cloudflare. Everything returned 403.

**Solution:** Switch to mitmproxy with Firefox, installing the CA certificate for HTTPS interception. AI wrote a mitmproxy addon script that intercepts and modifies SAMLResponse payloads in real-time during the browser's SSO login flow.

```
[Firefox] → [mitmproxy (SAML modification)] → [Target Server]
                    ↑
          Python addon intercepts SAMLResponse
          and swaps in attack payloads
```

This approach was key. Cloudflare lets browsers through, so modifying payloads at the proxy level bypasses the WAF.

### Step 3: Testing 10 SAML Attack Vectors

AI created two mitmproxy addon scripts:

**saml_intercept.py** — 7 basic SAML attacks:
- Assertion Replay
- InResponseTo removal/modification
- RelayState Open Redirect
- XXE Injection
- NameID spoofing (email substitution)
- Signature removal

**saml_xsw.py** — 8 XSW (XML Signature Wrapping) attacks:
- XSW1–8: inserting malicious assertions at various positions alongside the signed assertion

The testing workflow was elegant. Change the `TEST_MODE` in the script, restart mitmproxy, then just repeat SSO login in Firefox. Each login automatically applied a different attack.

```python
# mitmproxy addon — intercept SSO callback and modify SAMLResponse
class XSWInterceptor:
    def request(self, flow):
        if "/sso/callback" in flow.request.pretty_url:
            xml = decode(saml_response)
            evil_assertion = make_evil_assertion(xml)
            modified_xml = inject_xsw(xml, evil_assertion)
            flow.request.set_text(encode(modified_xml))
```

**Result: 14 out of 15 tests blocked.** The target's SAML implementation was solid. Only XSW8 returned a 302, but it didn't lead to actual account takeover.

### Step 4: Pivoting to API Testing

After confirming SAML was robust, I switched to an area the program explicitly asked hunters to test:

> *"Race condition in critical business logic activities — For example, passing multiple refunds"*

I had AI build an API client — HMAC-SHA256 signature implementation, auth header generation, and test automation in a single Python script.

```python
# API signature generation
to_sign = http_method + url_path + salt + timestamp + access_key + secret_key + body
signature = base64(hmac_sha256(secret_key, to_sign))
```

### Step 5: Finding the Race Condition

Created a $100 payment, then fired 20 concurrent $10 partial refund requests using Python threading.

```python
# 20 threads sending the same refund request simultaneously
threads = [Thread(target=refund, args=(payment_id, 10)) for _ in range(20)]
for t in threads: t.start()
for t in threads: t.join()
```

**Result:**

```
Successful refunds: 3
Failed refunds: 17
Total refunded: $30
>>> Expected: 1 refund of $10, Got: 3 refunds = $30
```

**Only 1 refund should have succeeded. 3 did.** A second test reproduced with 2 successes. The server wasn't applying proper locks on concurrent requests, causing duplicate refund processing — a textbook race condition.

---

## Technical Deep Dive: Why Race Conditions Are Dangerous

### Attack Scenario

1. Normal transaction: Customer pays $100
2. Malicious refund: An insider with API keys sends 100 concurrent $10 refund requests
3. Result: 10–30 refunds succeed → $100–$300 refunded (potentially exceeding the original payment)

### Root Cause

```
Thread 1: Check if refund allowed (balance $100 ≥ $10) → OK
Thread 2: Check if refund allowed (balance $100 ≥ $10) → OK  ← Thread 1 not yet applied
Thread 3: Check if refund allowed (balance $100 ≥ $10) → OK  ← Threads 1,2 not yet applied
Thread 1: Execute refund → balance $90
Thread 2: Execute refund → balance $80  ← already passed the check
Thread 3: Execute refund → balance $70  ← same
```

A classic **TOCTOU (Time-of-Check to Time-of-Use)** problem — other threads slip between the check and execute phases.

### The Fix

```sql
-- Correct implementation
BEGIN TRANSACTION;
SELECT balance FROM payments WHERE id = ? FOR UPDATE;  -- acquire lock
IF balance >= refund_amount THEN
    UPDATE payments SET balance = balance - refund_amount;
    INSERT INTO refunds (...);
END IF;
COMMIT;  -- release lock
```

---

## Tool Stack

| Tool | Purpose | Cost |
|------|---------|------|
| AI coding tool | Script writing, analysis, reporting | Paid |
| mitmproxy | HTTPS proxy, SAML payload modification | Free |
| Burp Suite CE | HTTP proxy (blocked by CF, used as backup) | Free |
| Okta Developer | SAML IdP (testing) | Free |
| Python + requests | API testing, Race Condition PoC | Free |
| Firefox | Browser (independent proxy config) | Free |

---

## What Vibe Coding Bug Bounty Actually Felt Like

### What Worked

**Speed.** From environment setup to vulnerability discovery in one day. Studying the SAML spec, understanding XSW attacks, implementing API signatures — doing all of that manually would have taken a week.

**Barrier removal.** I didn't know what SAML was. Didn't know what XSW was. AI explained the attack principles while simultaneously writing the attack code. Learning and doing happened at the same time.

**Repetition elimination.** Manually editing XML, base64-encoding, and sending it 15 times for SAML testing is not a job for humans. With mitmproxy addon automation, all I had to do was "repeat the login."

### What Didn't

**Too much time on Cloudflare bypass.** Switching from Burp Suite to mitmproxy, installing certificates, configuring Firefox — environment issues took longer than actual testing. In practice, having this pre-configured matters.

**AI doesn't know what it can't see.** Where the SSO button is on the dashboard, what fields exist during signup — I had to check these with my own eyes. AI can't see a live web app's UI.

### The Core Lesson

> **AI builds the tools. You set the direction.**

Tell AI "find me bugs" and nothing happens. But say "write a script to test if the refund API has a race condition" and you get a PoC in 5 minutes.

What actually matters:
1. **Judgment** to decide where to look (reading what the program is asking for)
2. **Strategy** to choose what to try (pivoting from SAML to API when blocked)
3. **Interpretation** to understand results (knowing why 3 successful refunds is a problem)

AI doesn't replace any of these three.

---

## Results

| Item | Detail |
|------|--------|
| Time spent | ~4 hours |
| Vulnerabilities tested | 15 (SAML 10 + API 5) |
| Vulnerability found | Race Condition (duplicate refund processing) |
| Severity | High (P2) |
| Status | Report submitted, under review |

---

## For Those Getting Started

1. **Don't build the system first.** Do it by hand, then automate once you have success patterns.
2. **Read the program's "commonly found vulnerabilities."** The target explicitly mentioned race conditions. That's basically a hint.
3. **Use AI, but set the direction yourself.** AI writes code and analyzes — it's a tool, not a strategist.
4. **Don't get frustrated by environment setup.** Cloudflare, certificates, proxy configs — these are more annoying than actual hacking. But once set up, everything after is faster.

---

*All testing described in this post was performed within the scope of a bug bounty program, in a sandbox environment only.*
