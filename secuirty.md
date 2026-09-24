## Data Security and Privacy

Since the system may handle sensitive project and land-acquisition information, security is integrated across the application.

### Security Measures

- **Authentication:** Secure login for authorized users.
- **Role-Based Access Control (RBAC):** Users can access only the features and projects permitted for their role.
- **Secure API Communication:** Protected communication between frontend, backend, and ML services.
- **Input Validation:** Project data is validated before being stored or processed.
- **Database Access Control:** Restrict unauthorized access to project and user data.
- **Audit Logging:** Record important changes, including who made the change, what was changed, and when.
- **Least-Privilege Access:** Users receive only the permissions required for their responsibilities.
- **Secret Management:** API keys, passwords, database credentials, JWT secrets, and cloud credentials are not stored in the repository.

### Data Protection Flow

```text
User
  ↓
Authentication
  ↓
Role Verification
  ↓
Authorized API Request
  ↓
Input Validation
  ↓
PostgreSQL / ML Service
  ↓
Audit Log
