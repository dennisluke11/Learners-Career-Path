# Gemini API: Is It Free? Complete Pricing Guide

## Short Answer: **Yes, but VERY Limited**

Gemini API has a **free tier**, but it's **very restrictive** and **not suitable for production**. Once you enable billing, you lose all free usage.

---

## What's Actually Free?

### ✅ Free Tier (Limited)

**Available Models:**
- Gemini 2.5 Pro
- Gemini 2.5 Flash
- Gemini 2.5 Flash-Lite
- Gemini 2.0 Flash
- Gemini 2.0 Flash-Lite

**Free Tier Limits:**

| Model | Requests Per Minute (RPM) | Requests Per Day (RPD) | Tokens Per Minute |
|-------|---------------------------|------------------------|-------------------|
| **Gemini 2.5 Pro** | ~5 RPM | ~100 RPD | Limited |
| **Gemini 2.5 Flash** | ~10 RPM | ~250 RPD | Limited |
| **Gemini 2.5 Flash-Lite** | ~15 RPM | ~1,000 RPD | Limited |

**What This Means:**
- **100 requests/day** for Pro model (very limited!)
- **1,000 requests/day** for Flash-Lite (better, but still limited)
- **Rate limits** - can't make too many requests quickly
- **Regional restrictions** - Not allowed for EU/UK/Switzerland users

---

## ⚠️ Critical Limitation: Billing Kills Free Tier

### The Big Gotcha:

**Once you enable billing (for production), you LOSE all free usage!**

- Free tier only works **without billing enabled**
- If you enable billing → **Everything becomes billable**
- No "free buffer" once you go paid
- This is different from many other APIs

**Translation:**
- ✅ Free for testing/prototyping (no billing)
- ❌ **NOT free for production** (must enable billing)
- 💰 **All usage becomes paid** once billing is enabled

---

## Paid Tier Pricing (When Billing Enabled)

### Cost Per Million Tokens:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|------------------------|------------------------|
| **Gemini 2.0 Flash-Lite** | $0.075 | $0.30 |
| **Gemini 2.0 Flash** | $0.15 | $0.60 |
| **Gemini 2.5 Flash** | ~$0.20 | ~$0.80 |
| **Gemini 2.5 Pro** | ~$1.25 | ~$5.00 |

### Example Costs:

**For Study Resources (per request):**
- Average prompt: ~500 tokens
- Average response: ~1,000 tokens
- **Cost per request:** ~$0.0005-0.001 (Flash) or ~$0.005-0.01 (Pro)

**For Career Market Data (per request):**
- Average prompt: ~800 tokens
- Average response: ~1,500 tokens
- **Cost per request:** ~$0.0008-0.0015 (Flash) or ~$0.008-0.015 (Pro)

**Monthly Estimate (100 users, 10 requests each = 1,000 requests):**
- **Flash:** ~$0.50-1.50/month
- **Pro:** ~$5-15/month

---

## For Your Project: Is Gemini Free?

### ❌ **Not Really - Here's Why:**

**Your Current Usage:**
- Study Resources: Generated per user request
- Career Market Data: Generated per career lookup
- AI Tips: Generated per user session

**Free Tier Limits:**
- **100 requests/day** (Pro) or **1,000 requests/day** (Flash-Lite)
- **Rate limits:** 5-15 requests per minute

**Reality Check:**
- If you have **10 active users** making **5 requests each** = **50 requests/day** ✅ (within free tier)
- If you have **50 active users** making **5 requests each** = **250 requests/day** ⚠️ (exceeds Pro, OK for Flash-Lite)
- If you have **100+ active users** = **Exceeds free tier** ❌

**But Wait:**
- For **production**, you **must enable billing**
- Once billing enabled → **No more free tier**
- **Everything becomes paid** 💰

---

## Cost Comparison: Gemini vs Alternatives

### Scenario: 1,000 API requests/month

| Solution | Free Tier | Paid Cost | Notes |
|----------|-----------|-----------|-------|
| **Gemini API** | ❌ (must enable billing for production) | $0.50-15/month | Loses free tier once billing enabled |
| **Adzuna API** | ✅ 1,000 requests/month | $0/month (free tier) | Real job data, includes salaries |
| **Hardcoded Defaults** | ✅ Unlimited | $0/month | Already in your codebase |
| **LinkedIn API** | ❌ | $500-2,000+/month | Requires partner access |

---

## Real-World Example: Your Project

### Current Setup (with Gemini):
- Study Resources: ~500 requests/month
- Market Data: ~300 requests/month
- AI Tips: ~200 requests/month
- **Total: ~1,000 requests/month**

### Cost Analysis:

**Option 1: Gemini Free Tier (No Billing)**
- ✅ Free
- ❌ **Not allowed for production**
- ❌ Rate limits (5-15 RPM)
- ❌ Can't serve EU/UK users
- ❌ Unreliable (hits limits easily)

**Option 2: Gemini Paid (Billing Enabled)**
- 💰 **$0.50-15/month** (depending on model)
- ✅ Production-ready
- ✅ Higher rate limits
- ⚠️ All usage is paid (no free buffer)

**Option 3: No AI (Hardcoded Defaults)**
- ✅ **$0/month**
- ✅ Already works (your codebase has fallbacks)
- ✅ No rate limits
- ✅ More reliable
- ⚠️ Less personalized

**Option 4: Adzuna API (Real Job Data)**
- ✅ **$0/month** (free tier: 1,000 requests/month)
- ✅ Real job data (not AI-generated)
- ✅ Includes salary data
- ✅ Production-ready

---

## My Recommendation

### 🎯 **Avoid Gemini API for Production**

**Why:**
1. ❌ **Free tier not suitable for production** (must enable billing)
2. ❌ **Loses free tier once billing enabled** (everything becomes paid)
3. ❌ **Rate limits too restrictive** (5-15 requests/minute)
4. ❌ **Regional restrictions** (can't serve EU/UK)
5. ✅ **Your codebase already has hardcoded defaults** (works without AI)

### Better Alternatives:

**For Study Resources:**
- ✅ **Use hardcoded defaults** (already comprehensive)
- ✅ **$0/month**
- ✅ More reliable than AI

**For Market Data:**
- ✅ **Use Adzuna API** (free tier: 1,000 requests/month)
- ✅ **Real job data** (not AI-generated)
- ✅ **Includes salary data**
- ✅ **$0/month** (within free tier)

**For AI Tips:**
- ✅ **Use hardcoded defaults** (already has tips)
- ✅ **$0/month**

---

## Summary: Gemini API Pricing

### Free Tier:
- ✅ **Yes, exists** (100-1,000 requests/day)
- ❌ **Not for production** (must enable billing)
- ❌ **Very restrictive** (rate limits, regional restrictions)
- ❌ **Loses free tier** once billing enabled

### Paid Tier:
- 💰 **$0.50-15/month** for typical usage
- ✅ Production-ready
- ❌ **All usage is paid** (no free buffer)

### Verdict:
- **For testing/prototyping:** ✅ Free (but limited)
- **For production:** ❌ **Not free** (must pay)
- **Better alternative:** ✅ **Hardcoded defaults + Adzuna API** = **$0/month**

---

## Action Plan

### Remove Gemini API:
1. Set `geminiApiKey: undefined` in environment
2. App already uses hardcoded defaults automatically
3. **Cost: $0/month**

### Add Real Job Data (Optional):
1. Sign up for Adzuna API (free)
2. Create monthly script to fetch jobs
3. Store in Firestore
4. **Cost: $0/month** (within free tier)

### Result:
- ✅ **$0/month** (vs $0.50-15/month with Gemini)
- ✅ **More reliable** (no rate limits)
- ✅ **Real data** (not AI-generated)
- ✅ **Production-ready**

---

Would you like me to:
1. Remove Gemini API code completely?
2. Set up Adzuna API for real job data?
3. Expand hardcoded defaults for better coverage?

