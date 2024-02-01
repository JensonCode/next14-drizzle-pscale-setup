# Next 14 Drizzle PlanetScale Setup

This repository serves as a quick start for setting up a full-stack application using Next 14, TypeScript, MySQL database (PlanetScale), Drizzle ORM, and Tailwind CSS.

## Purpose

The purpose of this repository is to provide a clean and efficient structure for a type-safe JavaScript-based project, leveraging React RSC and Next.js 14 features.

## Database

### PlanetScale

[PlanetScale](https://planetscale.com/) is a MySQL-compatible, serverless database platform. It offers a cost-effective serverless MySQL solution, particularly suitable for simple applications.

**Pros:**

- Easy setup
- Generous free tier
- Separate branches for development and production environments

**Cons:**

- Requires handling foreign key constraints without direct support

For more information, check the [PlanetScale documentation](https://planetscale.com/docs/concepts/foreign-key-constraints) and [pricing details](https://planetscale.com/pricing).

### Drizzle ORM

[Drizzle](https://orm.drizzle.team/) is a TypeScript ORM for SQL databases.

**Key Features:**

- Resolves PlanetScale's foreign key constraints with relationship definition
- Seamless integration with TypeScript codebase
- Utilizes SQL-like syntax
- Compatible with Server Action and RSC

## Example

- Define admin schema
  The exported type `Admin` can be used everywhere in the app route

```ts
// src/db/schema/admin.ts

import { mysqlTable, varchar, serial, timestamp } from "drizzle-orm/mysql-core";

export const table_admins = mysqlTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 256 }).notNull(),
  password: varchar("password", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Admin = typeof table_admins.$inferSelect;
```

- generate SQL and migration

```md
npm run drizzle-kit generate:mysql
npm run drizzle-kit push:mysql
```

## Zod

[Zod](https://zod.dev/) serves as an efficient schema builder, playing a crucial role in parsing form data and declaring data types for the entire application.

**Usage:**

- Previously used with React-Hook-Form for form implementations
- In conjunction with server action, replaces RHF for building a generic form component

## Example validator

- Define form schema

```ts
// src/lib/zod/admin.ts

import { z } from "zod";

export const LoginFormSchema = z.object({
  username: z.string().min(0, {
    message: "Admin username is required.",
  }),
  password: z.string().min(0, {
    message: "Admin password is required.",
  }),
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;
```

- parse form data

```ts
// src/lib/zod/index.ts
import { ZodEffects, ZodError, ZodObject } from "zod";

type Schema = ZodObject<any> | ZodEffects<ZodObject<any>>;

export const parseFormData = <ReturnType>(
  formData: FormData,
  schema?: Schema,
): { data: ReturnType | undefined; errors: ZodError | undefined } => {
  try {
    const form = Object.fromEntries(formData.entries());

    const data = (schema as Schema).parse(form) as ReturnType;

    return { data: data, errors: undefined };
  } catch (err) {
    return { data: undefined, errors: err as ZodError };
  }
};
```

- I made a function to response the zod parse error

```ts
// src/server/errors/zod_errors.ts
import { ZodError } from "zod";
import { FormErrors } from "../state";

export const ZodFormError = (errors: ZodError) => {
  const formError: FormErrors = {};

  errors.errors.map((err) => (formError[err.path[0]] = err.message));

  return formError;
};
```

- Parse form data

```ts
// src/server/actions/admin.ts
export const adminLogin = async (prevState: FormState, formData: FormData) => {
  try {
    const { data, errors } = parseFormData<LoginFormData>(
      formData,
      LoginFormSchema,
    );
    if (errors) {
      throw ZodFormError(errors);
    }

    // ....

    return SuccessState("Login: Success");
  } catch (error) {
    return FailState(error as FormErrors);
  }
};
```

## Next 14

### Server Action

To address the challenge of integrating new features with the React codebase, a "server" folder has been added to the `src` directory. This folder contains everything related to server action, data fetching services, and server-side errors. It interfaces with the `db` folder, which manages table schema, schema relationships, and migrations.

This structure ensures a clear separation between app route code and "backend" code management (using the term symbolically here).

## Example Code - use form state

a wrapper of `useFormState`

```ts
// src/hooks/useFormStateHook.ts
"use client";
import { useFormState } from "react-dom";
import { DefaultState, FormState } from "@/server/state";

export const useFormStateHook = (
  action: (prev: FormState, data: FormData) => Promise<FormState>,
) => {
  const [formState, formAction] = useFormState(action, DefaultState());

  return { formState, formAction };
};
```

- use the hook in client side form

```tsx
// src/components/LoginForm.tsx
import { useFormStatusHook } from "@/hooks/useFormStatusHook";
import { adminLogin } from "@/server/actions/admin_actions";

export default function LoginForm() {
  const { formState, formAction } = useFormStatusHook(adminLogin);

  return (
    <form id="login-admin" action={formAction}>
      //....
      <span className="py-4 text-red-500">{formState.messgae}</span>
    </form>
  );
}
```

### Opt-out Caching

Next 14's default cache behavior can be both convenient and challenging. The default caching strategy can be opted out by using the `src/server/cache.ts` revalidator. This wrapper allows better control over caching and avoids unwanted persistence of data until revalidation.

## Example Code - unstable_cache in Next 14

- Define a wrapper

```ts
//src/server/cache.ts
import { unstable_cache } from "next/cache";

export const unstable_cache_wrapper = <T, A>(
  call: (...args: A[]) => Promise<T>,
  tag: string,
) => {
  return unstable_cache(call, [tag], { tags: [tag] });
};
```

- Add a dog revalidation tag to above code

```ts
//src/server/cache.ts
// ...

export const DOG_MUTATION_TAG = "dog";
```

- Use the tag and Next.js magic `revalidateTag`

```ts
//src/server/dog_action.ts
import { revalidateTag } from "next/cache";

export const insertDog = async (prevState: FormState, formData: FormData) => {
  try {
    // ...

    revalidateTag(DOG_MUTATION_TAG);

    return SuccessState("Add new dog: Success");
  } catch (error) {
    return FailState(error as FormErrors);
  }
};
```

- In the cached page

```tsx
//src/app/dog/page.ts
import {
  DOG_MUTATION_TAG,
  unstable_cache_wrapper,
} from "@/server/cache";

import { getDogs } from "@/server/services/dog_service";

export async function page() {

	const getDogCache = unstable_cache_wrapper(
		getDogs,
		DOG_MUTATION_TAG,
  	);

    const dogs = await getDogCache();

	return (
		<div>
			{dogs.map((dog, index) => (
				<span key={'dog-list-'index}>dog.name</span>
			))}
		</div>
	)
}
```
