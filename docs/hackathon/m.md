   # Multi-Tenancy Architecture & Code Flow

   Use this script to confidently explain the multi-tenancy implementation to the judges.

   ---

   ## 1. The Theory: Why Multi-Tenancy?
   **Start your explanation with:**
   > "Our application is a B2B SaaS platform. This means we have multiple companies (Organizations/Tenants) using the same application and database. The biggest challenge in B2B SaaS is **data isolation**—a user from Company A should never see the rides, users, or data of Company B. If they do, that's a critical security breach."

   **How we solved it:**
   > "Instead of relying on developers to remember to add `WHERE org_id = ?` in every single database query (which is prone to human error), we built a centralized RBAC (Role-Based Access Control) and Tenancy Guard. It acts as an unbreakable firewall between the API routes and the Database."

   ---

   ## 2. Live Demo: Proving the Multi-Tenancy Works
   **If the judge asks to see it in action, follow these steps:**
   1. **Show Data Isolation:** Open two different browsers (or one Incognito window). 
      - Log into `admin@demo.dev` (Acme Company). Create a new vehicle or ride.
      - Log into `admin@globex.dev` (Globex Transit) in the other window. Show the judge that the Acme vehicle is **completely invisible** to Globex.
   2. **Show Role Validation:** 
      - While logged in as an Employee (`rider@demo.dev`), try to manually navigate to the `/admin` URL.
      - The platform will immediately block access because the `employee` role does not have `company_admin` privileges in the matrix.
   3. **Show Super Admin powers:**
      - Log into `superadmin@demo.dev`. Show how the Super Admin has a platform-wide view of all organizations, bypassing the local tenancy filters entirely.

   ---

   ## 3. Code Walkthrough: `lib/permissions.ts` Step-by-Step

   If the judge asks to see the code, open `lib/permissions.ts`. This file is our **Single Source of Truth** for security. Walk them through the file section by section:

   ### Step 1: The Statement (Resource definitions)
   *(Lines 24-50)*
   > "First, we list every single resource in our system (like organizations, users, rides) and define exactly what actions can be performed on them. This is our master dictionary of actions."

   ### Step 2: The Roles Matrix
   *(Lines 57-97)*
   > "Next, we map those actions to our three core roles: `super_admin`, `company_admin`, and `employee`. 
   > - The **Super Admin** operates the platform but never drives (no ride permissions). 
   > - The **Company Admin** manages their specific organization's configuration. 
   > - The **Employee** manages their own day-to-day rides."

   ### Step 3: Record-level Ownership Validation
   *(Lines 117-132: `canEdit`, `canDelete`, `canView`)*
   > "Even within the same organization, employees shouldn't be able to delete each other's rides. These helper functions ensure that only the creator of a record (or their Company Admin) can modify it."

   ### Step 4: The Tenancy Scope (`scopedWhere`)
   *(Lines 134-158)*
   > "This is the most critical function in the file. Every time we query the database with Drizzle ORM, we wrap the query conditions in `scopedWhere(tenant, table)`. If the user is a `super_admin`, they see everything. If they are a standard tenant, this function forcefully injects the SQL equivalent of `AND table.org_id = tenant.org_id`. It removes the opportunity for developers to accidentally leak data."

   ### Step 5: The Guard (`requirePermission`)
   *(Lines 160-180)*
   > "Finally, this is the Guard that sits at the top of every secure API route. It does three things:
   > 1. Fetches the active Session.
   > 2. Checks our Permissions Matrix to see if the user's role is allowed to perform the action.
   > 3. If allowed, it returns a secure `Tenant` context object containing the user's `orgId`, which is then passed down into `scopedWhere`."

   ---

   ## 4. Key Takeaways to Impress the Judge

   - **"Fail-Secure by Design"**: By requiring `scopedWhere` on all queries, a developer literally cannot forget to add the `orgId` filter. The compiler will complain if they don't pass the `tenant` object.
   - **"404 vs 403"**: By filtering at the SQL query level, cross-tenant data requests return a `404 Not Found`. Returning a `403 Forbidden` would imply the data exists, which is a security risk known as "Data Enumeration". We prevent that entirely.
   - **"Single Source of Truth"**: All permissions are centrally located in `lib/permissions.ts`. We don't scatter `if (user.role === 'admin')` statements randomly throughout our codebase.
