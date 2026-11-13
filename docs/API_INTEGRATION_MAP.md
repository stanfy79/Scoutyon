# Scoutyon frontend API integration map

This map was checked against the route mounts in `Scoutyon-Backend/src/index.ts`,
the route handlers and schemas, and the backend service/model implementations.
No OpenAPI/Swagger contract or completed backend implementation report was
present in the backend repository at audit time. The backend working tree also
contains uncommitted additions; the new vendor, purchase and payment routes
must be deployed with their corresponding changes before the frontend can use
them.
There is no `src/controllers/` directory; request handlers are implemented
directly in the route modules.

All API routes below are mounted on the configured backend origin. Unless
otherwise noted, they require `Authorization: Bearer <Privy access token>`.
`/api/auth/sync` verifies a Privy token itself; `/health` is public. Auth
middleware returns 401 for missing/invalid identity or an unsynchronized user,
and 403 for suspended users.

## Frontend-to-backend route map

| Frontend capability | Actual endpoint | Request | Response and behavior |
|---|---|---|---|
| Privy account synchronization | `POST /api/auth/sync` | Bearer token; no JSON body | 201 for new user or 200 for existing user: `{ success, user: { id, privyUserId, email, accountStatus, emailVerified, wallet: { id, address, chainType, provisioningStatus } } }`. |
| Current account profile | `GET /api/auth/me` | None | User fields and nested `wallet` object. 404 if no synchronized user. |
| AI research | `POST /api/agent/chat` | `{ goal, budgetId?, sessionId? }` | Starts a session when `sessionId` is omitted; continues an owned session when provided. SSE stream with `session`, `text`, `tool_call`, `tool_result`, `quote`, `error`, and `done` event types. |
| Research history | `GET /api/agent/sessions`; `GET /api/agent/sessions/:id` | None | Session list without messages; detail includes session messages. 404 for missing detail. |
| Budget list/details | `GET /api/budgets`; `GET /api/budgets/:id` | None | Raw array or budget object (not an envelope). Budget contains `totalLimit`, `spent`, `reserved`, `currency`, `active`, and `approvedRecipients`. |
| Budget creation | `POST /api/budgets` | `{ label, totalLimit, currency?, approvedRecipients? }` | 201 and raw budget. Empty label or non-positive/missing limit returns 400. |
| Budget update/deactivation | `PATCH /api/budgets/:id` | Optional `label`, `totalLimit`, `approvedRecipients`, `active` | Updated raw budget; 404 if missing. The route has no period/category fields. |
| Budget deletion | `DELETE /api/budgets/:id` | None | 204; 404 if missing. |
| Vendor review | `POST /api/vendors/discover` | `{ requirement, category?, keywords?, budget?: { currency?, minimum?, maximum? }, location?, specifications?, preferredCharacteristics?, constraints?, candidateUrls?: string[] }` | 201 `{ success: true, discovery, vendors }`. This is not a general web search: candidates come from supplied URLs. If no URLs are provided the backend records `no_results`. Per-URL fetch failures are represented as discovery results without a `vendorId`. |
| Vendor/discovery retrieval | `GET /api/vendors`; `GET /api/vendors/:vendorId`; `GET /api/vendors/discover/:discoveryId` | None | Envelopes: `{ success: true, vendors }`, `{ success: true, vendor }`, or `{ success: true, discovery }`. 404 for missing records. |
| Vendor evidence and refresh | `GET /api/vendors/:vendorId/evidence`; `POST /api/vendors/:vendorId/refresh`; `POST /api/vendors/:vendorId/verify` | None | Evidence response includes `vendorId`, `verificationStatus`, and evidence entries (`source`, `url?`, `collectedAt`, `status`, `summary`). Refresh fetches the stored website again. The verify handler re-assesses stored evidence; it is not an independent identity/registry verification service. |
| Purchase list/details | `GET /api/purchases`; `GET /api/purchases/:purchaseId` | None | `{ success: true, purchases }` or `{ success: true, purchase }`. 404 for missing detail. |
| Purchase creation | `POST /api/purchases` | Required `{ budgetId, title, description }`; optional `category`, `vendorName`, `quantity`, `unitPrice`, `currency`, `amount`, `justification` | 201 `{ success: true, purchase }`. Backend requires an active owned budget and a positive amount within remaining available budget; errors include `BUDGET_NOT_FOUND`, `INVALID_PURCHASE_AMOUNT`, and `BUDGET_EXCEEDED`. |
| Purchase workflow | `POST /api/purchases/:purchaseId/submit`; `POST /api/purchases/:purchaseId/cancel` | None | `{ success: true, purchase }`; missing purchase is 404. Submitting records `submitted`; cancellation is rejected for paid/fulfilled purchases. |
| Purchase approval/rejection | `POST /api/purchases/:purchaseId/approve`; `POST /api/purchases/:purchaseId/reject` | Reject optionally accepts `{ reason? }` | `{ success: true, purchase }`. **There is no manager/role authorization in these handlers**: middleware only identifies the same user. The frontend therefore does not expose approval actions. |
| Purchase edits/activity/analytics | `PATCH /api/purchases/:purchaseId`; `GET /api/purchases/:purchaseId/activity`; `GET /api/purchases/analytics` | PATCH accepts an unvalidated object; activity/analytics have no body | Activity response `{ success: true, activity }`. Analytics `{ success: true, analytics: { totalPurchases, byStatus, averageAmount, totalAmount } }`; it has no date filters and aggregates raw purchase amounts without currency partitioning. |
| Quotes | `GET /api/quotes`; `GET /api/quotes/:id`; `POST /api/quotes/:id/reject` | Optional GET query `sessionId`; rejection optionally `{ reason? }` | Raw quote array/object. Rejection returns a raw quote. `POST /api/quotes/:id/approve` intentionally returns 409 `PAYMENT_PREPARATION_REQUIRED`; approval does not prepare or execute payment. |
| Quote payment preparation | `POST /api/quotes/:quoteId/prepare-payment` | No body | 201 or an existing preparation as 200: `{ success: true, payment }`. Requires live payment configuration, a payable quote with budget, verified merchant payment profile, current verified invoice, configured source token, wallet, signer authorization, sufficient balance and policy approval. |
| Payment confirmation | `POST /api/payments/:paymentId/confirm` | `{ confirm: true }` | `{ success: true, payment }`; 202 can indicate submission still unknown/in progress. The server revalidates the stored preparation and initiates the authorized Privy wallet transaction. |
| Payment readiness/assets | `GET /api/payments/readiness`; `GET /api/payments/supported-assets` | None | Readiness includes wallet/signer/configuration and balance fields. Assets include configured source asset(s) and destination assets associated with verified merchant payment profiles. |
| Payment tracking/history | `GET /api/payments`; `GET /api/payments/:paymentId`; `GET /api/payments/:paymentId/status` | None | History is `{ success: true, payments }`; status is `{ success: true, payment }` using the public payment shape. Status polling synchronizes source receipt and NEAR Intents settlement. |
| Transaction history/details | `GET /api/transactions`; `GET /api/transactions/:id` | None | Raw transaction array/object; list populates selected quote fields. A transaction record alone is not proof of destination-chain settlement. |
| Health | `GET /health` | Public | `{ status: "ok", timestamp }`. |

## Conversation continuity support

`POST /api/agent/chat` accepts an optional `sessionId`. Omitting it starts a
session; providing an owned session ID appends the user message to that session
and streams the response with the same session ID. The frontend should include
the active session ID on every follow-up request.

`GET /api/agent/sessions/:id` returns the session, its messages, and available
memory/context fields. `GET /api/agent/sessions/:id/memory` returns
`sessionSummary`, `transactionContext`, and the 12 most recent messages.
`GET /api/agent/sessions` is paginated and returns `{ sessions, page, limit,
total, totalPages }`. Rename, archive, and delete operations are not present in
the routes audited here.

Payment errors generally use `{ success: false, error, message }` with statuses
such as 400, 402, 403, 404, 409, and 503. The global error handler serializes
`{ error, stack? }`, using HTTP 500 when an error has no `statusCode`; therefore
some route-level schema validation failures may surface as 500. Vendor and
purchase route not-found responses use `{ error }`. The payment router also
applies a 30-request-per-minute rate limit.

## Existing versus newly present backend implementation

At audit time, the working tree showed budget, quote, transaction, agent, and
auth route files as tracked existing routes, with payment flow changes in the
working tree. Vendor and purchase route/model/service files and the payment
route and supporting payment services were untracked additions. The backend
tests include new vendor/purchase and payment-service tests. The backend test
suite passed (12 tests); `npm run build` did not pass because TypeScript reports
unsafe Mongoose query-to-`Promise` casts in `src/purchase.service.ts` and
`src/vendor.service.ts`.

## Frontend integration and verified gaps

- Integrated: Privy sync, agent chat/history, budgets, quotes, transaction
  history, quote payment preparation/confirmation/status, vendor candidate
  review/evidence, purchase creation/list/status/activity/analytics, and a
  read-only transfers capability page backed by payment readiness/assets.
- The Transfers page intentionally has no execution form: the available
  payment routes cannot represent an independent user-directed transfer.
- Vendor discovery is constrained to user-supplied URLs. The backend currently
  stores the candidate URL as the vendor name, and its current website evidence
  flow labels fetched pages corroborated; no general-purpose search, verified
  registry source, vendor offers or comparison contract exists.
- Purchase create requests do not accept `vendorId` or `quoteId` despite those
  fields in the model. There is no role/permission contract for approval,
  period/category budget schema, fulfillment mutation, purchase payment
  linkage workflow, alert/anomaly API, or date-filtered spending analytics.
- Payments are quote/invoice-bound, not general swaps. There is no standalone
  indicative quote endpoint, user-selectable source/destination route, free
  recipient transfer, arbitrary cross-chain swap, or corresponding payment
  preparation contract. The payment router returns `PAYMENTS_DISABLED` unless
  server live-payment settings are enabled; simulation mode is not accepted
  for preparation/confirmation.
- There is no backend contract for saved/recent vendor aggregation, activity
  feed, purchase approval authorization, or dashboard-level financial summary.
  The frontend therefore does not fabricate these values or expose unsupported
  actions.
