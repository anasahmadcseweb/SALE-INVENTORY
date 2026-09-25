# StockFlow Security Specification & Rules TDD

## 1. Data Invariants
1. **User Data Isolation**: Documents in `/users/{userId}/*` can strictly only be read, written, or listed by the authenticated user whose `request.auth.uid == userId`.
2. **Owner Immutability**: The `userId` property on any subdocument must strictly equal `request.auth.uid`.
3. **Cross-Tenant Access Denial**: User A (`user_123`) cannot view, query, update, or delete products, sales, or activities belonging to User B (`user_456`).
4. **Id Validation**: Document IDs must be strings of alphanumeric/dash/underscore characters with length <= 128.
5. **No Anonymous Exploits**: Writes must require valid authentication.
6. **Payment Integrity**: Razorpay payment references and POS totals must adhere to numeric and string boundary limits.

## 2. The Dirty Dozen Payloads (Adversarial Test Vectors)
1. **Cross-User Data Scraping**: Unauthenticated client attempts `GET /users/user_victim/products`. (Result: PERMISSION_DENIED)
2. **Tenant Hijack Write**: User `attacker_uid` attempts `POST /users/user_victim/products/p1`. (Result: PERMISSION_DENIED)
3. **Owner Field Spoofing**: User `attacker_uid` attempts `POST /users/attacker_uid/products/p1` with payload `{ userId: 'user_victim' }`. (Result: PERMISSION_DENIED)
4. **ID Injection Poisoning**: User attempts write with document ID containing illegal characters `p_123/../../hack`. (Result: PERMISSION_DENIED)
5. **Denial-of-Wallet Long Payload**: User writes product name with 500,000 characters. (Result: PERMISSION_DENIED)
6. **Negative Inventory Invariant**: Product write with `price: -500` or `stock: -10`. (Result: PERMISSION_DENIED)
7. **Negative Sale Manipulation**: Sale record with `total: -99999`. (Result: PERMISSION_DENIED)
8. **Blanket Query Scraping**: User attempts collectionGroup query to read all sales across all stores. (Result: PERMISSION_DENIED)
9. **Unauthenticated Profile Creation**: Guest client attempts writing to `/users/any_id`. (Result: PERMISSION_DENIED)
10. **Shadow Field Injection**: User injects ghost field `{ isAdmin: true }` into product document. (Result: PERMISSION_DENIED)
11. **Activity Impersonation**: User logs an activity under another user's timeline. (Result: PERMISSION_DENIED)
12. **Malicious Delete**: User attempts deleting another user's sale or receipt record. (Result: PERMISSION_DENIED)
