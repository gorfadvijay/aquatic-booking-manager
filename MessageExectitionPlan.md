# MSG91 Integration – Execution Plan

> **Objective**  
> Seamlessly integrate MSG91's communication APIs (SMS, Email, WhatsApp & OTP) into the aquatic-booking-manager code-base while respecting existing patterns and environments (dev / test / prod).

---

## 1. Preparation

1. **Create/Configure MSG91 Account**  
   • Sign-up & complete KYC.  
   • Note the **Auth Key / Bearer Token** from the MSG91 dashboard.  
   • Get approvals for:  
     – SMS Sender ID & Templates  [(docs)](https://docs.msg91.com/sms)  
     – WhatsApp Business number & templates  [(docs)](https://docs.msg91.com/whatsapp)  
     – Email domain verification & templates  [(docs)](https://docs.msg91.com/email)

2. **Project Secrets / Env-vars**  
   Add the following to **.env.[4mexample[0m** and populate per-environment:
   ```bash
   # MSG91
   VITE_MSG91_AUTH_KEY="xxxxxxxxxxxxxxxxxxxxxxxx"  # Common Auth key
   VITE_MSG91_SENDER_ID="ABCDEF"                   # SMS Sender ID
   VITE_MSG91_WHATSAPP_SENDER="whatsapp:+91xxxxx"  # Approved WA number
   VITE_MSG91_EMAIL_DOMAIN="example.com"          # Verified email domain
   ```
   • Extend `src/lib/environment.ts` accordingly.

3. **Dependencies**  
   We already rely on native `fetch`. No extra SDK is required (MSG91 is pure REST). If preferred, add `axios` later.

---

## 2. Code Architecture

| Concern | New / Updated File | Responsibility |
|---------|--------------------|----------------|
| MSG91 REST wrapper | `src/lib/services/api/msg91-api.service.ts` | Low-level typed functions for each MSG91 endpoint (sendSMS, sendEmail, sendWA, sendOtp, verifyOtp, resendOtp). |
| Notification orchestration | `src/lib/services/notification.service.ts` (extend) | Decide channel & call Msg91Api, then persist notification row in Supabase. |
| OTP auth flow | `src/pages/auth/Login.tsx` (future) | Replace current OTP mechanism with Msg91 Send-/Verify-OTP calls. |

Keep the pattern identical to `phonepe-api.service.ts` to avoid new paradigms.

---

## 3. Implementation Steps (Chronological)

### 3.1  REST Wrapper
1. Copy the structure of `phonepe-api.service.ts`.  
2. Implement helper `private request<T>(path, method, body)` that injects Auth Key in header `authkey`.
3. Expose functions:
   ```ts
   export const Msg91Api = {
     sendSMS: (payload: SendSmsDto) => request<SmsResponse>("/api/v5/flow/", "POST", payload),
     sendEmail: (payload: EmailDto) => request<EmailResponse>("/api/v5/email", "POST", payload),
     sendWhatsApp: (payload: WaDto) => request<WaResp>("/api/v5/whatsapp`, "POST", payload),
     sendOtp: (mobile) => request<OtpResp>(`/api/v5/otp?mobile=${mobile}&otp_length=4`, "GET"),
     verifyOtp: (mobile, otp) => request<OtpResp>(`/api/v5/otp/verify?mobile=${mobile}&otp=${otp}`, "GET"),
     resendOtp: (mobile) => request<OtpResp>(`/api/v5/otp/retry?mobile=${mobile}&retrytype=text`, "GET"),
   };
   ```
   API paths per MSG91 docs:  
   • **Send SMS** – `https://api.msg91.com/api/v5/flow/`  
   • **Send Email** – `https://api.msg91.com/api/v5/email`  
   • **Send WA** – `https://api.msg91.com/api/v5/whatsapp`  
   • **OTP** – `https://api.msg91.com/api/v5/otp/*`  
   *(See [Overview](https://docs.msg91.com/overview))*

### 3.2  Notification Service Extension
1. Inject **channel-specific senders**:
   ```ts
   import { Msg91Api } from './api/msg91-api.service';
   // ... existing code ...
   async function dispatchViaMsg91(n: Partial<Notification>) {
     switch (n.channel) {
       case 'sms': await Msg91Api.sendSMS({...}); break;
       case 'email': await Msg91Api.sendEmail({...}); break;
       case 'whatsapp': await Msg91Api.sendWhatsApp({...}); break;
     }
   }
   ```
2. On success, call existing `create` to persist.
3. Handle failures & status updates.

### 3.3  OTP Flow
1. Add **OTPService** wrapper around Msg91Api's OTP endpoints.  
2. Modify login/registration pages to:
   * `sendOtp(phone)` → show OTP input on success.
   * `verifyOtp(phone, code)` → on success log-in/create user.
3. Keep fallback to Supabase email-link auth for dev environment.

### 3.4  Tests
1. Unit tests for `msg91-api.service.ts` with MSW mock server.  
2. Integration test for notification flow (Jest + Supabase test db).

---

## 4. Roll-out Strategy

| Phase | Env | Checklist |
|-------|-----|-----------|
| 1 | **dev** | • Add env vars<br/>• Implement wrapper & test with sandbox credits.<br/>• Feature-flag OTP (`env.useMsg91Otp`). |
| 2 | **staging/test** | • Use staging numbers/emails.<br/>• Validate template approvals. |
| 3 | **prod** | • Rotate to production Auth-Key.<br/>• Monitor delivery reports & Supabase `notifications` table. |

Rollback = toggle feature-flag & revert to old flow.

---

## 5. Risks & Mitigations

1. **Template Rejection** – start approval early; keep generic messages.  
2. **Rate Limits / Costs** – enable per-channel throttling in code.  
3. **GDPR/Privacy** – store only minimal PII in Supabase.

---

## 6. Timeline (ideal)

| Day | Task |
|-----|------|
| 0-1 | MSG91 setup, env vars, templates submission |
| 2-3 | Implement `msg91-api.service.ts` & unit tests |
| 4 | Notification service extension |
| 5 | OTP flow refactor |
| 6 | QA on staging |
| 7 | Production deploy |

---

## 7. Reference Links

* MSG91 Overview – [docs.msg91.com/overview](https://docs.msg91.com/overview)  
* SMS API – [docs.msg91.com/sms](https://docs.msg91.com/sms)  
* Email API – [docs.msg91.com/email](https://docs.msg91.com/email)  
* WhatsApp API – [docs.msg91.com/whatsapp](https://docs.msg91.com/whatsapp)  
* OTP Send – [docs.msg91.com/otp/sendotp](https://docs.msg91.com/otp/sendotp)  
* OTP Verify – [docs.msg91.com/otp/verify-otp](https://docs.msg91.com/otp/verify-otp)  
* OTP Resend – [docs.msg91.com/otp/resend-otp](https://docs.msg91.com/otp/resend-otp)  
* Homepage – [msg91.com](https://msg91.com/)

---

**Next Action:** create `msg91-api.service.ts` scaffold and request sender-ID/template approvals. 